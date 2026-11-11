import OpenAI, { APIError } from "openai";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import { z } from "zod";
import { getGroup } from "@/lib/attack";
import { USER_KEY_HEADER } from "@/constants/api";
import { INDUSTRIES, SIZES } from "@/constants/companyAttributes";
import { DEFAULT_LOCALE, LANGUAGES } from "@/constants/languages";
import { llmConfig } from "@/lib/scenario/config";
import { buildScenarioMessages } from "@/lib/scenario/prompt";
import { checkRateLimit } from "@/lib/scenario/rateLimit";

export const dynamic = "force-dynamic";


const RequestSchema = z.object({
  industry: z.enum(INDUSTRIES as [string, ...string[]]),
  size: z.enum(SIZES as [string, ...string[]]),
  groupId: z.string().regex(/^G\d{4}$/),
  locale: z.string().optional(),
});

type ScenarioErrorCode =
  | "invalid_request"
  | "unknown_group"
  | "missing_api_key"
  | "invalid_api_key"
  | "rate_limited"
  | "provider_error";

function errorResponse(
  code: ScenarioErrorCode,
  message: string,
  status: number,
  headers?: HeadersInit
) {
  return Response.json({ code, error: message }, { status, headers });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", "Invalid scenario request.", 400);
  }
  const { industry, size, groupId, locale } = parsed.data;

  const group = getGroup(groupId);
  if (!group) {
    return errorResponse("unknown_group", `Unknown threat actor group ${groupId}.`, 404);
  }

  const config = llmConfig();
  const userKey = request.headers.get(USER_KEY_HEADER)?.trim() || undefined;
  const apiKey = userKey ?? config.serverApiKey;
  if (!apiKey) {
    return errorResponse(
      "missing_api_key",
      "No OpenAI API key: enter one in the sidebar or set OPENAI_API_KEY on the server.",
      400
    );
  }

  // Limit only requests that spend the server's key.
  if (!userKey) {
    const limit = checkRateLimit(
      `scenario:${clientIp(request)}`,
      config.rateLimitPerHour,
      60 * 60 * 1000
    );
    if (!limit.allowed) {
      return errorResponse(
        "rate_limited",
        "Too many scenarios requested. Try again later or use your own API key.",
        429,
        { "Retry-After": String(limit.retryAfterSeconds) }
      );
    }
  }

  const language =
    LANGUAGES.find((l) => l.value === locale)?.fullValue ??
    LANGUAGES.find((l) => l.value === DEFAULT_LOCALE)!.fullValue;

  const client = new OpenAI({ apiKey, baseURL: config.baseURL });

  let completion: Stream<ChatCompletionChunk>;
  try {
    completion = await client.chat.completions.create({
      model: config.model,
      messages: buildScenarioMessages({ industry, size, group, language }),
      stream: true,
    });
  } catch (err) {
    if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
      return errorResponse("invalid_api_key", "The OpenAI API key was rejected.", 401);
    }
    if (err instanceof APIError && err.status === 429) {
      return errorResponse(
        "rate_limited",
        "The LLM provider is rate limiting requests. Try again shortly.",
        429
      );
    }
    // Never log the request itself: it may carry the user's key.
    console.error("Scenario generation failed:", err instanceof Error ? err.message : err);
    return errorResponse("provider_error", "The LLM provider returned an error.", 502);
  }

  // Stream plain text to the browser as it arrives.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        console.error("Scenario stream failed:", err instanceof Error ? err.message : err);
        controller.error(err);
      }
    },
    cancel() {
      completion.controller.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Model": config.model,
    },
  });
}
