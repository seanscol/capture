/**
 * The acceptance dictation — SYSTEM.md §10, "Model chosen by passing the
 * acceptance test". Recorded verbatim from Sean, 2026-09-04.
 *
 * §8 records what this paragraph did to the rule-based parser: "A paragraph
 * with five tasks, three deadlines and an instruction to modify an existing
 * task produced one unusable task." That is the bar. This file is the only
 * written copy of it — the spec cites it as `[NEXT §8]`, which does not
 * resolve (reported to the planning chat, 2026-09-04).
 *
 * Kept exactly as dictated, disfluencies included. A cleaned-up paragraph
 * tests a paragraph nobody will ever speak.
 *
 * The leading "Okay. So here's the paragraph." may have been Sean addressing
 * the session rather than dictating. It is kept because keeping it can only
 * make the test harder: a parser that emits a task from it has failed, and a
 * parser that ignores it has done nothing it wouldn't have to do with any
 * other throat-clearing.
 */
export const DICTATION =
  "Okay. So here's the paragraph. Um, I need to pay rent today, um, or pay " +
  "the rest of the rent that I didn't pay in Megan. I need to call Westcott. " +
  "I need to, um, I need to finish my tax return today, uh, by literally this " +
  "evening. That's really urgent. And then after that, I need to do the " +
  "appeal. I need to appeal my fine that's within, I think, ten days I had to " +
  "do that. And I need... next week, I need to find a physio. No. I find a " +
  "physio. I need to contact my GP to get them to refer me to the physio and " +
  "then get my mom to call Bupa to confirm the referral. And you can cancel " +
  "the task about getting headphones.";

/**
 * A minimal task schema, supplied by the caller per §10 ("receives the schema
 * with the request; knows nothing about tasks or bands"). The service must
 * work from this alone. Nothing in src/ may mention tasks, titles or due
 * dates — if it does, the service has stopped being generic.
 */
export const TASK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title"],
  properties: {
    title: { type: "string", description: "What needs doing, in the user's own words where possible." },
    due: { type: "string", description: "Deadline exactly as expressed, e.g. 'today', 'this evening', 'within ten days'. Omit entirely if none was stated." },
    urgent: { type: "boolean", description: "Only if the user said so." },
  },
} as const;

/**
 * Records the calling app says already exist, so a MODIFY candidate can name
 * one (§10: "Any operation touching an existing record requires explicit
 * confirmation naming the record — always, not only when confidence is low").
 * Optional in the request; the service is stateless and knows of no record it
 * is not handed.
 *
 * The distractors are deliberate. "Return the headphones" is the trap: a
 * parser matching on the word "headphones" alone picks the wrong record, and
 * a wrong MODIFY target is §2.2's "wrong entry is worse than a missing one"
 * pointed at data that already exists.
 */
export const EXISTING = [
  { id: "t-101", label: "Buy noise-cancelling headphones" },
  { id: "t-102", label: "Return the headphones to Amazon" },
  { id: "t-103", label: "Renew the car insurance" },
  { id: "t-104", label: "Book a haircut" },
];
