/**
 * Does a candidate's own quote actually contain what the candidate claims?
 *
 * The failure this exists for: "call Westcott" came back with `due: "today"`,
 * quoting `"I need to call Westcott"` — a span with no date in it at all. The
 * date is real; he said it about the rent, in the sentence before. The model
 * carried it one item too far. Seen in two runs of three.
 *
 * The prompt already forbids this in as many words. An instruction the model
 * ignores two times in three is not a guard, so this checks afterwards
 * instead of asking beforehand.
 *
 * §2.2 decides what to do about it: "a wrong entry is worse than a missing
 * one." A date that cannot be supported by the candidate's own words is
 * removed, turning a wrong entry into a missing one — and the removal is
 * reported, because removing something silently is the same fault as the
 * model dropping a payee silently.
 *
 * WHAT IT CANNOT CATCH, stated because a guard that is trusted further than
 * it reaches is worse than no guard. It compares a claim against the span the
 * model chose to quote. When the model quotes a WIDER span than it used —
 * quoting the whole retraction, then attaching "next week" from inside it —
 * the words are present and this sees nothing wrong. Measured against real
 * runs it catches the borrowed "today" on Westcott and the "next week" on the
 * Bupa item, and misses the "next week" on the GP item for exactly that
 * reason.
 */

import { namedTokens } from "./coverage.ts";

const words = (s: string): string[] =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Field names whose value claims words the quote does not contain.
 *
 * Only string values. A boolean cannot be traced to a phrase — `urgent: true`
 * says nothing about which words produced it — so this stays quiet rather
 * than inventing a rule it cannot apply (§2.1: silence here means not
 * checked, never verified).
 */
export function ungroundedFields(item: Record<string, unknown>, quote: string): string[] {
  const have = new Set(words(quote));
  const out: string[] = [];

  for (const [field, value] of Object.entries(item)) {
    if (typeof value !== "string") continue;
    const claimed = words(value);
    if (!claimed.length) continue;
    // Every word, not most: a date is two or three words and a majority rule
    // would pass "next Tuesday" against a quote containing only "next".
    if (!claimed.every((w) => have.has(w))) out.push(field);
  }
  return out;
}

/**
 * Names or numbers in a candidate's own quote that the item never mentions.
 *
 * The mirror of ungroundedFields, and §2.2 has both directions: never invent
 * a detail, never delete one. This is the delete direction, per candidate.
 *
 * The failure it exists for: the rent item came back titled "Pay rent today"
 * from a quote carrying the whole sentence, including "in Megan" — the person
 * the money is owed to. The quote was complete, so the coverage check saw no
 * gap; the title claimed nothing unsupported, so the grounding check saw no
 * invention. The item simply did not use a name that was sitting in its own
 * source, and read as finished while owing nothing to anyone.
 *
 * It reports; it cannot repair. There is no way to know from here which field
 * the name belonged in, and putting it somewhere would be guessing at input
 * (§2.2) — the fault this is watching for, committed by the watcher.
 */
/**
 * Is this dropped name just an earlier attempt at one that WAS used?
 *
 * From his second dictation: "I need to call West Scott WESCOTT" — he says
 * the name, then spells it out because speech-to-text got it wrong. The item
 * correctly uses "Wescott", which leaves "West" and "Scott" sitting unused in
 * its own quote. Reporting those as losses is not wrong exactly, but it is
 * noise on top of the model doing the right thing, and a report that fires
 * when nothing happened is how a report stops being read (§13.8).
 *
 * A variant is either contained in the used name — "scott" inside "wescott" —
 * or shares its opening. Both are textual; neither knows anything about names.
 *
 * The risk, stated rather than discovered later: two genuinely different
 * names that start alike, "Sam" used and "Samantha" dropped, would be
 * suppressed and the loss would go unreported. That is a real false negative.
 * It is accepted because the alternative fires on every spelled-out
 * correction, and he corrects the transcription often enough that this
 * paragraph does it twice.
 */
function looksLikeSameName(dropped: string, used: Set<string>): boolean {
  const d = dropped.toLowerCase();
  for (const u of used) {
    if (u.includes(d) || d.includes(u)) return true;
    if (d.length >= 3 && u.length >= 3 && d.slice(0, 3) === u.slice(0, 3)) return true;
  }
  return false;
}

export function droppedFromQuote(item: Record<string, unknown>, quote: string): string[] {
  const used = new Set(
    Object.values(item)
      .filter((v): v is string => typeof v === "string")
      .flatMap(words)
  );
  const seen = new Set<string>();
  return namedTokens(quote).filter((t) => {
    const key = t.toLowerCase();
    if (used.has(key) || seen.has(key)) return false;
    if (looksLikeSameName(t, used)) return false;
    seen.add(key);
    return true;
  });
}
