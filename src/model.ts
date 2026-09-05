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

/**
 * Constrained decoding. **Off by default**, on with CAPTURE_STRICT=1.
 *
 * It was on for a day and had to come off. What it buys is real: `required`
 * in a tool schema is otherwise a suggestion, and the model omitted the whole
 * `modified` key in one call of three — not "no changes", but not answering,
 * and nothing downstream can tell those apart (§2.1).
 *
 * What it costs is worse. Generation runs at roughly a third of the rate, and
 * the cost scales with how much the parse emits. Measured back to back,
 * 2026-09-05:
 *
 *   six-item capture    6.2s off  ->  14.6s on   (blows the client timeout)
 *   three-item capture  3.5s off  ->   3.9s on
 *
 * Fourteen seconds is past the calling app's own timeout, so with strict on
 * the six-item case falls back to keyword parsing every time — which is a
 * worse answer than the imperfect model parse it was meant to protect.
 *
 * Kept as a switch rather than deleted, because which way this goes is a
 * measurement and not a belief: a faster model, or a schema that emits less,
 * changes the arithmetic. Compare the two BACK TO BACK when you re-check.
 * API latency moves enough between sessions that a figure from yesterday
 * against one from today says nothing — that is how this was nearly recorded
 * backwards.
 */
const STRICT = process.env.CAPTURE_STRICT === "1";

/**
 * Does this schema satisfy strict tool use?
 *
 * Strict requires `additionalProperties: false` on every object. The caller's
 * schema is nested inside ours as `item`, and the caller wrote it, so it may
 * not comply — and a 400 for a schema this service does not control is the
 * caller being punished for our choice. Checked here instead, and strict is
 * simply not requested when it cannot be satisfied.
 */
export function strictCompatible(schema: unknown): boolean {
  if (Array.isArray(schema)) return schema.every(strictCompatible);
  if (typeof schema !== "object" || schema === null) return true;

  const s = schema as Record<string, unknown>;
  const isObjectType = s.type === "object" ||
    (Array.isArray(s.type) && (s.type as unknown[]).includes("object"));
  if (isObjectType && s.additionalProperties !== false) return false;

  return Object.values(s).every(strictCompatible);
}

/** The caller's schema, nested inside the shape this service returns. */
export function wrap(schema: Record<string, unknown>) {
  const quoted = {
    confidence: { type: "number", description: "0 to 1. How sure you are this is what the speaker meant." },
    source_text: { type: "string", description: "Copied character for character from the capture." },
  };
  const object = (required: string[], properties: Record<string, unknown>) => ({
    type: "object",
    // Required by strict tool use, and harmless without it.
    additionalProperties: false,
    required,
    properties,
  });

  return object(["created", "modified", "unparsed"], {
    created: {
      type: "array",
      items: object(["item", "confidence", "source_text"], { item: schema, ...quoted }),
    },
    modified: {
      type: "array",
      items: object(["target", "intent", "confidence", "source_text"], {
        target: object(["id", "described_as"], {
          // A plain string, and NOT `["string", "null"]`, which is what this
          // was. Measured 2026-09-05 on the second dictation: the union cost
          // roughly five seconds a parse under strict decoding — generation
          // ran at 46 tokens/sec against 155 without it, taking the whole
          // call from ~8.5s to ~3.7s. Three runs each way, identical output.
          //
          // Constrained decoding has to keep both branches of a union alive
          // while it emits, and it pays for that on every token after it.
          // Empty string carries "I am not sure" instead, and parse.ts turns
          // it back into null immediately, so nothing downstream sees the
          // difference. Do not tidy this back into a union.
          id: { type: "string", description: "An id from the supplied records. Empty string if you are not sure which one." },
          described_as: { type: "string", description: "The speaker's own words for the record." },
        }),
        intent: { type: "string", description: "What to do to it, in the speaker's words." },
        ...quoted,
      }),
    },
    unparsed: {
      type: "array",
      items: object(["text", "reason"], {
        text: { type: "string", description: "The speaker's words, verbatim." },
        reason: { type: "string", description: "Why it could not be mapped." },
      }),
    },
  });
}

/**
 * Per-model-family request parameters. The two families take opposite knobs.
 *
 * Haiku 4.5 and earlier accept `temperature`. **This is set to 0**, and it was
 * the largest single source of wrong answers here — not a subtle one. The API
 * default is 1.0, so every parse was sampled at full randomness and the same
 * paragraph produced a different reading of the same sentence from one call to
 * the next. Measured after setting it: item count, titles and dates are
 * identical across consecutive calls, where before they were not.
 *
 * Temperature 0 is greedy decoding, not a determinism guarantee — batching and
 * floating point still let identical inputs differ. Treat repeated identical
 * output as strong evidence, never proof (§2.1: measured, not assumed).
 *
 * The 4.6+ models removed sampling parameters and return 400 if sent one; they
 * take `output_config.effort` instead, and on Opus thinking is on by default,
 * which this parse does not need and would pay for in latency.
 */
function samplingFor(model: string) {
  return model.startsWith("claude-haiku")
    ? { temperature: 0 }
    : { output_config: { effort: "low" as const } };
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
        ...samplingFor(model),
        system: request.system,
        messages: [{ role: "user", content: request.user }],
        tools: [
          {
            name: TOOL_NAME,
            description: "Return the candidate items found in the capture.",
            input_schema: wrap(request.schema) as Anthropic.Tool["input_schema"],
            // Without this, `required` on the schema above is a suggestion,
            // and the model omitted the whole `modified` key in one call of
            // three at temperature 0 — not "no changes", but not answering,
            // and the two are indistinguishable downstream (§2.1).
            //
            // It is not free. Constrained decoding runs generation at roughly
            // a third of the rate, and the cost scales with how much the
            // parse emits: measured 2026-09-05, a six-item capture went from
            // 6.2s to 14.6s and blew the client timeout, while a three-item
            // one went from 4.7s to 3.7s. So it is a switch, defaulted on and
            // turned off by CAPTURE_STRICT=0, and whether it earns its cost
            // is a measurement rather than a belief.
            //
            // Only requested when the caller's own schema can satisfy strict;
            // otherwise a 400 would punish the caller for our choice.
            ...(STRICT && strictCompatible(request.schema) ? { strict: true } : {}),
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
