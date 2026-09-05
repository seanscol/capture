/**
 * Do two pieces of text share a real word?
 *
 * Used for one job: telling whether a modification's two halves agree — the
 * record the model handed over, and the words it used to describe it.
 *
 * **A deliberately low bar.** It is meant to catch a flat contradiction, not
 * to judge a near match. "Finish tax return" against "Email profs re work,
 * put in regular notification for checking work" shares nothing; that is the
 * shape being caught. Anything closer than that is left alone, because the
 * cost of being strict here is landing on "I couldn't tell which one you
 * meant" for a change he described perfectly well.
 *
 * Known weakness, written down rather than left to be rediscovered: a common
 * word carries as much weight as a rare one, so "the call about the debt"
 * against "Call the dentist" would share "call" and pass. Weighting a word by
 * how many of the caller's own labels contain it would fix that, and would
 * stay generic because the labels come from the caller. Not built: it adds a
 * threshold to tune and this bar is meant to be low.
 */

/**
 * Words too common to mean anything on their own. English function words
 * only — nothing about tasks, records or any other domain, because the next
 * caller is not the task app (§10).
 */
const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "than", "that", "this",
  "these", "those", "there", "here", "for", "from", "with", "without", "about",
  "into", "onto", "out", "off", "over", "under", "again", "all", "any", "some",
  "not", "no", "yes", "you", "your", "yours", "me", "my", "mine", "him", "his",
  "her", "hers", "them", "their", "theirs", "it", "its", "we", "our", "ours",
  "is", "are", "was", "were", "be", "been", "being", "am", "do", "does", "did",
  "have", "has", "had", "will", "would", "shall", "should", "can", "could",
  "may", "might", "must", "need", "want", "get", "got", "go", "going",
  "to", "of", "in", "on", "at", "by", "up", "down", "as", "so", "just", "now",
  "one", "two", "thing", "things", "stuff", "please", "sorry", "um", "uh",
]);

/** Content words, lowercased. Short tokens are dropped as noise. */
export function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !FUNCTION_WORDS.has(w))
  );
}

/**
 * True when the two share at least one content word.
 *
 * **A side with no content words is not agreement.** The first version of
 * this returned true there, reasoning that two empty sets cannot contradict
 * each other. That is the wrong way round. The whole reason this check
 * exists is that an id on its own has been shown to be untrustworthy, so the
 * description is what corroborates it — and a description made entirely of
 * function words ("the thing about the stuff") corroborates nothing. Passing
 * it means accepting the id on no evidence, which is §2.1 exactly: upward is
 * earned, never granted by the absence of a reason to refuse.
 *
 * A description that is genuinely empty never reaches here — parse.ts flags
 * that as unparseable before this is called — so the case this rejects is
 * always one where the model said something and said nothing.
 */
export function sharesAWord(a: string, b: string): boolean {
  const left = significantWords(a);
  const right = significantWords(b);
  if (!left.size || !right.size) return false;
  for (const w of left) if (right.has(w)) return true;
  return false;
}
