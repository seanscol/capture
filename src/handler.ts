/**
 * The endpoint. Auth first, before anything that costs money.
 *
 * §10: "It authenticates its callers with a bearer token checked *before* the
 * model is called: it is the one component where being called costs money."
 *
 * The order below is the rule. Every check that can reject a request sits
 * above the model call, and the cheapest and most certain check sits at the
 * top. `tests/auth.test.ts` holds the order in place by counting model calls
 * rather than reading status codes.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { parse } from "./parse.ts";
import type { Deps, HttpRequest, HttpResponse, ParseRequest } from "./types.ts";

/** A capture is a paragraph. Input length is the bill. PLACEHOLDER (§5.7). */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Below this there is no room for anything to capture, and a stray tap
 * should not reach a metered API. The calling app still holds the raw text
 * and shows it either way, so nothing is lost by refusing. PLACEHOLDER (§5.7).
 */
const MIN_TEXT_LENGTH = 3;

const fail = (status: number, error: string): HttpResponse => ({ status, body: { error } });

/**
 * Compares digests, not the strings, so neither the length nor the content of
 * the real token leaks through how long the comparison takes.
 */
function tokenMatches(supplied: string, expected: string): boolean {
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function handle(req: HttpRequest, deps: Deps): Promise<HttpResponse> {
  // ---- 1. auth ------------------------------------------------------------
  // Nothing above this line reads the body, the method, or anything else.

  // FND's proxy.ts fails OPEN when its token is unset, deliberately, so a typo
  // cannot lock Sean out of logging mid-relapse (§5.6). That reasoning does
  // not carry over here — it inverts. Nothing medical depends on this service;
  // the calling app has already stored the raw capture and falls back to its
  // own parser (§10). What an unset variable would open here is a metered API
  // key, and an unset variable is absence of data, which is never good news
  // and never a grant of permission (§2.1): downward is free, upward is
  // earned. So this one fails CLOSED.
  if (!deps.token) {
    return fail(401, "This service is not configured with a token, so it accepts nothing.");
  }

  const header = req.headers.authorization ?? req.headers.Authorization ?? "";
  const supplied = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim() ?? "";
  if (!supplied || !tokenMatches(supplied, deps.token)) {
    return fail(401, "Unauthorized.");
  }

  // ---- 2. everything else that can reject, still above the model ---------

  if (req.method.toUpperCase() !== "POST") {
    return fail(405, "POST only.");
  }

  if (Buffer.byteLength(req.body ?? "", "utf8") > MAX_BODY_BYTES) {
    return fail(413, `A capture must be under ${MAX_BODY_BYTES} bytes.`);
  }

  let body: unknown;
  try {
    body = JSON.parse(req.body);
  } catch {
    return fail(400, "The body is not JSON.");
  }

  if (typeof body !== "object" || body === null) {
    return fail(400, "The body must be a JSON object.");
  }

  const { text, schema, existing } = body as Partial<ParseRequest>;

  if (typeof text !== "string" || text.trim().length < MIN_TEXT_LENGTH) {
    return fail(400, `"text" must be at least ${MIN_TEXT_LENGTH} characters.`);
  }

  // §10: the service "receives the schema with the request; knows nothing
  // about tasks or bands". A default schema invented here would be this
  // service knowing what a caller wants, which is the one thing it must not.
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    return fail(400, '"schema" is required and must be a JSON Schema object.');
  }

  if (existing !== undefined) {
    const ok = Array.isArray(existing) &&
      existing.every((r) => r && typeof r.id === "string" && typeof r.label === "string");
    if (!ok) return fail(400, '"existing" must be a list of { id, label }.');
  }

  // ---- 3. the model. Past this line, the request costs money. -------------

  try {
    const result = await parse(
      { text, schema: schema as Record<string, unknown>, existing },
      { model: deps.model }
    );
    return { status: 200, body: result };
  } catch {
    // §10: "If the service is slow or down, the raw is safe and the app falls
    // back to its existing parser and says so." The caller needs something
    // plain to branch on — a 200 with an empty result would read as "he said
    // nothing" and the fallback would never run.
    //
    // The upstream message is not echoed. It is the one place an account
    // detail or a fragment of a key could reach a response body.
    return fail(502, "The parser is unavailable.");
  }
}
