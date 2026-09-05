/**
 * The second acceptance test — his dictation of 2026-09-05.
 *
 * Calls the real model and costs money. Run with `npm run test:acceptance2`,
 * or both with `npm run test:acceptance:all`.
 *
 * Every assertion carries the story of the failure it catches (§7 practices).
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { loadEnvLocal } from "../src/env.ts";
import { parse } from "../src/parse.ts";
import { liveModel } from "../src/model.ts";
import { TASK_SCHEMA } from "./fixtures/dictation.ts";
import { DICTATION_2, EXISTING_2 } from "./fixtures/dictation-2.ts";
import type { ParseResult } from "../src/types.ts";

const LATENCY_CEILING_MS = 6000;

let result: ParseResult;

before(async () => {
  loadEnvLocal();
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set. This has NOT passed — an unrun test is not a green one (§2.1).");
  }
  result = await parse(
    { text: DICTATION_2, schema: TASK_SCHEMA, existing: EXISTING_2 },
    { model: liveModel() }
  );
  console.log(`\n  model: ${result.model}   elapsed: ${result.elapsed_ms}ms`);
  writeFileSync("last-parse-2.json", JSON.stringify(result, null, 2));
});

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
/** Everything the change says, in one string: his words plus what to do. */
const said = (i: number) => norm(`${result.modified[i].target.described_as} ${result.modified[i].intent} ${result.modified[i].source_text}`);
const targets = () => result.modified.map((m) => m.target.id);
const forRecord = (id: string) => result.modified.findIndex((m) => m.target.id === id);

// --- everything is a change, because he said so ---------------------------

test("nothing is created, because he said they already exist", () => {
  assert.deepEqual(result.created.map((c) => c.item.title), [],
    'He ended with "there\'s already a task for West Scott, there\'s already a ' +
    'task for income tax, so just adjust them". Creating a second copy of ' +
    'something he says he already has is not a harmless extra line: it splits ' +
    'the record in two and neither half is right afterwards.');
});

test("three records are changed", () => {
  assert.equal(result.modified.length, 3,
    "The income tax return, the appeal, and the Wescott call.\n    got: " +
    JSON.stringify(result.modified.map((m) => `${m.target.id}: ${m.intent}`)));
});

// --- the right records, and not the two traps ----------------------------

test("the income tax change names the income tax record", () => {
  const i = forRecord("e-2");
  assert.notEqual(i, -1, `Nothing points at e-2 "Income tax return".\n    got: ${JSON.stringify(targets())}`);
  assert.match(said(i), /tax/);
});

test("the Wescott change names the call, not the PayPal balance", () => {
  const i = forRecord("e-3");
  assert.notEqual(i, -1,
    'Nothing points at e-3 "Call Wescott".\n    got: ' + JSON.stringify(targets()));
  assert.equal(targets().includes("e-6"), false,
    'e-6 is "Pay off the PayPal balance". He said "call them... to deal with ' +
    'my PayPal debt" — PayPal is the REASON for the call, not the thing being ' +
    "changed. It is the most distinctive word in the sentence, which is what " +
    "makes it the trap.");
});

test("the appeal change names the appeal record", () => {
  const i = forRecord("e-4");
  assert.notEqual(i, -1, `Nothing points at e-4 "Appeal late filing penalty".\n    got: ${JSON.stringify(targets())}`);
});

test("nothing points at the record that has nothing to do with any of it", () => {
  assert.equal(targets().includes("e-1"), false,
    'e-1 is "Email profs re work, put in regular notification for checking ' +
    'work" — the record the model actually handed back in production on ' +
    "2026-09-05 while describing \"Finish tax return\". A wrong target on a " +
    "record that already exists is the expensive kind of wrong: not a line he " +
    "deletes, an edit to something he never mentioned.");
});

// --- corrections aimed at the transcription, not at himself --------------

test('the spelled-out "WESCOTT" wins over what was transcribed', () => {
  const i = forRecord("e-3");
  if (i === -1) return; // Already failing above; do not report it twice.
  assert.ok(/wescott/.test(said(i)) || !/west scott/.test(said(i)),
    'He said "call West Scott WESCOTT" — spelling it out because speech-to-text ' +
    "got the name wrong. That is a correction aimed at the machine rather than " +
    "at himself, and it is the only signal available that the transcript is " +
    "wrong.\n    got: " + JSON.stringify(said(i)));
});

