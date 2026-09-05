/**
 * The second acceptance dictation — recorded verbatim from Sean, 2026-09-05.
 *
 * The first paragraph tested one thing hard: a spoken retraction. This one
 * carries four patterns it never exercised, which is why it is worth more
 * than any further tuning against the first.
 *
 *   A correction aimed at the TRANSCRIPTION, not at himself. "West Scott
 *   WESCOTT" is him spelling the name out because speech-to-text got it
 *   wrong, and "not fighting filing" is him naming the wrong word and the
 *   right one together.
 *
 *   A sentence that is not an item at all. "There's already a task for West
 *   Scott, there's already a task for income tax, so just adjust them" tells
 *   the parser what to do with the OTHER items. He decided it is binding
 *   (2026-09-05): those come back as changes, never as new items.
 *
 *   Alternatives instead of dates. "The next day or next two days",
 *   "tomorrow or Saturday around midday 12 one-ish".
 *
 *   Every item a modification. The first dictation had one; this has three
 *   and no creations at all.
 *
 * Ground truth is his, from three questions asked before this file existed —
 * not read off the paragraph. One answer reverses something in the first
 * fixture: the name is WESCOTT, so "Westcott" there was the transcription
 * error and not the name. That fixture keeps its spelling regardless: it
 * records what the transcript said, and the parser's job is to keep what it
 * was given.
 */
export const DICTATION_2 =
  "So I need to finish my tax return my income tax return tomorrow so it's " +
  "critical urgent then the next day or next two days need to file an appeal " +
  "for my penalty. My sorry to appeal the late fighting penalty filing filing " +
  "penalty again critical urgent not fighting filing and I need to call West " +
  "Scott WESCOTT to call them tomorrow or Saturday around midday 12 one-ish " +
  "to deal with my PayPal debt so that there's already a task for West Scott " +
  "there's already a task for income tax tax so just adjust them";

/**
 * The records he already has, as the calling app would send them.
 *
 * Two of these are traps and both are real rather than invented.
 *
 * `e-1` is the record the model actually handed back in production on
 * 2026-09-05 while describing "Finish tax return" — it has nothing to do with
 * anything he said here.
 *
 * `e-6` is the subtler one. He mentions "my PayPal debt" as the REASON for
 * the Wescott call, and a parser matching on the most distinctive shared word
 * lands on the PayPal record instead of the call. The detail belongs on the
 * change; it is not the thing being changed.
 */
export const EXISTING_2 = [
  { id: "e-1", label: "Email profs re work, put in regular notification for checking work" },
  { id: "e-2", label: "Income tax return" },
  { id: "e-3", label: "Call Wescott" },
  { id: "e-4", label: "Appeal late filing penalty" },
  { id: "e-5", label: "Renew the car insurance" },
  { id: "e-6", label: "Pay off the PayPal balance" },
];
