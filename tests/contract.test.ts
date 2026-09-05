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

// --- §2.1 applied to the parts, not just the whole ------------------------

test("a sentence no candidate quoted is reported, not silently absent", async () => {
  const text = "Call the dentist. And you can cancel the task about getting headphones.";
  const r = await parse(
    { text, schema: TASK_SCHEMA, existing: EXISTING },
    { model: stub({
        created: [{ item: { title: "Call the dentist" }, confidence: 0.9, source_text: "Call the dentist" }],
        modified: [],
        unparsed: [],
      }) }
  );

  assert.equal(r.created.length, 1);
  assert.equal(r.unaccounted.length, 1,
    "The cancellation instruction was dropped by the model — not created, not " +
    "modified, not flagged. Measured in two runs of five against the real " +
    "dictation. The other failures land in the confirm queue where he sees " +
    "them; an item that never arrives appears nowhere, and its absence reads " +
    "as 'he didn't say that'. §2.1, bug family (a).");
  assert.match(r.unaccounted[0], /headphones/,
    "It comes back in his own words, so he can see what went missing.");
});

test("what is unaccounted for is not called unparsed", async () => {
  const text = "Call the dentist. And you can cancel the task about getting headphones.";
  const r = await parse(
    { text, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Call the dentist" }, confidence: 0.9, source_text: "Call the dentist" }],
        modified: [], unparsed: [],
      }) }
  );
  assert.equal(r.unparsed.length, 0,
    "`unparsed` is the model saying it could not read something. This is the " +
    "service saying nothing cited it. A restatement quoted once lands here " +
    "too, and calling that 'unparseable' would be a claim neither the model " +
    "nor the service can support.");
});

test("a fully quoted capture leaves nothing unaccounted for", async () => {
  const r = await parse(
    { text: "Call the dentist", schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Call the dentist" }, confidence: 0.9, source_text: "Call the dentist" }],
        modified: [], unparsed: [],
      }) }
  );
  assert.deepEqual(r.unaccounted, [], "No false positives on a clean parse.");
});

// --- §2.2 structurally: a claim the quote cannot support ------------------

test("a date another item quoted is taken off the one that borrowed it", async () => {
  // The real case, 2026-09-05: "call Westcott" came back with due "today",
  // quoting "I need to call Westcott" — a span with no date in it. He said
  // "today" about the RENT, in the sentence before, and the rent item quoted
  // it. Both candidates have to be present for this to be the real shape:
  // what makes it a borrowing rather than a loose timing remark is that
  // something else already claims those words.
  const r = await parse(
    { text: "I need to pay rent today. I need to call Westcott.", schema: TASK_SCHEMA },
    { model: stub({
        created: [
          { item: { title: "Pay rent", due: "today" }, confidence: 0.95,
            source_text: "I need to pay rent today" },
          { item: { title: "Call Westcott", due: "today" }, confidence: 0.95,
            source_text: "I need to call Westcott" },
        ],
        modified: [], unparsed: [],
      }) }
  );

  const rent = r.created.find((c) => /rent/i.test(String(c.item.title)))!;
  const call = r.created.find((c) => /westcott/i.test(String(c.item.title)))!;

  assert.equal(rent.item.due, "today", "The item that actually said it keeps it.");
  assert.equal(call.item.due, undefined,
    "§2.2 — a wrong entry is worse than a missing one, so the claim becomes " +
    "missing. The prompt already forbids this in as many words and the model " +
    "did it two runs in three; an instruction ignored that often is not a guard.");
  assert.deepEqual(call.removed, [
    { field: "due", value: "today", reason: "said about something else in the capture" },
  ], "The reason has to be true. It was said — just not about this.");
});

