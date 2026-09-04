/**
 * Item-by-item diff: what the acceptance test expects against what came back.
 *
 * The test reports pass/fail per assertion, which says an assertion broke but
 * not which of his items was wrong or how. This prints the ground truth beside
 * the parse and names the kind of each error — missed, invented, wrong date,
 * or creation and mutation confused.
 *
 * Reads last-parse.json, written by `npm run test:acceptance`. Free: no model
 * call.
 */
import { readFileSync } from "node:fs";
import type { ParseResult } from "../src/types.ts";

/**
 * Ground truth, from Sean directly on 2026-09-04 — not inferred from the
 * paragraph. Two of these were settled by asking him, and one reversed what
 * the test would otherwise have asserted:
 *
 *   "Megan is a real person"  — so she must survive into the rent item;
 *                               flagging her as a garble would be the bug.
 *   the spoken "No"           — retracts "find a physio" AND "next week";
 *                               GP and Bupa are two separate items.
 */
const EXPECTED = [
  { key: "rent",     match: /rent/i,          due: "today",           must: /megan/i,
    why: 'He said "pay rent today, um, or pay the rest of the rent that I didn\'t pay in Megan". Megan is real; the title must still name her.' },
  { key: "westcott", match: /westcott/i,      due: null,
    why: 'He said "I need to call Westcott" and gave it no date. It sits between two dated items, so a borrowed date is the trap.' },
  { key: "tax",      match: /tax/i,           due: /evening|today|tonight/i, urgent: true,
    why: 'He said "today, uh, by literally this evening. That\'s really urgent."' },
  { key: "appeal",   match: /appeal|fine/i,   due: /ten|10/i,
    why: 'Said twice in a row — "I need to do the appeal. I need to appeal my fine" — so exactly one item, due "within ten days".' },
  { key: "gp",       match: /\bGP\b/i,        due: null,
    why: 'He said "contact my GP to get them to refer me to the physio". No date survived the retraction.' },
  { key: "bupa",     match: /bupa/i,          due: null,
    why: 'He said "get my mom to call Bupa to confirm the referral". No date survived the retraction.' },
];

const EXPECTED_MODIFY = { id: "t-101", label: "Buy noise-cancelling headphones", intent: /cancel|delete|remove|drop/i,
  why: 'He said "you can cancel the task about getting headphones". The fixture also holds "Return the headphones to Amazon" (t-102) as a decoy.' };

const r: ParseResult = JSON.parse(readFileSync("last-parse.json", "utf8"));
const created = r.created.map((c) => ({
  title: String(c.item.title ?? ""),
  due: c.item.due ? String(c.item.due) : null,
  urgent: c.item.urgent,
  conf: c.confidence,
  removed: c.removed ?? [],
  dropped: c.dropped ?? [],
}));

const dueOk = (want: unknown, got: string | null) =>
  want === null ? got === null : want instanceof RegExp ? !!got && want.test(got) : got === want;

const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
const faults: string[] = [];
const caught: string[] = [];
const usedIndexes = new Set<number>();

console.log(`\n  model ${r.model}   ${r.elapsed_ms}ms\n`);
console.log(`  ${pad("EXPECTED", 26)}${pad("RETURNED", 58)}VERDICT`);
console.log(`  ${"─".repeat(110)}`);

for (const e of EXPECTED) {
  const hits = created.map((c, i) => ({ c, i })).filter(({ c }) => e.match.test(c.title));
  hits.forEach(({ i }) => usedIndexes.add(i));

  // Strip the delimiters and trailing flags only. Stripping every "i" and "g"
  // in the pattern turned "evening|today|tonight" into "evenn|today|tonht".
  const wantDue = e.due === null ? "(no date)" : String(e.due).replace(/^\/|\/[a-z]*$/g, "");
  const label = `${e.key}  ${wantDue}`;

  if (hits.length === 0) {
    console.log(`  ${pad(label, 26)}${pad("—", 44)}MISSED`);
    faults.push(`MISSED: ${e.key} — nothing came back for it.`);
    continue;
  }
  if (hits.length > 1) {
    console.log(`  ${pad(label, 26)}${pad(hits.map((h) => h.c.title).join(" | "), 44)}DUPLICATED (${hits.length})`);
    faults.push(`DUPLICATED: ${e.key} came back ${hits.length} times — ${e.why}`);
    continue;
  }

  const got = hits[0].c;
  const stripped = [
    ...got.removed.map((x) => `${x.field}="${x.value}" REMOVED`),
    ...got.dropped.map((d) => `"${d}" LEFT UNUSED`),
  ].join(", ");
  const shown = `${got.title}${got.due ? `  [${got.due}]` : "  [no date]"}${stripped ? `  {${stripped}}` : ""}`;
  const problems: string[] = [];

  if (!dueOk(e.due, got.due)) {
    problems.push(e.due === null
      ? `INVENTED DATE "${got.due}"`
      : got.due === null ? "DATE MISSING" : `WRONG DATE "${got.due}"`);
  }
  if (e.must && !e.must.test(got.title)) problems.push("DETAIL DROPPED");
  if (e.urgent !== undefined && got.urgent !== e.urgent) problems.push(`urgent=${got.urgent}`);

  const verdict = problems.length ? problems.join(", ")
    : got.removed.length || got.dropped.length ? "ok (service caught it)" : "ok";
  console.log(`  ${pad(label, 26)}${pad(shown, 58)}${verdict}`);
  if (problems.length) faults.push(`${problems.join(", ")}: ${e.key} — ${e.why}`);
  for (const x of got.removed) caught.push(`${e.key}: ${x.field}="${x.value}" removed — ${x.reason}`);
  for (const d of got.dropped) caught.push(`${e.key}: "${d}" is in the item's own quote and the item never uses it`);
}

