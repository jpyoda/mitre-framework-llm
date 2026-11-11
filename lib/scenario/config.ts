import "server-only";

// LLM settings, read from the server environment. See .env.example.

export const DEFAULT_MODEL = "gpt-5-mini";

export function llmConfig() {
  const limit = Number.parseInt(process.env.SCENARIO_RATE_LIMIT ?? "", 10);
  return {
    /** Server-side key. Optional: users can bring their own key instead. */
    serverApiKey: process.env.OPENAI_API_KEY || undefined,
    /** For Azure OpenAI or local OpenAI-compatible servers (Ollama, vLLM, ...). */
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    model: process.env.LLM_MODEL || DEFAULT_MODEL,
    /** Scenarios per client IP per hour when the server key is used. 0 turns the limit off. */
    rateLimitPerHour: Number.isNaN(limit) ? 10 : limit,
  };
}

export function hasServerApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
