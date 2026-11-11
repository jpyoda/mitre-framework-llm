// A minimal OpenAI-compatible server for end-to-end tests. It streams a short
// Markdown scenario for /v1/chat/completions and rejects the key "sk-bad".
// GET /__requests returns the request bodies it received.
import { createServer } from "node:http";

const port = Number(process.env.MOCK_OPENAI_PORT ?? 4010);
const received = [];

const SCENARIO = [
  "# Test scenario\n\n",
  "| Phase | Technique |\n|---|---|\n",
  "| Initial Access | T1566.001 |\n\n",
  "- **Inject:** EDR alert on a finance laptop\n",
];

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/__requests") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(received));
  }
  if (req.method === "GET") {
    res.writeHead(200);
    return res.end("ok");
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    received.push({ auth: req.headers.authorization, body: JSON.parse(body || "{}") });
    if (req.headers.authorization === "Bearer sk-bad") {
      res.writeHead(401, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: { message: "Incorrect API key provided", code: "invalid_api_key" } }));
    }
    res.writeHead(200, { "content-type": "text/event-stream" });
    for (const content of SCENARIO) {
      const chunk = { id: "c", object: "chat.completion.chunk", created: 0, model: "mock", choices: [{ index: 0, delta: { content }, finish_reason: null }] };
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      await new Promise((r) => setTimeout(r, 100));
    }
    res.end("data: [DONE]\n\n");
  });
}).listen(port, () => console.log(`mock OpenAI on ${port}`));
