/**
 * Turn one capture into candidates. Stateless: nothing here reads or writes
 * storage, and there is no storage to read (§10, "It stores nothing").
 *
 * Everything the model hands back is checked before it is passed on. A model
 * that omits a confidence, quotes words that were never said, or returns an
 * item that does not fit the caller's schema produces a flagged verbatim
 * fragment, never a plausible-looking item (§2.2).
 */
import { SYSTEM, userMessage } from "./prompt.ts";
import { uncovered } from "./coverage.ts";
import { droppedFromQuote, fieldOrigins } from "./grounding.ts";
import { sharesAWord } from "./similarity.ts";
import { validate } from "./schema.ts";
import type { Candidate, Modification, ModelClient, ParseRequest, ParseResult, Unparsed } from "./types.ts";

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export async function parse(
  request: ParseRequest,
  deps: { model: ModelClient }
): Promise<ParseResult> {
  const started = Date.now();

  const reply = await deps.model.complete({
    system: SYSTEM,
    user: userMessage(request.text, request.existing),
    schema: request.schema,
  });

  const created: Candidate[] = [];
  const pending: { item: Record<string, unknown>; confidence: number; quote: string }[] = [];
  const modified: Modification[] = [];
  const unparsed: Unparsed[] = [];
  let unaccounted: string[] = [];

  const verbatim = (reason: string) => {
    unparsed.push({ text: request.text, reason });
    return done();
  };

  const done = (): ParseResult => ({
    model: reply.model,
    created,
    modified,
    unparsed,
    unaccounted,
    elapsed_ms: Date.now() - started,
  });

  // A reply that is not the shape we asked for is not an empty capture. The
  // words are handed straight back so the calling app can show them.
  if (!isObject(reply.json)) {
    return verbatim("the model did not return a readable answer");
  }

  const haystack = norm(request.text);
  const required = new Set(
    Array.isArray((request.schema as Record<string, unknown>).required)
      ? ((request.schema as Record<string, unknown>).required as unknown[]).filter(
          (k): k is string => typeof k === "string")
      : []
  );

  /** Checks common to every candidate. Returns the problems, not a boolean. */
  function faults(c: Record<string, unknown>): string[] {
    const found: string[] = [];

    // Bug family (g): absence of data read as precision. A missing confidence
    // is not a confident item, and a default supplied here would be this
    // service asserting something the model declined to assert.
    if (typeof c.confidence !== "number" || !(c.confidence > 0) || c.confidence > 1) {
      found.push("no usable confidence was given");
    }

    // §10 requires the parse be checkable against what he actually said. A
    // quote that is not in the capture cannot serve as evidence, whether it
    // is a paraphrase or an invention — and from here the two are identical.
    if (typeof c.source_text !== "string" || !c.source_text.trim()) {
      found.push("no source quote was given");
    } else if (!haystack.includes(norm(c.source_text))) {
      found.push("the source quote is not in the capture");
    }

    return found;
  }

  const flag = (c: unknown, problems: string[]) =>
    unparsed.push({
      text: typeof (c as Record<string, unknown>)?.source_text === "string"
        ? String((c as Record<string, unknown>).source_text)
        : request.text,
      reason: problems.join("; "),
    });

  for (const raw of Array.isArray(reply.json.created) ? reply.json.created : []) {
    if (!isObject(raw)) continue;
    const problems = faults(raw);
    if (!isObject(raw.item)) {
      problems.push("no item was given");
    } else {
      problems.push(...validate(raw.item, request.schema));
    }
    if (problems.length) {
      flag(raw, problems);
      continue;
    }
    // Held rather than finished. Deciding whether a field was taken from
    // another item or from nowhere needs every candidate's quote, and the
    // modifications have not been read yet.
    pending.push({
      item: raw.item as Record<string, unknown>,
      confidence: raw.confidence as number,
      quote: raw.source_text as string,
    });
  }

  const labels = new Map((request.existing ?? []).map((r) => [r.id, r.label]));

  for (const raw of Array.isArray(reply.json.modified) ? reply.json.modified : []) {
    if (!isObject(raw)) continue;
    const problems = faults(raw);
    const target = isObject(raw.target) ? raw.target : {};
    const describedAs = typeof target.described_as === "string" ? target.described_as : "";

    if (!describedAs) problems.push("the record was not described");
    if (typeof raw.intent !== "string" || !raw.intent.trim()) problems.push("no change was described");

    if (problems.length) {
      flag(raw, problems);
      continue;
    }

    // §10: "Any operation touching an existing record requires explicit
    // confirmation naming the record — always." An id the caller did not
    // supply names nothing. It is dropped rather than passed on, but the
    // change stays a change: silently demoting it to a creation would turn
    // "cancel that" into "add that", the inverse of what was asked.
    //
    // And the record it points at has to match the words it used.
    //
    // From a real dictation, 2026-09-05: the model returned
    // described_as "Finish tax return" alongside the id of "Email profs re
    // work, put in regular notification for checking work". It described the
    // right record and handed over the wrong one — the two halves of its own
    // answer contradict each other, and that is visible from here without
    // knowing which half is right. So neither is believed.
    //
    // This check belongs in this service rather than in each caller. Only
    // here are both halves in hand: the caller's own id-to-label list and the
    // model's description of what it meant. The task app wrote its own copy
    // of it the night this happened; the routine and media apps would each
    // have had to rediscover the same bug.
    // Empty means the model declined to name a record, which is an answer and
    // not a failure (rule 3). It must not become a rejection: reporting "not
    // one of the records supplied" for an id the model never claimed would be
    // this service inventing a fault to explain its own encoding.
    const offered = typeof target.id === "string" && target.id.trim() ? target.id.trim() : null;
    let id: string | null = null;
    let rejected: Modification["target"]["rejected"];

    if (offered) {
      const label = labels.get(offered);
      if (label === undefined) {
        rejected = { id: offered, reason: "not one of the records supplied" };
      } else if (!sharesAWord(describedAs, label)) {
        rejected = {
          id: offered,
          label,
          reason: "the record it named and the words it used share nothing",
        };
      } else {
        id = offered;
      }
    }

    // Everything this change says, against everything its quote said.
    const quote = raw.source_text as string;
    const lost = droppedFromQuote({ describedAs, intent: raw.intent as string }, quote);

    modified.push({
      target: { id, described_as: describedAs, ...(rejected ? { rejected } : {}) },
      intent: raw.intent as string,
      confidence: raw.confidence as number,
      source_text: quote,
      ...(lost.length ? { dropped: lost } : {}),
    });
  }

  // --- second pass: where did each field's value actually come from? ------
  //
  // Only possible here, with every quote in hand. A value another candidate
  // quotes was taken from that candidate; a value nobody quotes was taken
  // from nowhere and belongs to no one item — see fieldOrigin.
  const quotes = [...pending.map((p) => p.quote), ...modified.map((m) => m.source_text)];

  pending.forEach((p, index) => {
    const others = quotes.filter((_, j) => j !== index);
    const removed: NonNullable<Candidate["removed"]> = [];
    const unverified: NonNullable<Candidate["unverified"]> = [];

    for (const { field, value, origin } of fieldOrigins(p.item, p.quote, others, request.text)) {
      // Required fields are left entirely alone: removing one would make the
      // item fail the caller's own schema, and a caller entitled to
      // abstractive titles should not be second-guessed about them (§10).
      if (origin === "grounded" || required.has(field)) continue;

      if (origin === "orphan") {
        // He said it. Nothing else claimed it. Throwing it away loses a real
        // deadline, and saying "you didn't say that" about words he did say
        // is worse than either — so it stays, and it says what it is.
        unverified.push({
          field,
          value,
          reason: "said in the capture, but not in the words this item quoted",
        });
        continue;
      }

      // invented or borrowed: §2.2, a wrong entry is worse than a missing one.
      removed.push({
        field,
        value,
        reason: origin === "borrowed"
          ? "said about something else in the capture"
          : "not said anywhere in the capture",
      });
      delete p.item[field];
    }

    // After the removals, so a name that only appeared in a field this
    // service just stripped is correctly reported as lost.
    const dropped = droppedFromQuote(p.item, p.quote);

    created.push({
      item: p.item,
      confidence: p.confidence,
      source_text: p.quote,
      ...(removed.length ? { removed } : {}),
      ...(unverified.length ? { unverified } : {}),
      ...(dropped.length ? { dropped } : {}),
    });
  });

  for (const raw of Array.isArray(reply.json.unparsed) ? reply.json.unparsed : []) {
    if (!isObject(raw)) continue;
    if (typeof raw.text !== "string" || !raw.text.trim()) continue;
    unparsed.push({
      text: raw.text,
      reason: typeof raw.reason === "string" && raw.reason.trim() ? raw.reason : "the model gave no reason",
    });
  }

  // Bug family (a): absence of bad news read as good news. Real words in and
  // nothing out is not a clean parse — it is a parse that failed quietly, and
  // an empty success would tell the calling app the capture held no items,
  // which it has no way to know (§2.1).
  if (!created.length && !modified.length && !unparsed.length && request.text.trim()) {
    return verbatim("nothing in the capture could be mapped to the schema");
  }

  // The same rule applied to the parts rather than the whole. A model that
  // silently drops one sentence produces a result that looks complete, and
  // nothing downstream can tell that something is missing — so the service
  // checks rather than trusting. Measured: the cancellation instruction
  // vanished entirely in two runs of five.
  unaccounted = uncovered(request.text, [
    ...created.map((c) => c.source_text),
    ...modified.map((m) => m.source_text),
    ...unparsed.map((u) => u.text),
  ]);

  return done();
}
