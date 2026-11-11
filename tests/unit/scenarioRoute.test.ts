import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError, InternalServerError, RateLimitError } from "openai";

// Replace the OpenAI client with a fake, keeping the SDK's real error classes
// so the route's `instanceof APIError` checks are exercised for real.
const create = vi.fn();
const constructed: { apiKey?: string; baseURL?: string }[] = [];
vi.mock("openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("openai")>();
  class FakeOpenAI {
    chat = { completions: { create } };
    constructor(options: { apiKey?: string; baseURL?: string }) {
      constructed.push(options);
    }
  }
  return { ...actual, default: FakeOpenAI };
});

const { POST } = await import("@/app/api/scenario/route");

const VALID = {
  industry: "Healthcare",
  size: "Small (1-50 employees)",
  groupId: "G0007",
  locale: "es",
};

let ipCounter = 0;
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/scenario", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // A fresh IP per request unless a test sets one, so the rate limit
      // only kicks in where a test wants it.
      "x-forwarded-for": `10.0.0.${++ipCounter}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** An async iterable shaped like the SDK's chat completion stream. */
function fakeStream(parts: string[]) {
  return {
    controller: new AbortController(),
    async *[Symbol.asyncIterator]() {
      for (const content of parts) yield { choices: [{ delta: { content } }] };
      yield { choices: [{ delta: {} }] }; // final chunk carries no text
    },
  };
}

const headers = new Headers();

beforeEach(() => {
  create.mockReset();
  constructed.length = 0;
  process.env.OPENAI_API_KEY = "sk-server";
  delete process.env.OPENAI_BASE_URL;
  delete process.env.LLM_MODEL;
  delete process.env.SCENARIO_RATE_LIMIT;
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe("POST /api/scenario", () => {
  it("streams the model's text back as plain text", async () => {
    create.mockResolvedValue(fakeStream(["# Escenario", "\n\nTexto"]));
    const res = await POST(request(VALID));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("x-model")).toBe("gpt-5-mini");
    expect(await res.text()).toBe("# Escenario\n\nTexto");

    const params = create.mock.calls[0][0];
    expect(params.model).toBe("gpt-5-mini");
    expect(params.stream).toBe(true);
    expect(params.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user"]);
    expect(params.messages[1].content).toContain("APT28 (MITRE ATT&CK G0007)");
    expect(params.messages[1].content).toContain("Write the whole answer in Spanish.");
  });

  it("uses LLM_MODEL and OPENAI_BASE_URL from the environment", async () => {
    process.env.LLM_MODEL = "my-model";
    process.env.OPENAI_BASE_URL = "http://localhost:11434/v1";
    create.mockResolvedValue(fakeStream(["ok"]));
    await (await POST(request(VALID))).text();
    expect(create.mock.calls[0][0].model).toBe("my-model");
    expect(constructed[0].baseURL).toBe("http://localhost:11434/v1");
  });

  it("prefers the user's own key over the server key", async () => {
    create.mockResolvedValue(fakeStream(["ok"]));
    await POST(request(VALID, { "x-openai-api-key": "sk-user" }));
    expect(constructed[0].apiKey).toBe("sk-user");
  });

  it("falls back to English for an unknown locale", async () => {
    create.mockResolvedValue(fakeStream(["ok"]));
    await POST(request({ ...VALID, locale: "xx" }));
    expect(create.mock.calls[0][0].messages[1].content).toContain("Write the whole answer in English.");
  });

  it.each([
    ["malformed JSON", "not json"],
    ["an unknown industry", { ...VALID, industry: "Pirates" }],
    ["an unknown size", { ...VALID, size: "Huge" }],
    ["a malformed group ID", { ...VALID, groupId: "APT28" }],
  ])("rejects %s with 400", async (_label, body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid_request");
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 404 for a group that is not in the data", async () => {
    const res = await POST(request({ ...VALID, groupId: "G9999" }));
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("unknown_group");
  });

  it("asks for a key when neither the server nor the user has one", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await POST(request(VALID));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("missing_api_key");
    expect(create).not.toHaveBeenCalled();
  });

  it("maps provider errors to stable codes", async () => {
    create.mockRejectedValueOnce(new AuthenticationError(401, undefined, "bad key", headers));
    let res = await POST(request(VALID, { "x-openai-api-key": "sk-bad" }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("invalid_api_key");

    create.mockRejectedValueOnce(new RateLimitError(429, undefined, "slow down", headers));
    res = await POST(request(VALID));
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe("rate_limited");

    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    create.mockRejectedValueOnce(new InternalServerError(500, undefined, "boom", headers));
    res = await POST(request(VALID));
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("provider_error");
    quiet.mockRestore();
  });

  it("stops quietly when the browser disconnects mid-stream", async () => {
    const abort = new AbortController();
    create.mockResolvedValue({
      controller: abort,
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: "first" } }] };
        // Like the SDK: a pending read rejects once the request is aborted.
        await new Promise((_, reject) =>
          abort.signal.addEventListener("abort", () => reject(new Error("Request was aborted.")))
        );
      },
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const reader = (await POST(request(VALID))).body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("first");
    await reader.cancel();
    await new Promise((r) => setTimeout(r, 10));

    expect(abort.signal.aborted).toBe(true);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("never logs the user's key", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    create.mockRejectedValueOnce(new InternalServerError(500, undefined, "boom", headers));
    await POST(request(VALID, { "x-openai-api-key": "sk-secret-user-key" }));
    expect(JSON.stringify(log.mock.calls)).not.toContain("sk-secret-user-key");
    log.mockRestore();
  });

  it("rate limits requests that use the server key, but not the user's own key", async () => {
    process.env.SCENARIO_RATE_LIMIT = "2";
    create.mockImplementation(async () => fakeStream(["ok"]));
    const ip = { "x-forwarded-for": "192.0.2.50" };

    expect((await POST(request(VALID, ip))).status).toBe(200);
    expect((await POST(request(VALID, ip))).status).toBe(200);
    const limited = await POST(request(VALID, ip));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);

    const ownKey = await POST(request(VALID, { ...ip, "x-openai-api-key": "sk-user" }));
    expect(ownKey.status).toBe(200);
  });
});