// Anything returned that matched no expected item.
created.forEach((c, i) => {
  if (usedIndexes.has(i)) return;
  console.log(`  ${pad("—", 26)}${pad(`${c.title}  [${c.due ?? "no date"}]`, 44)}INVENTED ITEM`);
  faults.push(`INVENTED ITEM: "${c.title}" — he asked for nothing like this.`);
});

// --- the modification -------------------------------------------------------
console.log(`  ${"─".repeat(110)}`);
const headphonesInCreated = created.filter((c) => /headphone/i.test(c.title));
const want = `MODIFY ${EXPECTED_MODIFY.id}`;

if (headphonesInCreated.length) {
  console.log(`  ${pad(want, 26)}${pad(`CREATE "${headphonesInCreated[0].title}"`, 44)}CREATE/MODIFY CONFUSED`);
  faults.push(`CREATE/MODIFY CONFUSED: the instruction to cancel became a new item. It adds work instead of removing it — ${EXPECTED_MODIFY.why}`);
} else if (r.modified.length === 0) {
  const trace = [...r.unparsed.map((u) => u.text), ...r.unaccounted].some((t) => /headphone/i.test(t));
  console.log(`  ${pad(want, 26)}${pad(trace ? "not parsed, but reported" : "—", 44)}${trace ? "MISSED but VISIBLE" : "MISSED SILENTLY"}`);
  faults.push(trace
    ? "MISSED but VISIBLE: the cancellation was not parsed, but it comes back in his own words so he can see it went unhandled."
    : "MISSED SILENTLY: the cancellation is nowhere — not created, modified, flagged or reported. This is the one he cannot see.");
} else {
  for (const m of r.modified) {
    const problems: string[] = [];
    if (m.target.id !== EXPECTED_MODIFY.id) {
      problems.push(m.target.id === null ? "RECORD NOT NAMED" : `WRONG RECORD ${m.target.id}`);
    }
    if (!EXPECTED_MODIFY.intent.test(m.intent)) problems.push(`intent "${m.intent}"`);
    console.log(`  ${pad(want, 26)}${pad(`MODIFY ${m.target.id ?? "null"} :: ${m.intent}`, 44)}${problems.length ? problems.join(", ") : "ok"}`);
    if (problems.length) faults.push(`${problems.join(", ")}: ${EXPECTED_MODIFY.why}`);
  }
}

// --- totals -----------------------------------------------------------------
const dues = created.map((c) => c.due).filter(Boolean);
console.log(`  ${"─".repeat(110)}`);
console.log(`  dates returned: ${dues.length} — ${JSON.stringify(dues)}   (he stated three)`);
if (dues.length !== 3) faults.push(`DATE COUNT: ${dues.length}, not three. today (rent), this evening (tax), ten days (appeal).`);
if (created.some((c) => /find (a )?physio/i.test(c.title))) faults.push('RETRACTION IGNORED: "find a physio" came back as an item after he said "No".');

if (r.unparsed.length) { console.log(`\n  flagged by the model:`); r.unparsed.forEach((u) => console.log(`    ${JSON.stringify(u.text.slice(0, 72))}`)); }
if (r.unaccounted.length) { console.log(`\n  quoted by nothing (service, not model):`); r.unaccounted.forEach((u) => console.log(`    ${JSON.stringify(u.slice(0, 72))}`)); }

if (caught.length) {
  console.log(`\n  ${caught.length} CLAIM(S) CAUGHT BY THE SERVICE (wrong entry turned into a missing one, §2.2):`);
  caught.forEach((c, i) => console.log(`    ${i + 1}. ${c}`));
}
console.log(`\n  ${faults.length ? `${faults.length} FAULT(S) REACHING HIM:` : "no faults."}`);
faults.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
console.log();