test("a date said in the capture but claimed by nothing is kept and flagged", async () => {
  // The other real case, from the same day and the opposite mistake. Four
  // items came back with due "Monday" REMOVED and the reason "you didn't say
  // it in those words". He had said, in those words: "a time scale spare room
  // needs to be done I would say on Monday". It is a timing sentence covering
  // things named earlier, so no item quotes it — and he dictates that way
  // routinely, so the old rule threw away deadlines he had given and told him
  // he had not given them.
  const text = "I need to message the spare room places. A time scale, spare room needs to be done I would say on Monday.";
  const r = await parse(
    { text, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Message spare room places", due: "Monday" }, confidence: 0.9,
                    source_text: "I need to message the spare room places" }],
        modified: [], unparsed: [],
      }) }
  );

  assert.equal(r.created[0].item.due, "Monday",
    "Nothing else claims those words, so nothing was taken from anywhere. " +
    "Removing it loses a deadline he actually gave.");
  assert.deepEqual(r.created[0].unverified, [
    { field: "due", value: "Monday", reason: "said in the capture, but not in the words this item quoted" },
  ], "Kept, and honest about why it is not certain — so the caller can ask " +
     "rather than assert something false about his own words.");
  assert.equal(r.created[0].removed, undefined);
});

test("a date said nowhere in the capture is removed, and says so", async () => {
  const r = await parse(
    { text: "I need to call Westcott", schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Call Westcott", due: "next Tuesday" }, confidence: 0.9,
                    source_text: "I need to call Westcott" }],
        modified: [], unparsed: [],
      }) }
  );
  assert.equal(r.created[0].item.due, undefined);
  assert.deepEqual(r.created[0].removed, [
    { field: "due", value: "next Tuesday", reason: "not said anywhere in the capture" },
  ], "Distinct from a borrowing. This one he really did not say, and the " +
     "caller can tell the two apart.");
});

test("a modification's quote counts when deciding what was borrowed", async () => {
  // The quotes that matter are every candidate's, not just the created ones.
  // A deadline claimed by a change to an existing record is claimed.
  const r = await parse(
    { text: "Move the dentist to Friday. I need to call Westcott.", schema: TASK_SCHEMA,
      existing: [{ id: "d-1", label: "Book the dentist" }] },
    { model: stub({
        created: [{ item: { title: "Call Westcott", due: "Friday" }, confidence: 0.9,
                    source_text: "I need to call Westcott" }],
        modified: [{ target: { id: "d-1", described_as: "the dentist" }, intent: "move to Friday",
                     confidence: 0.9, source_text: "Move the dentist to Friday" }],
        unparsed: [],
      }) }
  );
  assert.equal(r.created[0].item.due, undefined);
  assert.equal(r.created[0].removed?.[0].reason, "said about something else in the capture");
});

test("a date the quote does contain is left alone", async () => {
  const r = await parse(
    { text: "I need to finish my tax return by this evening", schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Finish my tax return", due: "this evening" }, confidence: 0.95,
                    source_text: "I need to finish my tax return by this evening" }],
        modified: [], unparsed: [],
      }) }
  );
  assert.equal(r.created[0].item.due, "this evening", "No false positives on a grounded claim.");
  assert.equal(r.created[0].removed, undefined);
});

test("a required field is never removed, only reported", async () => {
  // Stripping a required field would make the item fail the caller's own
  // schema. A caller wanting abstractive titles is entitled to them; that is
  // their schema's business, not this service's (§10, generic).
  const r = await parse(
    { text: "pay the rest of the rent", schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Rent payment" }, confidence: 0.9, source_text: "pay the rest of the rent" }],
        modified: [], unparsed: [],
      }) }
  );
  assert.equal(r.created.length, 1);
  assert.equal(r.created[0].item.title, "Rent payment", "title is required by TASK_SCHEMA, so it stays.");
});

