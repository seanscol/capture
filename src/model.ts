/**
 * The live model call. The only file that talks to Anthropic, and the only
 * file that reads ANTHROPIC_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ModelClient, ModelRequest, ModelReply } from "./types.ts";

/**
 * §10: "Model chosen by passing the acceptance test — starting from the
 * smallest." This is the smallest and fastest. The constant lives here and
 * the result echoes it back (§5.8); nothing downstream should assume it.
 *
 * Escalation path, if the acceptance test fails: claude-sonnet-5, then
 * claude-opus-5. Record which one it ended on in DECISIONS.md, not here.
 */
export const DEFAULT_MODEL = "claude-haiku-4-5";

/** PLACEHOLDER (§5.7). Unproven against a cold start. */
const TIMEOUT_MS = Number(process.env.CAPTURE_TIMEOUT_MS ?? 10_000);
const MAX_TOKENS = 4096;

const TOOL_NAME = "emit";

/** The caller's schema, nested inside the shape this service returns. */
export function wrap(schema: Record<string, unknown>) {
  const quoted = {
    confidence: { type: "number", description: "0 to 1. How sure you are this is what the speaker meant." },
    source_text: { type: "string", description: "Copied character for character from the capture." },
  };
  return {
    type: "object",
    required: ["created", "modified", "unparsed"],
    properties: {
      created: {
        type: "array",
        items: {
          type: "object",
          required: ["item", "confidence", "source_text"],
          properties: { item: schema, ...quoted },
        },
      },
      modified: {
        type: "array",
        items: {
          type: "object",
          required: ["target", "intent", "confidence", "source_text"],
          properties: {
            target: {
              type: "object",
              required: ["id", "described_as"],
              properties: {
                id: { type: ["string", "null"], description: "An id from the supplied records, or null if you are not sure which one." },
                described_as: { type: "string", description: "The speaker's own words for the record." },
              },
            },
            intent: { type: "string", description: "What to do to it, in the speaker's words." },
            change: { type: "object", description: "Fields to change, if the schema expresses them." },
            ...quoted,
          },
        },
      },
      unparsed: {
        type: "array",
        items: {
          type: "object",
          required: ["text", "reason"],
          properties: {
            text: { type: "string", description: "The speaker's words, verbatim." },
            reason: { type: "string", description: "Why it could not be mapped." },
          },
        },
      },
    },
  };
}

export function liveModel(model = process.env.CAPTURE_MODEL || DEFAULT_MODEL): ModelClient {
  // Constructed per call rather than at module load, so an unset key is an
  // error at the point of use and never at import time — the handler must be
  // able to return 401 without this file having run (§10, auth before spend).
  const client = new Anthropic({
    timeout: TIMEOUT_MS,
    // No retries. A retry doubles both the latency and the bill, and §10 has
    // a better answer than either: "If the service is slow or down, the raw
    // is safe and the app falls back to its existing parser and says so."
    maxRetries: 0,
  });

  return {
    id: model,
    async complete(request: ModelRequest): Promise<ModelReply> {
      const reply = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        // Haiku 4.5 rejects output_config.effort; the larger models take it,
        // and on Opus thinking is on by default, which this parse does not
        // need and would pay for in latency. Low effort keeps the escalation
        // rungs comparable on speed instead of comparing a thinking model
        // against a non-thinking one and calling the difference capability.
        ...(model.startsWith("claude-haiku") ? {} : { output_config: { effort: "low" as const } }),
        system: request.system,
        messages: [{ role: "user", content: request.user }],
        tools: [
          {
            name: TOOL_NAME,
            description: "Return the candidate items found in the capture.",
            input_schema: wrap(request.schema) as Anthropic.Tool["input_schema"],
          },
        ],
        // Forced tool use. Supported on Haiku 4.5, Sonnet 5 and Opus 5 — the
        // whole escalation path. Fable and Mythos reject it with a 400, so
        // moving to one of those means switching to tool_choice auto plus an
        // instruction naming the tool.
        tool_choice: { type: "tool", name: TOOL_NAME },
      });

      // A text-only reply is not an error here. It falls through as an
      // unreadable answer and becomes unparsed, verbatim (§2.2).
      const call = reply.content.find((b) => b.type === "tool_use" && b.name === TOOL_NAME);

      return {
        model: reply.model,
        json: call && call.type === "tool_use" ? call.input : null,
      };
    },
  };
}
