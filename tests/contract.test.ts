/**
 * What the service does with what the model hands back — §2.2 and §2.1.
 *
 * The model is stubbed throughout, so these run free and deterministically.
 * They cover the cases the acceptance test cannot force: a model that
 * returns nothing, a model that omits a confidence, a model that invents a
 * quote, a model that dies.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/handler.ts";
import { parse } from "../src/parse.ts";
import { recordingModel } from "./helpers/recording-model.ts";
import { TASK_SCHEMA, EXISTING } from "./fixtures/dictation.ts";
import type { ModelClient } from "../src/types.ts";

const TOKEN = "test-token-not-a-real-secret";

/** A model that returns exactly what the test hands it. */
const stub = (json: unknown, id = "stub"): ModelClient => ({
  id,
  async complete() {
    return { model: id, json };
  },
});

const run = (json: unknown, text = "I need to call Westcott and pay the rent today") =>
  parse({ text, schema: TASK_SCHEMA, existing: EXISTING }, { model: stub(json) });

// --- §2.1: absence of a parse is not a clean parse -------------------------

test("a model that finds nothing returns the input verbatim, not an empty success", async () => {
  const r = await run({ created: [], modified: [], unparsed: [] });

  assert.equal(r.created.length, 0);
  assert.equal(r.unparsed.length, 1,
    "Real text in, nothing out. Returning an empty success tells the calling " +
    "app the capture held no items, which it cannot know. That is bug family " +
    "(a): absence of bad news read as good news — 'nothing logged became a " +
    "good day'. Absence of a parse is never a clean parse (§2.1).");
  assert.equal(r.unparsed[0].text, "I need to call Westcott and pay the rent today",
    "Verbatim, per §2.2: anything unparseable is stored verbatim and flagged.");
});

test("a model that returns malformed JSON returns the input verbatim, not a 500", async () => {
  const r = await parse(
    { text: "buy milk tomorrow", schema: TASK_SCHEMA },
    { model: stub("this is not the object you asked for") }
  );
  assert.equal(r.created.length, 0);
  assert.equal(r.unparsed[0].text, "buy milk tomorrow",
    "A broken model reply must degrade to 'I could not read this', not to an " +
    "exception. The words are what matter and they are already safe in the " +
    "calling app; this hands them back so the app can show them.");
});

// --- §2.2: never guess ------------------------------------------------------

test("an item with no confidence becomes unparsed, and is never given a default", async () => {
  const r = await run({
    created: [{ item: { title: "Call Westcott" }, source_text: "call Westcott" }],
    modified: [],
    unparsed: [],
  });

  assert.equal(r.created.length, 0,
    "Bug family (g): absence of data read as PRECISION. The app once called a " +
    "day 'exactly 65 CLU' from partial data. An item with no confidence is " +
    "not a confident item, and defaulting it to 1.0 would be this service " +
    "asserting something the model declined to assert.");
  assert.equal(r.unparsed.length, 1);
  assert.match(r.unparsed[0].reason, /confidence/i);
});

test("a quote that is not in the input is refused, not passed on", async () => {
  const r = await run({
    created: [{ item: { title: "Book a flight to Berlin" }, confidence: 0.9, source_text: "book a flight to Berlin" }],
    modified: [],
    unparsed: [],
  });

  assert.equal(r.created.length, 0,
    "He never said this. source_text is the only thing that lets him check a " +
    "candidate against his own words (§10, live not batched), so a quote that " +
    "is not in the input is either a hallucination or a paraphrase — and " +
    "there is no way to tell which from here. Both are unusable as evidence.");
  assert.match(r.unparsed[0].reason, /quote|source/i);
});

test("a bare number is not turned into a deadline", async () => {
  const r = await parse(
    { text: "physio 10", schema: TASK_SCHEMA },
    { model: stub({ created: [{ item: { title: "physio 10" }, confidence: 0.4, source_text: "physio 10" }], modified: [], unparsed: [] }) }
  );
  assert.equal(r.created.length, 1);
  assert.ok(!r.created[0].item.due,
    "§2.2: a bare number takes the low-risk interpretation; anything else " +
    "needs an explicit keyword. '10' is not 'in 10 days'.");
});

// --- §10: creations and mutations are different risk classes ---------------

test("a modification whose record cannot be identified keeps the words and drops the id", async () => {
  const r = await run({
    created: [],
    modified: [{
      target: { id: "t-999", described_as: "the task about the thing" },
      intent: "cancel",
      confidence: 0.6,
      source_text: "pay the rent today",
    }],
    unparsed: [],
  });

  assert.equal(r.modified.length, 1,
    "It stays a modification. Quietly demoting an unmatched change into a " +
    "creation would turn 'cancel that' into 'add that' — the inverse of what " +
    "he asked for.");
  assert.equal(r.modified[0].target.id, null,
    "t-999 is not in the records the caller supplied. §10 requires the record " +
    "be NAMED before anything touches it, always. An id the caller does not " +
    "recognise names nothing, and passing it on invites the app to act on a " +
    "record that does not exist.");
  assert.equal(r.modified[0].target.described_as, "the task about the thing",
    "His description survives, so the app can ask him which one he meant.");
});

test("modifications never leak into created", async () => {
  const r = await run({
    created: [],
    modified: [{
      target: { id: "t-101", described_as: "headphones" },
      intent: "cancel",
      confidence: 0.9,
      source_text: "pay the rent today",
    }],
    unparsed: [],
  });
  assert.equal(r.created.length, 0);
  assert.equal(r.modified.length, 1);
});

// --- §10: generic. Knows nothing about tasks or bands. ---------------------

test("the prompt sent to the model contains no domain vocabulary", async () => {
  const model = recordingModel();
  await parse({ text: "buy milk", schema: TASK_SCHEMA }, { model });

  const sent = JSON.stringify({ system: model.lastRequest!.system, user: model.lastRequest!.user });
  const schemaText = JSON.stringify(TASK_SCHEMA);

  for (const word of ["task", "todo", "to-do", "deadline", "band", "CLU", "step", "relapse", "physio"]) {
    const inPrompt = new RegExp(`\\b${word}\\b`, "i").test(sent.replace(schemaText, ""));
    assert.equal(inPrompt, false,
      `The word "${word}" is in the prompt this service builds.\n` +
      "    §10: it 'receives the schema with the request; knows nothing about " +
      "tasks or bands'. Domain vocabulary baked in here is domain knowledge " +
      "baked in here — and the next caller is the routine app, not the task " +
      "app. Anything task-shaped belongs in the caller's schema, which is " +
      "excluded from this check because the caller is allowed to say it.");
  }
});

// --- §10: if the service is slow or down, the app falls back ---------------

test("a model that throws becomes a clean failure the caller can fall back from", async () => {
  const res = await handle(
    {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ text: "buy milk", schema: TASK_SCHEMA }),
    },
    {
      token: TOKEN,
      model: { id: "exploding", async complete() { throw new Error("upstream is down"); } },
    }
  );

  assert.equal(res.status, 502,
    "§10: 'If the service is slow or down, the raw is safe and the app falls " +
    "back to its existing parser and says so.' The caller needs a plain " +
    "failure to branch on. A 200 carrying an empty result would read as 'he " +
    "said nothing' and the fallback would never run.");
  assert.ok(!JSON.stringify(res.body).includes("upstream is down"),
    "Upstream error text is not echoed to the caller: it is the one place an " +
    "API key or account detail could surface in a response body.");
});
