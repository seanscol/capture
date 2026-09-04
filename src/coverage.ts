/**
 * Which parts of the capture did the model never account for?
 *
 * The failure this exists for: the instruction to cancel something was
 * dropped entirely in two runs of five — not created, not modified, not
 * flagged. Gone. The other failures land in the confirm queue where Sean sees
 * them; an item that never arrives appears nowhere, and its absence reads as
 * "he didn't say that". Bug family (a), and §2.1 in one line: absence of a
 * candidate for a stretch of text is not evidence there was nothing in it.
 *
 * So this does not ask the model anything. It takes the spans the model
 * quoted — every source_text, plus everything it flagged itself — and reports
 * what is left over. Deterministic, free, and it cannot be talked out of a
 * finding the way a prompt rule can.
 *
 * It says what was not accounted for. It never says what the leftover means:
 * that would be guessing at input (§2.2), which is the thing it exists to
 * prevent.
 */

/**
 * Below this, a leftover is punctuation and throat-clearing rather than
 * something that could carry an item. Too low and every "um" is a finding,
 * which teaches him to skim past the list that matters (§13.8's own test for
 * a checker). Too high and a short instruction disappears silently, which is
 * the bug. PLACEHOLDER (§5.7) — tune it against real captures, not this one.
 */
export const MIN_UNCOVERED_CHARS = 25;

/** Normalised text, plus a map from each normalised index back to the original. */
function normalise(text: string) {
  let out = "";
  const map: number[] = [];
  let space = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i].toLowerCase();
    if (/[a-z0-9]/.test(c)) {
      out += c;
      map.push(i);
      space = false;
    } else if (!space && out.length) {
      out += " ";
      map.push(i);
      space = true;
    }
  }
  while (out.endsWith(" ")) {
    out = out.slice(0, -1);
    map.pop();
  }
  return { out, map };
}

/**
 * Stretches of `text` that none of `quotes` covers, each at least
 * `minChars` long, returned as they appear in the original.
 */
export function uncovered(text: string, quotes: string[], minChars = MIN_UNCOVERED_CHARS): string[] {
  const { out, map } = normalise(text);
  if (!out) return [];

  const seen = new Array<boolean>(out.length).fill(false);

  for (const quote of quotes) {
    const needle = normalise(quote).out;
    if (needle.length < 3) continue;
    // Every occurrence, not just the first: a phrase the speaker repeated is
    // covered wherever it appears, and marking only one leaves a false gap.
    for (let at = out.indexOf(needle); at !== -1; at = out.indexOf(needle, at + 1)) {
      for (let i = at; i < at + needle.length; i++) seen[i] = true;
    }
  }

  const gaps: string[] = [];
  let start: number | null = null;

  for (let i = 0; i <= out.length; i++) {
    const covered = i === out.length || seen[i];
    if (!covered && start === null) start = i;
    if (covered && start !== null) {
      if (out.slice(start, i).trim().length >= minChars) {
        gaps.push(text.slice(map[start], map[i - 1] + 1).trim());
      }
      start = null;
    }
  }

  return gaps;
}
