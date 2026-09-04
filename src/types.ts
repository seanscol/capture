/** Shapes shared across the service. One definition, imported (bug family (b)). */

/** What the caller sends. `schema` is theirs; this service has no opinion on it. */
export type ParseRequest = {
  text: string;
  schema: Record<string, unknown>;
  /** Records the caller already holds, so a modification can name one (§10). */
  existing?: { id: string; label: string }[];
};

export type Candidate = {
  item: Record<string, unknown>;
  confidence: number;
  source_text: string;
  /**
   * Fields taken off the item because its own quote did not contain them —
   * see src/grounding.ts. Reported rather than dropped quietly: removing
   * something without saying so is the fault being guarded against.
   */
  removed?: { field: string; value: string; reason: string }[];
  /**
   * Names or numbers sitting in this candidate's own quote that the item
   * never mentions — see droppedFromQuote in src/grounding.ts. Reported only:
   * which field a lost name belonged in cannot be known from here, and
   * putting it somewhere would be the guess this is watching for.
   */
  dropped?: string[];
};

export type Modification = {
  /**
   * §10: "Any operation touching an existing record requires explicit
   * confirmation naming the record — always, not only when confidence is
   * low." `id` is null whenever the record could not be identified from what
   * the caller supplied; `described_as` always carries the speaker's words so
   * the caller can ask which one was meant.
   */
  target: { id: string | null; described_as: string };
  intent: string;
  change?: Record<string, unknown>;
  confidence: number;
  source_text: string;
};

/** §2.2: anything unparseable is stored verbatim and flagged. */
export type Unparsed = { text: string; reason: string };

export type ParseResult = {
  /** Echoed, never assumed — §5.8, constants live in code and readers read them. */
  model: string;
  created: Candidate[];
  modified: Modification[];
  /** The model said it could not map these (§2.2). Its claim, in its words. */
  unparsed: Unparsed[];
  /**
   * Stretches of the capture that no candidate quoted. Computed here, not
   * claimed by the model — see src/coverage.ts.
   *
   * A weaker statement than `unparsed`, and deliberately so: it says only
   * that nothing cited these words, never that they were misunderstood or
   * lost. A restatement the model quoted once will show up here, and so will
   * an instruction it dropped altogether. The caller cannot tell those apart
   * either — but it can show them, and Sean can, which is the whole point.
   */
  unaccounted: string[];
  elapsed_ms: number;
};

export type ModelRequest = { system: string; user: string; schema: Record<string, unknown> };
export type ModelReply = { model: string; json: unknown };

/**
 * The model, behind one method, so tests can count calls instead of inferring
 * from a status code that no call happened (§7 practices).
 */
export type ModelClient = {
  id: string;
  complete(request: ModelRequest): Promise<ModelReply>;
};

export type HttpRequest = {
  method: string;
  headers: Record<string, string | undefined>;
  body: string;
};

export type HttpResponse = { status: number; body: unknown };

export type Deps = { model: ModelClient; token: string | undefined };
