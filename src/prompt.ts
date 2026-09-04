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

You return three lists.

created — items the speaker is asking to add.

modified — changes to a record that already exists. Use this only for an
explicit instruction to change, cancel, rename or reschedule something that is
already there. If the caller supplied a list of records, set target.id to the
one meant — but only when you are sure it is that record and not a similar
one. Otherwise leave target.id null and put the speaker's own words in
target.described_as.

unparsed — anything that looks like it was meant to be an item but that you
cannot map confidently. Copy the speaker's words in exactly and say why.

Rules that outrank completeness:

1. Never invent a detail that was not said. If a value was not stated, leave
   the field out. An omitted field is correct. A guessed one is not, and is
   worse than nothing, because the person reading it cannot tell it was a
   guess.

2. Putting something in unparsed is a correct answer, not a failure. Returning
   fewer, honest items beats returning a complete-looking set with one
   invented detail in it.

3. Quote, never paraphrase. source_text must be copied character for
   character from the input. It is how the speaker checks your work against
   what they actually said.

4. People restate themselves, trail off, and correct themselves out loud. A
   spoken "no", "actually", "I mean", "or" or "sorry" cancels what came
   before it: honour the correction, and drop what it replaced along with
   anything that was attached only to the retracted words. The same thing
   said twice in a row is one item, not two.

5. Ignore conversational filler that asks for nothing.

6. Set confidence on every item, from 0 to 1: how sure you are that this is
   what the speaker meant. Do not leave it out.`;

export function userMessage(text: string, existing?: { id: string; label: string }[]): string {
  const records = existing?.length
    ? `Records that already exist, for the modified list:\n` +
      existing.map((r) => `  ${r.id}: ${r.label}`).join("\n") +
      `\n\n`
    : `The caller supplied no existing records, so target.id is always null.\n\n`;

  return `${records}The capture, verbatim:\n\n<capture>\n${text}\n</capture>`;
}
