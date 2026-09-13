/**
 * Which app is calling.
 *
 * §10: the service "authenticates its callers with a bearer token checked
 * *before* the model is called". Until 2026-09-13 it authenticated exactly
 * one caller: a single shared `CAPTURE_TOKEN`, held by every app that calls it.
 * Revoking one app meant rotating the value for all of them, and the service
 * could not say which app made a request.
 *
 * Now each caller has its own secret, named on the service side:
 * `CAPTURE_TOKEN_FND`, `CAPTURE_TOKEN_ADHD`. They are discovered by that prefix,
 * so adding or revoking a caller is a configuration change and never a code
 * change. The callers themselves change nothing — each still reads its own
 * `CAPTURE_TOKEN` and sends it; only the value is now its own.
 *
 * The bare `CAPTURE_TOKEN`, if still set on the service, is the shared secret
 * from before, accepted under the name "legacy" for the duration of the
 * migration and nothing else. It is removed once each named caller has been
 * seen authenticating by name — seen, not assumed: an app that happened not to
 * capture looks exactly like one that moved, and that is absence of data
 * (§2.1).
 */
import { createHash, timingSafeEqual } from "node:crypto";

export const LEGACY = "legacy";

const NAMED = /^CAPTURE_TOKEN_([A-Z0-9]+)$/;

/** Caller name to its secret. */
export type Callers = Record<string, string>;

/**
 * Caller secrets from the environment, by name.
 *
 * Read per request, never at module load (§5.2's rule for configuration), so a
 * redeploy that revokes a caller takes effect and nothing is cached past it.
 *
 * Values are trimmed. A secret piped into Vercel with a trailing newline is the
 * realistic way a caller ends up unable to authenticate, and — worse — the
 * realistic way two callers end up holding what looks like two values and is
 * one. Trimming here is what lets the duplicate refusal below see that.
 */
export function callersFromEnv(env: Record<string, string | undefined>): Callers {
  const callers: Callers = {};
  for (const [key, raw] of Object.entries(env)) {
    const value = (raw ?? "").trim();
    if (!value) continue;
    if (key === "CAPTURE_TOKEN") {
      callers[LEGACY] = value;
      continue;
    }
    const named = NAMED.exec(key);
    if (named) callers[named[1].toLowerCase()] = value;
  }
  return callers;
}

export type Identified =
  | { ok: true; caller: string }
  | { ok: false; reason: "unconfigured" | "no-credential" | "unknown" | "duplicate" };

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * Match a supplied bearer value to exactly one caller.
 *
 * **Every configured secret is compared, with no early exit**, and every match
 * is collected. Two things follow from that, and both are the point.
 *
 * It compares digests with a constant-time check, so neither the length nor
 * the content of any configured secret leaks through how long this takes.
 *
 * And a value configured for MORE than one caller is refused outright. If two
 * apps hold the same secret, revoking one of them revokes nothing — the other
 * entry still admits it — and every request carrying that value is attributed
 * to whichever name happened to come first. A first-match implementation
 * accepts it silently; that is a revocation that looks like it worked. So the
 * duplicated value is refused for everyone holding it, and only that value:
 * callers with a secret of their own are unaffected, which keeps a
 * configuration mistake from taking down apps it has nothing to do with.
 *
 * The most likely way this happens is during this very migration: copying the
 * existing shared value into `CAPTURE_TOKEN_FND` instead of generating a new
 * one. `tests/callers.test.ts` plants exactly that.
 */
export function identify(supplied: string, callers: Callers): Identified {
  const configured = Object.entries(callers).filter(([, v]) => v.trim().length > 0);
  if (configured.length === 0) return { ok: false, reason: "unconfigured" };

  const value = supplied.trim();
  if (!value) return { ok: false, reason: "no-credential" };

  const suppliedDigest = digest(value);
  const matches: string[] = [];
  for (const [name, secret] of configured) {
    if (timingSafeEqual(suppliedDigest, digest(secret.trim()))) matches.push(name);
  }

  if (matches.length === 0) return { ok: false, reason: "unknown" };
  if (matches.length > 1) return { ok: false, reason: "duplicate" };
  return { ok: true, caller: matches[0] };
}
