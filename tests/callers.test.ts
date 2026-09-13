/**
 * Per-caller secrets — src/callers.ts. Free to run; nothing reaches the network.
 *
 * The property being bought is that one app can be revoked without the others,
 * so it is tested directly: remove one app's secret and watch that app fail
 * while the other keeps working. And every refusal is checked by counting model
 * calls, not by reading status codes, because the refusal is free and the call
 * is not (tests/auth.test.ts explains why).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/handler.ts";
import { callersFromEnv, identify, LEGACY } from "../src/callers.ts";
import { recordingModel } from "./helpers/recording-model.ts";
import { TASK_SCHEMA } from "./fixtures/dictation.ts";

const FND = "fnd-secret-not-real-0000000000000000";
const ADHD = "adhd-secret-not-real-111111111111111";
const ROUTINE = "routine-secret-not-real-22222222222";
const SHARED = "shared-secret-not-real-333333333333";
const TEXT = "buy milk tomorrow";

const request = (token: string) => ({
  method: "POST",
  headers: { authorization: `Bearer ${token}` } as Record<string, string | undefined>,
  body: JSON.stringify({ text: TEXT, schema: TASK_SCHEMA }),
});

async function send(token: string, callers: Record<string, string>) {
  const model = recordingModel();
  const lines: string[] = [];
  const res = await handle(request(token), { model, callers, log: (l) => lines.push(l) });
  return { status: res.status, calls: model.calls, lines };
}

// --- identity ---------------------------------------------------------------

test("each app's own secret admits it, and names it", async () => {
  const callers = { fnd: FND, adhd: ADHD };
  const fnd = await send(FND, callers);
  const adhd = await send(ADHD, callers);
  assert.equal(fnd.status, 200);
  assert.equal(adhd.status, 200);
  assert.deepEqual(fnd.lines, ["capture-caller fnd"]);
  assert.deepEqual(adhd.lines, ["capture-caller adhd"],
    "A request is attributed to the app whose secret it carries, and to no other.");
});

// --- the property being bought ---------------------------------------------

test("revoking one app refuses that app and leaves the other working", async () => {
  // This is the whole reason for the change. With one shared secret, revoking
  // either app meant rotating the value for both. Removing FND's entry must
  // refuse FND — before any model call — and change nothing for the task app.
  const afterRevokingFnd = { adhd: ADHD };
  const fnd = await send(FND, afterRevokingFnd);
  const adhd = await send(ADHD, afterRevokingFnd);

  assert.equal(fnd.status, 401, "FND's secret no longer admits anyone.");
  assert.equal(fnd.calls, 0, "Refused before the model: the refusal is free, the call is not.");
  assert.equal(adhd.status, 200, "The task app did not lose access because FND did.");
  assert.equal(adhd.calls, 1);
});

// --- duplicates, PLANTED rather than asserted -------------------------------
//
// Sean's instruction, 2026-09-13: test the refusal by planting two apps with the
// same value, not by asserting that a check exists — "a guard that appears to
// work is the failure mode you're preventing." Each case below is built so that
// a plausible WRONG implementation fails it. That is checked, not claimed: the
// suite was run against a deliberately broken first-match version of identify()
// and these tests went red (see the commit message).

test("two apps holding the same value: that value is refused for both", async () => {
  // Wrong implementation this catches: first match wins. It would admit SHARED
  // as "fnd" — and revoking FND by deleting its entry would then change
  // nothing, because the adhd entry would still admit the same value. A
  // revocation that looks like it worked.
  const planted = { fnd: SHARED, adhd: SHARED, routine: ROUTINE };
  const dup = await send(SHARED, planted);

  assert.equal(dup.status, 401);
  assert.equal(dup.calls, 0);
  assert.deepEqual(dup.lines, ["capture-caller rejected duplicate"],
    "Refused and SAID why, in the log — so a configuration mistake reads as one, " +
    "not as an app with a bad token.");
});

test("...and only that value: an app with a secret of its own is untouched", async () => {
  // Wrong implementation this catches: refuse everything once any duplicate
  // exists. It passes the test above too — so without this one, a guard that
  // takes down every app over one copy-paste would look correct.
  const planted = { fnd: SHARED, adhd: SHARED, routine: ROUTINE };
  const routine = await send(ROUTINE, planted);
  assert.equal(routine.status, 200,
    "A mistake in two apps' configuration must not take down a third.");
  assert.deepEqual(routine.lines, ["capture-caller routine"]);
});

test("the likeliest real mistake: the old shared value copied into a named secret", async () => {
  // During this very migration, CAPTURE_TOKEN_FND set to the existing shared
  // value instead of a newly generated one. Attribution is then broken for
  // every request carrying it — FND's and the task app's alike, since the task
  // app is still on the shared value — so all of them are refused, and the task
  // app's new secret, once it has one, still works.
  const planted = { [LEGACY]: SHARED, fnd: SHARED, adhd: ADHD };
  assert.equal((await send(SHARED, planted)).status, 401);
  assert.equal((await send(SHARED, planted)).calls, 0);
  assert.equal((await send(ADHD, planted)).status, 200);
});

test("a duplicate hidden by a trailing newline is still a duplicate", async () => {
  // A value piped into Vercel with a newline on the end is the realistic way
  // two entries look different and are one. Compared untrimmed, these are two
  // secrets and the duplicate passes unseen.
  const planted = callersFromEnv({
    CAPTURE_TOKEN_FND: SHARED,
    CAPTURE_TOKEN_ADHD: `${SHARED}\n`,
  });
  const dup = await send(SHARED, planted);
  assert.equal(dup.status, 401);
  assert.deepEqual(dup.lines, ["capture-caller rejected duplicate"]);
});

// --- the migration's fallback -------------------------------------------------

test("the old shared secret still works during the migration, under its own name", async () => {
  const during = callersFromEnv({ CAPTURE_TOKEN: SHARED, CAPTURE_TOKEN_FND: FND });
  const legacy = await send(SHARED, during);
  assert.equal(legacy.status, 200);
  assert.deepEqual(legacy.lines, ["capture-caller legacy"],
    "Named, so the logs can show an app that has not moved yet — which is what " +
    "step 3 waits on before deleting it.");
});

// --- what the log line may carry -----------------------------------------------

test("the log line never carries the token or the words", async () => {
  const callers = { fnd: FND };
  const ok = await send(FND, callers);
  const bad = await send("not-a-real-secret-at-all", callers);
  for (const line of [...ok.lines, ...bad.lines]) {
    assert.ok(!line.includes(FND), `token in log line: ${line}`);
    assert.ok(!line.includes("not-a-real-secret"), `supplied value in log line: ${line}`);
    assert.ok(!line.includes("milk"), `capture text in log line: ${line}`);
  }
  assert.deepEqual(bad.lines, ["capture-caller rejected unknown"]);
});

test("exactly one line per request, including requests refused later", async () => {
  // A request that passes auth and then fails a body check still evidences which
  // app sent it. One line, not one per check.
  const model = recordingModel();
  const lines: string[] = [];
  const res = await handle(
    { method: "POST", headers: { authorization: `Bearer ${FND}` }, body: JSON.stringify({ text: "hi", schema: TASK_SCHEMA }) },
    { model, callers: { fnd: FND }, log: (l) => lines.push(l) }
  );
  assert.equal(res.status, 400);
  assert.equal(model.calls, 0);
  assert.deepEqual(lines, ["capture-caller fnd"]);
});

test("with logging off, nothing is written at all", async () => {
  const model = recordingModel();
  const res = await handle(request(FND), { model, callers: { fnd: FND } });
  assert.equal(res.status, 200, "and the request works exactly the same");
});

// --- reading the environment -----------------------------------------------------

test("caller names come from the variable name; empty and malformed entries are ignored", () => {
  assert.deepEqual(
    callersFromEnv({
      CAPTURE_TOKEN_FND: FND,
      CAPTURE_TOKEN_ADHD: `  ${ADHD}  `,
      CAPTURE_TOKEN: SHARED,
      CAPTURE_TOKEN_EMPTY: "",
      CAPTURE_TOKEN_: "no-name",
      CAPTURE_TOKENX: "wrong-prefix",
      ANTHROPIC_API_KEY: "never-a-caller",
    }),
    { fnd: FND, adhd: ADHD, [LEGACY]: SHARED },
    "The API key in particular must never be read as a caller secret — this " +
    "service holds it, and nothing may authenticate with it."
  );
});

test("nothing configured is refused, however well-formed the request", () => {
  assert.deepEqual(identify(FND, {}), { ok: false, reason: "unconfigured" });
  assert.deepEqual(identify(FND, { fnd: "   " }), { ok: false, reason: "unconfigured" });
});