test("a name dropped from an item is reported even though it is short", async () => {
  // The model truncated its own quote at the same point as the title, so the
  // name it dropped left a nine-character gap — under the length threshold
  // that filters "um" and "uh", and therefore invisible. Losing "in Megan"
  // leaves "pay the rest of the rent" looking complete and owing nothing to
  // anyone. §2.2: a wrong entry is worse than a missing one.
  const text = "pay the rest of the rent that I didn't pay in Megan";
  const r = await parse(
    { text, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Pay the rest of the rent that I didn't pay" }, confidence: 0.95,
                    source_text: "pay the rest of the rent that I didn't pay" }],
        modified: [], unparsed: [],
      }) }
  );
  assert.ok(r.unaccounted.some((u) => /megan/i.test(u)),
    `"in Megan" went missing and nothing reported it.\n    unaccounted: ${JSON.stringify(r.unaccounted)}`);
});

test("filler is still not reported", async () => {
  const text = "Um, I need to call Westcott. Uh, and then that's it";
  const r = await parse(
    { text, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Call Westcott" }, confidence: 0.95, source_text: "I need to call Westcott" }],
        modified: [], unparsed: [],
      }) }
  );
  assert.deepEqual(r.unaccounted.filter((u) => /^(um|uh|and then)\b/i.test(u.trim())), [],
    "A checker that reports every 'uh' teaches him to skim the list that " +
    "matters — §13.8's own test for a checker that is silent when correct.");
});

test("a name left unused inside a candidate's own quote is reported", async () => {
  // The mirror of the check above, and the case neither of the other two
  // catches. The quote carried the whole sentence, so coverage saw no gap;
  // the title claimed nothing unsupported, so grounding saw no invention. The
  // item just never used a name sitting in its own source, and read as
  // finished while owing the money to nobody. Seen in one run of three.
  const quote = "I need to pay rent today, um, or pay the rest of the rent that I didn't pay in Megan.";
  const r = await parse(
    { text: quote, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Pay rent today", due: "today" }, confidence: 0.95, source_text: quote }],
        modified: [], unparsed: [],
      }) }
  );
  assert.deepEqual(r.created[0].dropped, ["Megan"],
    "§2.2 has two directions — never invent a detail, never delete one. This " +
    "is the delete direction, per candidate.");
});

test("a candidate that uses the names in its quote reports nothing", async () => {
  const quote = "I need to pay rent today, um, or pay the rest of the rent that I didn't pay in Megan.";
  const r = await parse(
    { text: quote, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Pay the rest of the rent that I didn't pay in Megan", due: "today" },
                    confidence: 0.95, source_text: quote }],
        modified: [], unparsed: [],
      }) }
  );
  assert.equal(r.created[0].dropped, undefined, "No noise when nothing was lost.");
});

test("a sentence-opening capital is not mistaken for a name", async () => {
  const quote = "Call the dentist. Then book a haircut.";
  const r = await parse(
    { text: quote, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Call the dentist" }, confidence: 0.9, source_text: quote }],
        modified: [], unparsed: [],
      }) }
  );
  assert.equal(r.created[0].dropped, undefined,
    '"Call" and "Then" open sentences. Treating every capital as a name would ' +
    "report one on almost every item, which is how a report stops being read.");
});

// --- a modification whose own two halves disagree -------------------------

