/**
 * Where does the parse spend its time? Read-only, and it COSTS MONEY —
 * one real model call. Run it when comparing models or when the acceptance
 * test starts warning about the §10 target:
 *
 *     npx tsx scripts/latency-probe.mts
 *
 * It imports the real prompt and the real tool schema. A second copy of
 * either here would drift and then be measured instead of the service
 * (bug family (b)).
 */
import Anthropic from "@anthropic-ai/sdk";
import { loadEnvLocal } from "../src/env.ts";
import { SYSTEM, userMessage } from "../src/prompt.ts";
import { DEFAULT_MODEL, strictCompatible, wrap } from "../src/model.ts";
import { DICTATION, TASK_SCHEMA, EXISTING } from "../tests/fixtures/dictation.ts";
import { DICTATION_2, EXISTING_2 } from "../tests/fixtures/dictation-2.ts";

// Which dictation: `npx tsx scripts/latency-probe.mts 2` for the second.
const second = process.argv.includes("2");
// `--no-strict` to time the same request without constrained decoding.
const STRICT = !process.argv.includes("--no-strict");
const TEXT = second ? DICTATION_2 : DICTATION;
const RECORDS = second ? EXISTING_2 : EXISTING;

loadEnvLocal();
const model = process.env.CAPTURE_MODEL || DEFAULT_MODEL;
const t0 = Date.now();
let connected = 0, firstToken = 0;

const stream = new Anthropic({ maxRetries: 0 }).messages.stream({
  model,
  max_tokens: 4096,
  // Match what the service actually sends. The first version of this probe
  // predated temperature and strict, so it timed a request the service does
  // not make — bug family (c), the instrument not sharing the code's
  // assumptions.
  ...(model.startsWith("claude-haiku") ? { temperature: 0 } : {}),
  system: SYSTEM,
  messages: [{ role: "user", content: userMessage(TEXT, RECORDS) }],
  tools: [{ name: "emit", description: "Return the candidate items found in the capture.",
            ...(STRICT && strictCompatible(TASK_SCHEMA) ? { strict: true } : {}),
            input_schema: wrap(TASK_SCHEMA) as never }],
  tool_choice: { type: "tool", name: "emit" },
});

stream.on("streamEvent", (e) => {
  if (!connected) connected = Date.now();
  if (!firstToken && e.type === "content_block_delta") firstToken = Date.now();
});

const msg = await stream.finalMessage();
const t1 = Date.now();

console.log(`  dictation          : ${second ? 2 : 1}   strict: ${STRICT}`);
console.log(`  model              : ${msg.model}`);
console.log(`  connection + queue : ${connected - t0} ms`);
console.log(`  to first token     : ${firstToken - t0} ms`);
console.log(`  generating         : ${t1 - firstToken} ms   <- output-bound if this dominates`);
console.log(`  TOTAL              : ${t1 - t0} ms`);
console.log(`  input tokens       : ${msg.usage.input_tokens}`);
console.log(`  output tokens      : ${msg.usage.output_tokens}`);
console.log(`  output tok/sec     : ${(msg.usage.output_tokens / ((t1 - firstToken) / 1000)).toFixed(0)}`);
