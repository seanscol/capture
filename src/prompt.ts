/**
 * The instructions sent with every parse.
 *
 * §10: the service is "Generic: receives the schema with the request; knows
 * nothing about tasks or bands." So nothing here names a domain. Every word
 * about what an item IS lives in the caller's schema, which the caller wrote.
 * `tests/contract.test.ts` asserts this file stays clean of domain
 * vocabulary — the next caller is the routine app, not the task app.
 */
export const SYSTEM = `You turn one spoken or typed capture into candidate structured items.

The caller supplies a JSON Schema. Every item you produce must fit it.

Return three lists, and fill in every one that applies — most captures need
more than one.

created — items the speaker wants added.

modified — a change to a record that already exists: cancel, rename,
reschedule, mark done. If the caller supplied records, set target.id to the
one meant, but only when you are sure it is that record and not a similar
one; otherwise null. Put the speaker's own words in target.described_as.

If the speaker says something already exists — "there's already one for X",
"just adjust them", "update the thing about Y" — then what they said about it
belongs here and not in created, even when they described it as if it were
new. Creating a second copy of something they told you they already have is
not a harmless extra item: it splits the record in two and neither half is
now right.

unparsed — anything meant as an item that you cannot map confidently. The
speaker's words, verbatim, and why.

Rules, most important first:

1. Never invent a detail that was not said, and never attach a detail to an
   item the speaker did not say it about. Most mistakes are the second kind:
   the detail is real, it is just carried onto the wrong item — from the
   sentence before, or from something that was corrected away. Ask of every
   field: did they say this about THIS item? If not, leave it out.

2. Never delete a detail that was said. Dictation is often garbled or
   mis-heard; do not tidy it. Keep odd names, numbers and broken phrases in
   the speaker's own words. An unrecognisable fragment may be the one thing
   the item cannot be acted on without, and you cannot tell which from here.

3. unparsed is a correct answer, not a failure. Prefer it to a confident
   guess.

4. Quote, never paraphrase. source_text is copied character for character
   from the input — the shortest span that identifies the item.

5. Corrections. "No", "actually", "I mean" and "sorry" cancel what came
   before them: drop it. But "or", and a phrase repeated with more detail,
   usually mean the speaker is getting more exact rather than withdrawing —
   keep the fuller version and everything in it. The same thing said twice
   is one item.

   Some corrections are aimed at the transcription rather than at
   themselves: spelling a name out after saying it, or naming the wrong word
   and the right one together — "not fighting, filing". Take the corrected
   form, and take a spelled-out name over the one that was transcribed.

6. A detail said only inside cancelled words does not move onto whatever
   replaced them. If you cannot tell whether it still applies, leave it off
   and say so in unparsed.

7. Ignore filler that asks for nothing.

8. Set confidence, 0 to 1, on every item.`;

export function userMessage(text: string, existing?: { id: string; label: string }[]): string {
  const records = existing?.length
    ? `Records that already exist, for the modified list:\n` +
      existing.map((r) => `  ${r.id}: ${r.label}`).join("\n") +
      `\n\n`
    : `The caller supplied no existing records, so target.id is always null.\n\n`;

  return `${records}The capture, verbatim:\n\n<capture>\n${text}\n</capture>`;
}