test("a record that shares nothing with the words used is refused", async () => {
  // From a real dictation, 2026-09-05. He said "I need to finish my tax
  // return... there's already a task for income tax, so just adjust them",
  // and the model handed back the id of "Email profs re work, put in regular
  // notification for checking work" while describing "Finish tax return". It
  // described the right record and pointed at the wrong one.
  //
  // A wrong target on a record that already exists is the expensive kind of
  // wrong: not a line he deletes, an edit to something he never mentioned.
  const r = await parse(
    { text: "I need to finish my tax return tomorrow, it's critical urgent",
      schema: TASK_SCHEMA,
      existing: [
        { id: "e-1", label: "Email profs re work, put in regular notification for checking work" },
        { id: "e-2", label: "File income tax return" },
      ] },
    { model: stub({
        created: [],
        modified: [{ target: { id: "e-1", described_as: "Finish tax return" }, intent: "set the deadline to tomorrow",
                     confidence: 0.9, source_text: "I need to finish my tax return tomorrow" }],
        unparsed: [],
      }) }
  );

  assert.equal(r.modified.length, 1, "It stays a change. Only the target is refused.");
  assert.equal(r.modified[0].target.id, null,
    "The two halves of the model's own answer contradict each other, and that " +
    "is visible from here without knowing which half is right. So neither is " +
    "believed.");
  assert.equal(r.modified[0].target.described_as, "Finish tax return",
    "His words survive, so the caller can ask which record he meant.");
  assert.deepEqual(r.modified[0].target.rejected, {
    id: "e-1",
    label: "Email profs re work, put in regular notification for checking work",
    reason: "the record it named and the words it used share nothing",
  }, "The caller can say WHY it cannot act, rather than showing \"I couldn't " +
     "tell which one you meant\" for a reader that was perfectly clear and " +
     "pointed at the wrong record.");
});

test("a record that shares a real word is accepted", async () => {
  const r = await parse(
    { text: "I need to finish my income tax return tomorrow",
      schema: TASK_SCHEMA,
      existing: [{ id: "e-2", label: "File income tax return" }] },
    { model: stub({
        created: [],
        modified: [{ target: { id: "e-2", described_as: "income tax return" }, intent: "set the deadline to tomorrow",
                     confidence: 0.9, source_text: "I need to finish my income tax return tomorrow" }],
        unparsed: [],
      }) }
  );
  assert.equal(r.modified[0].target.id, "e-2", "A low bar on purpose. This is not a near match to second-guess.");
  assert.equal(r.modified[0].target.rejected, undefined);
});

test("an id the caller never supplied is refused, and says so differently", async () => {
  const r = await parse(
    { text: "cancel the headphones thing", schema: TASK_SCHEMA, existing: EXISTING },
    { model: stub({
        created: [],
        modified: [{ target: { id: "t-999", described_as: "the headphones thing" }, intent: "cancel",
                     confidence: 0.8, source_text: "cancel the headphones thing" }],
        unparsed: [],
      }) }
  );
  assert.equal(r.modified[0].target.id, null);
  assert.deepEqual(r.modified[0].target.rejected, { id: "t-999", reason: "not one of the records supplied" },
    "Distinct from a contradiction: the caller can tell 'I could not identify " +
    "it' from 'it identified two different things'.");
});

test("function words alone are not agreement", async () => {
  const r = await parse(
    { text: "change the thing about the stuff", schema: TASK_SCHEMA,
      existing: [{ id: "x-1", label: "Buy the thing for the stuff" }] },
    { model: stub({
        created: [],
        modified: [{ target: { id: "x-1", described_as: "the thing about the stuff" }, intent: "change it",
                     confidence: 0.5, source_text: "change the thing about the stuff" }],
        unparsed: [],
      }) }
  );
  assert.equal(r.modified[0].target.id, null,
    '"the", "thing" and "stuff" carry no information. Counting them as ' +
    "agreement would make the check pass on almost any pair.");
});

test("a description the model left blank is not treated as a contradiction", async () => {
  const r = await parse(
    { text: "cancel the headphones thing", schema: TASK_SCHEMA, existing: EXISTING },
    { model: stub({
        created: [],
        modified: [{ target: { id: "t-101", described_as: "headphones" }, intent: "cancel",
                     confidence: 0.9, source_text: "cancel the headphones thing" }],
        unparsed: [],
      }) }
  );
  assert.equal(r.modified[0].target.id, "t-101");
});

