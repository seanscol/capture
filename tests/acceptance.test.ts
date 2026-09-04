/**
 * The acceptance test — SYSTEM.md §10. Written before the service existed.
 *
 * This is the test that chooses the model. It calls the real API and costs
 * real money, which is why it is NOT part of `npm test`. Run it with
 * `npm run test:acceptance`.
 *
 * Every assertion below carries the story of the failure it catches, per §7
 * practices: not "checks the appeal is deduped" but "he said it twice".
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { loadEnvLocal } from "../src/env.ts";
import { parse } from "../src/parse.ts";
import { liveModel } from "../src/model.ts";
import { DICTATION, TASK_SCHEMA, EXISTING } from "./fixtures/dictation.ts";
import type { ParseResult } from "../src/types.ts";

/**
 * A generous ceiling, not a target. §10 wants "within a second or two";
 * bug family (e) is "correct but too slow to be an answer" — a parse he
 * cannot check while he still remembers what he said is a wrong entry.
 * PLACEHOLDER (§5.7): unproven against a cold Vercel function.
 */
const LATENCY_CEILING_MS = 4000;

let result: ParseResult;

before(async () => {
  loadEnvLocal();
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set, so the acceptance test cannot run.\n" +
      "It has NOT passed. An unrun test is not a green one (§2.1).\n" +
      "Paste the key into .env.local — see README.md."
    );
  }
  result = await parse(
    { text: DICTATION, schema: TASK_SCHEMA, existing: EXISTING },
    { model: liveModel() }
  );
  console.log(`\n  model: ${result.model}   elapsed: ${result.elapsed_ms}ms`);
  console.log(`  ${JSON.stringify(result, null, 2).split("\n").join("\n  ")}\n`);
});

// --- helpers ---------------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const titles = () => result.created.map((c) => String(c.item.title ?? ""));
const matching = (re: RegExp) => titles().filter((t) => re.test(t));
const dues = () => result.created.map((c) => String(c.item.due ?? "")).filter(Boolean);

/** The created item whose title matches, asserting there is exactly one. */
function only(re: RegExp, story: string) {
  const hits = matching(re);
  assert.equal(hits.length, 1, `${story}\n    got ${hits.length}: ${JSON.stringify(hits)}\n    all titles: ${JSON.stringify(titles())}`);
  return result.created.find((c) => re.test(String(c.item.title ?? "")))!;
}

// --- the five (six) tasks --------------------------------------------------

test("the rent task keeps Megan", () => {
  const rent = only(/rent/i,
    'He self-corrected mid-sentence: "pay rent today, um, OR pay the rest of ' +
    'the rent". That is one task restated, not two. Two rent tasks means the ' +
    '"or" was read as a conjunction.');

  assert.match(String(rent.item.title), /megan/i,
    'Megan is a real person and this is money owed to her. A parser that drops ' +
    'her produces a task he cannot act on: "pay the rest of the rent" to whom? ' +
    'The phrase "in Megan" is garbled by speech-to-text, and the temptation is ' +
    'to discard what looks like noise. §2.2 — a wrong entry is worse than a ' +
    'missing one, and a silently dropped payee is a wrong entry.');

  assert.match(String(rent.item.due ?? ""), /today/i,
    'He said "pay rent today".');
});

test("Westcott is a task with no invented deadline", () => {
  const call = only(/westcott/i, 'He said "I need to call Westcott" once.');

  assert.ok(!call.item.due,
    'No deadline was stated for Westcott. It sits between two dated tasks ' +
    '(rent "today" before it, tax "this evening" after), so proximity is the ' +
    'trap. An invented deadline is §2.2: guessing at input. Absence of a ' +
    'deadline must come back as absence, never as a neighbour\'s date.');
});

test("the tax return is urgent and due this evening", () => {
  const tax = only(/tax/i, 'Said once.');
  assert.match(String(tax.item.due ?? ""), /evening|today|tonight/i,
    'He said "today, uh, by literally this evening".');
  assert.equal(tax.item.urgent, true,
    'He said "That\'s really urgent" — the only time he says it. urgent is in ' +
    'the schema, so it must be set from what he said and from nothing else.');
});

test("the appeal is ONE task, not two", () => {
  const appeal = only(/appeal|fine/i,
    'He said it twice in a row: "I need to do the appeal. I need to appeal my ' +
    'fine". This is the restatement trap. A parser splitting on sentence ' +
    'boundaries emits two tasks for one job, and he then has to notice and ' +
    'delete one — which is exactly the friction the app exists to remove.');

  assert.match(String(appeal.item.due ?? ""), /ten|10/i,
    'He said "within, I think, ten days".');
});