test('"not fighting filing" resolves to filing', () => {
  // Only what the model WROTE, never what it quoted. The first version of
  // this searched the whole result and failed on a correct parse: rule 4
  // requires source_text to be copied character for character, and his words
  // contain "fighting". The test was demanding the quote be sanitised, which
  // is the one thing a quote must never be. Bug family (c), in the test.
  const written = norm(result.modified.map((m) => `${m.target.described_as} ${m.intent}`).join(" "));
  assert.equal(/fighting/.test(written), false,
    'He said "the late fighting penalty filing filing penalty... not fighting ' +
    'filing" — naming the wrong word and the right one together. Fighting a ' +
    "penalty and filing a penalty are different things, and he corrected it " +
    "out loud.\n    written: " + JSON.stringify(written));
  assert.match(written, /filing/, "And the corrected word has to survive.");
});

test('"critical urgent" reaches both the items he said it about', () => {
  // He says it twice: "finish my tax return... tomorrow so it's critical
  // urgent", and "critical urgent" again for the appeal. Measured on the
  // first run of this test, the appeal carried it and the tax return did not
  // — a real detail dropped from an item it belonged to, the same shape as
  // losing Megan from the rent item in the first dictation (§2.2).
  //
  // Neither structural guard sees this one: it is not a name or a number, so
  // droppedFromQuote is blind to it, and nothing was claimed that the quote
  // does not contain, so grounding is too. Which is the honest limit of both.
  for (const [what, id] of [["income tax return", "e-2"], ["appeal", "e-4"]] as const) {
    const i = forRecord(id);
    if (i === -1) continue; // Reported by its own test; not twice.
    assert.match(said(i), /critical|urgent/,
      `He said "critical urgent" about the ${what} and it did not survive.\n    got: ` +
      JSON.stringify(said(i)));
  }
});

// --- details and alternatives -------------------------------------------

test("the PayPal debt survives as the reason for the call", () => {
  const i = forRecord("e-3");
  if (i === -1) return;
  assert.match(said(i), /paypal/,
    'He said what the call is FOR. Dropping it leaves "call Wescott ' +
    'tomorrow" and no way to know why — the same shape as losing Megan from ' +
    "the rent item in the first dictation (§2.2).");
});

test("alternative deadlines come back as he said them, not resolved to one", () => {
  const i = forRecord("e-3");
  if (i === -1) return;
  assert.ok(/saturday/.test(said(i)) && /tomorrow/.test(said(i)),
    'He said "tomorrow or Saturday around midday 12 one-ish". Picking one is ' +
    "inventing a decision he did not make; this service does no date " +
    "arithmetic and the alternatives are his to settle (§5.1).\n    got: " +
    JSON.stringify(said(i)));
});

// --- the shape of the answer --------------------------------------------

test("every change names a record or says why it cannot", () => {
  for (const m of result.modified) {
    assert.ok(m.target.id !== null || m.target.described_as.trim().length > 0,
      `A change with neither a record nor a description: ${JSON.stringify(m)}`);
    if (m.target.rejected) {
      assert.ok(m.target.rejected.reason, "A refusal must say why.");
    }
  }
});

test("every change quotes the words it came from", () => {
  const haystack = norm(DICTATION_2);
  for (const m of result.modified) {
    assert.ok(haystack.includes(norm(m.source_text)),
      `source_text is not in what he actually said:\n      ${JSON.stringify(m.source_text)}`);
  }
});

test("nothing he said goes missing without a trace", () => {
  const quoted = [...result.created, ...result.modified].map((c) => norm(c.source_text));
  const flagged = [...result.unparsed.map((u) => u.text), ...result.unaccounted].map(norm);
  for (const [what, phrase] of [
    ["the income tax deadline", "tax return"],
    ["the appeal", "appeal"],
    ["the Wescott call", "call"],
  ] as const) {
    assert.ok([...quoted, ...flagged].some((s) => s.includes(phrase)),
      `${what} is nowhere: not quoted by a candidate, not flagged, not ` +
      "reported as unaccounted for. An item that never arrives appears " +
      "nowhere, and its absence reads as \"he didn't say that\" (§2.1).");
  }
});

test("it answers fast enough to be checked while he remembers", () => {
  assert.ok(result.elapsed_ms < LATENCY_CEILING_MS,
    `${result.elapsed_ms}ms exceeds the ${LATENCY_CEILING_MS}ms regression alarm.`);
});