test('an empty id means "not sure", not a bad record', async () => {
  // The schema carries `id` as a plain string rather than a string-or-null
  // union, because the union cost roughly five seconds a parse under strict
  // decoding. Empty carries "I am not sure" instead. It must not be reported
  // as a refusal — that would be the service inventing a fault to explain its
  // own encoding, and the caller would show him a problem that did not happen.
  const r = await parse(
    { text: "change the thing about the physio", schema: TASK_SCHEMA, existing: EXISTING },
    { model: stub({
        created: [],
        modified: [{ target: { id: "", described_as: "the thing about the physio" }, intent: "change it",
                     confidence: 0.5, source_text: "change the thing about the physio" }],
        unparsed: [],
      }) }
  );
  assert.equal(r.modified.length, 1);
  assert.equal(r.modified[0].target.id, null);
  assert.equal(r.modified[0].target.rejected, undefined,
    "Nothing was rejected. The model said it did not know, and that is the answer.");
  assert.equal(r.modified[0].target.described_as, "the thing about the physio");
});

test("a name superseded by a spelled-out correction is not reported as lost", async () => {
  // "I need to call West Scott WESCOTT" — he says the name, then spells it
  // out because speech-to-text got it wrong. Using "Wescott" is correct, and
  // flagging the two words it replaced would be the report firing when
  // nothing went wrong (§13.8: a checker that reports constantly gets skipped).
  const quote = "I need to call West Scott WESCOTT to call them tomorrow";
  const r = await parse(
    { text: quote, schema: TASK_SCHEMA, existing: [{ id: "w-1", label: "Call Wescott" }] },
    { model: stub({
        created: [],
        modified: [{ target: { id: "w-1", described_as: "Call Wescott" }, intent: "call tomorrow",
                     confidence: 0.9, source_text: quote }],
        unparsed: [],
      }) }
  );
  assert.equal(r.modified[0].dropped, undefined,
    `"West" and "Scott" are earlier attempts at "Wescott", not losses.\n    got: ${JSON.stringify(r.modified[0].dropped)}`);
});

test("a genuinely different name dropped from a change is still reported", async () => {
  const quote = "cancel the dentist thing, Megan is dealing with it";
  const r = await parse(
    { text: quote, schema: TASK_SCHEMA, existing: [{ id: "d-1", label: "Book the dentist" }] },
    { model: stub({
        created: [],
        modified: [{ target: { id: "d-1", described_as: "the dentist thing" }, intent: "cancel",
                     confidence: 0.9, source_text: quote }],
        unparsed: [],
      }) }
  );
  assert.deepEqual(r.modified[0].dropped, ["Megan"],
    "Suppressing variants must not suppress an unrelated name. Until " +
    "2026-09-05 modifications had no detail-loss check at all — the one kind " +
    "of candidate that edits data he already has.");
});

test("the pronoun's contractions are not mistaken for names", async () => {
  // A real capture reported: Didn't use "I'd" from what you said. "I'd",
  // "I'm", "I've" and "I'll" all have the shape of a capitalised name and
  // none of them is one. Reporting them is noise on top of the model doing
  // nothing wrong, and it appears in almost every dictation he makes.
  const quote = "for my treatment I'd like a TNS, I'm not sure which, I've starred some, I'll ask Kiara";
  const r = await parse(
    { text: quote, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Research TNS" }, confidence: 0.9, source_text: quote }],
        modified: [], unparsed: [],
      }) }
  );
  assert.deepEqual(r.created[0].dropped, ["Kiara"],
    `Only the real name. Got: ${JSON.stringify(r.created[0].dropped)}`);
});

test("an apostrophe in a real name still counts", async () => {
  // Splitting on the apostrophe must not swallow O'Brien with I'd — only a
  // base of exactly "I" is the pronoun.
  const quote = "call O'Brien about the thing";
  const r = await parse(
    { text: quote, schema: TASK_SCHEMA },
    { model: stub({
        created: [{ item: { title: "Call about the thing" }, confidence: 0.9, source_text: quote }],
        modified: [], unparsed: [],
      }) }
  );
  assert.deepEqual(r.created[0].dropped, ["O'Brien"]);
});