test("the GP referral and the Bupa call are both present", () => {
  only(/gp|refer/i, 'He said "contact my GP to get them to refer me to the physio".');
  only(/bupa|mom|mum/i, 'He said "get my mom to call Bupa to confirm the referral".');
});

// --- the retraction --------------------------------------------------------

test('the spoken "No" cancelled "find a physio"', () => {
  const stray = titles().filter((t) => /find (a )?physio/i.test(t));
  assert.deepEqual(stray, [],
    'He said: "next week, I need to find a physio. NO. I find a physio. I ' +
    'need to contact my GP...". The "No" retracts it and he replaces it with ' +
    'the two concrete steps. A parser that keeps "find a physio" alongside ' +
    'the GP and Bupa tasks has ignored him saying no — and §2.3 is that a ' +
    'manual override always wins. Retracting out loud is an override.');
});

test('"next week" died with the retraction', () => {
  const strays = dues().filter((d) => /next week/i.test(d));
  assert.deepEqual(strays, [],
    '"next week" was attached only to "find a physio", which he retracted. ' +
    'Re-attaching it to the GP or Bupa task invents a deadline he never gave ' +
    'those tasks. He counted three deadlines, and this is the fourth phrase.');
});

test("exactly three deadlines, because he said three", () => {
  assert.equal(dues().length, 3,
    'today (rent), this evening (tax), ten days (appeal). §8 records this ' +
    'paragraph as "five tasks, three deadlines". A fourth is an invention; a ' +
    'third missing is a dropped commitment.\n    got: ' + JSON.stringify(dues()));
});

// --- creation vs mutation (§10: different risk classes) --------------------

test("cancelling the headphones task is a MODIFY, never a CREATE", () => {
  assert.equal(result.modified.length, 1,
    'One instruction touching an existing record: "you can cancel the task ' +
    'about getting headphones".\n    got: ' + JSON.stringify(result.modified));

  const m = result.modified[0];

  assert.equal(m.target.id, "t-101",
    'The record is "Buy noise-cancelling headphones" (t-101). The fixture ' +
    'also holds "Return the headphones to Amazon" (t-102) — a parser matching ' +
    'on the word "headphones" picks the wrong one and cancels a task he ' +
    'wanted. §10 requires the record be named, always, precisely so this is ' +
    'checkable before anything happens.');

  assert.match(m.intent, /cancel|delete|remove|drop/i,
    'He said "cancel".');

  assert.deepEqual(matching(/headphone/i), [],
    'A parser that emits "cancel the headphones task" as a NEW task has ' +
    'inverted the operation: it adds work instead of removing it. §10 keeps ' +
    'creations and mutations in different lists so this cannot pass silently.');
});

// --- what makes the answer checkable (§2.1, §2.2) -------------------------

test("every candidate quotes the words it came from", () => {
  const haystack = norm(DICTATION);
  for (const c of [...result.created, ...result.modified]) {
    assert.ok(c.source_text && c.source_text.trim().length > 0,
      `A candidate arrived with no source_text: ${JSON.stringify(c)}`);
    assert.ok(haystack.includes(norm(c.source_text)),
      `source_text is not in what he actually said:\n      ${JSON.stringify(c.source_text)}\n` +
      '    §10: the parse "echoes what it made of it — live, not batched, ' +
      'because a wrong parse he can\'t check while he remembers what he said ' +
      'is a wrong entry". He can only check it against his own words. A ' +
      'paraphrased source_text is unauditable, and an invented one is a ' +
      'hallucination the format was meant to expose.');
  }
});

test("every candidate carries a confidence", () => {
  for (const c of [...result.created, ...result.modified]) {
    assert.equal(typeof c.confidence, "number",
      `Missing confidence: ${JSON.stringify(c)}\n` +
      '    Bug family (g): absence of data read as precision. An item with no ' +
      'confidence is not a confident item, and the service must never supply ' +
      'a default — a defaulted 1.0 is an assertion nobody made.');
    assert.ok(c.confidence > 0 && c.confidence <= 1, `confidence out of range: ${c.confidence}`);
  }
});

test("nothing is silently dropped", () => {
  assert.ok(result.created.length > 0,
    'Empty output for a paragraph this full is the failure §8 recorded: "one ' +
    'unusable task". Absence of a parse is not a clean parse (§2.1).');
});

// --- speed (bug family (e)) ------------------------------------------------

test("it answers fast enough to be checked while he remembers", () => {
  assert.ok(result.elapsed_ms < LATENCY_CEILING_MS,
    `${result.elapsed_ms}ms exceeds the ${LATENCY_CEILING_MS}ms ceiling.\n` +
    '    Bug family (e): correct but too slow to be an answer. assessRisk hit ' +
    '5.3s and every test passed, because they assert answers, not that ' +
    'answers arrive. This one asserts that it arrives.');
});
