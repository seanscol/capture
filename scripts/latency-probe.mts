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
import { DEFAULT_MODEL, wrap } from "../src/model.ts";
import { DICTATION, TASK_SCHEMA, EXISTING } from "../tests/fixtures/dictation.ts";

loadEnvLocal();
const model = process.env.CAPTURE_MODEL || DEFAULT_MODEL;
const t0 = Date.now();
let connected = 0, firstToken = 0;

const stream = new Anthropic({ maxRetries: 0 }).messages.stream({
  model,
  max_tokens: 4096,
  system: SYSTEM,
  messages: [{ role: "user", content: userMessage(DICTATION, EXISTING) }],
  tools: [{ name: "emit", description: "Return the candidate items found in the capture.",
            input_schema: wrap(TASK_SCHEMA) as never }],
  tool_choice: { type: "tool", name: "emit" },
});

stream.on("streamEvent", (e) => {
  if (!connected) connected = Date.now();
  if (!firstToken && e.type === "content_block_delta") firstToken = Date.now();
});

const msg = await stream.finalMessage();
const t1 = Date.now();

console.log(`  model              : ${msg.model}`);
console.log(`  connection + queue : ${connected - t0} ms`);
console.log(`  to first token     : ${firstToken - t0} ms`);
console.log(`  generating         : ${t1 - firstToken} ms   <- output-bound if this dominates`);
console.log(`  TOTAL              : ${t1 - t0} ms`);
console.log(`  input tokens       : ${msg.usage.input_tokens}`);
console.log(`  output tokens      : ${msg.usage.output_tokens}`);
console.log(`  output tok/sec     : ${(msg.usage.output_tokens / ((t1 - firstToken) / 1000)).toFixed(0)}`);
