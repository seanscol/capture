/**
 * The step-3 gate — scripts/watch-callers.mjs. Free; reads a fixture.
 *
 * The fixture is four real records read back from the service's logs on
 * 2026-09-13, from probes sent at 19:47:54Z with each app's secret, the shared
 * one, and a value no app holds. Trimmed to the three fields the watcher reads.
 *
 * Temporary, like the watcher: removed with it in step 3.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error — a plain .mjs script, imported for its exported rules.
import { observations, apply } from "../scripts/watch-callers.mjs";

const lines = readFileSync(new URL("./fixtures/caller-log-records.jsonl", import.meta.url), "utf8").split("\n");
const obs = observations(lines);
const at = (iso: string) => Date.parse(iso);
const fresh = (movedAt: Record<string, number>) => ({ movedAt, seen: { fnd: false, adhd: false }, failedRuns: 0, ready: false });
const BEFORE_PROBES = at("2026-09-13T19:40:00Z");
const AFTER_PROBES = at("2026-09-13T19:52:37Z");

test("a name on a cold start is still found", () => {
  // Measured on the first probe: on a cold start the platform's own startup
  // line takes the record's `message`, and "capture-caller fnd" is only inside
  // `logs`. Reading `message` alone misses exactly the dictations that land on
  // a cold start — most of them, for an app used a few times a day — and the
  // watcher would wait forever while looking healthy.
  assert.ok(obs.some((o: { name: string }) => o.name === "fnd"));
});

test("a probe sent before an app moved is not evidence that it moved", () => {
  // Only a request carrying an app's secret can produce its name, and before
  // the move the only such requests were probes from the Mac. A probe is not the
  // app. Counting it would clear step 3 on evidence this session manufactured.
  const s = apply(fresh({ adhd: AFTER_PROBES }), obs);
  assert.equal(s.seen.adhd, false);
  assert.equal(s.ready, false);
});

test("not ready while any app is unmoved, whatever has been seen", () => {
  const s = apply(fresh({ adhd: BEFORE_PROBES }), obs);
  assert.equal(s.seen.adhd, true);
  assert.equal(s.ready, false, "FND has not moved; its name cannot clear the gate yet.");
});

test("ready only when every app has moved AND been seen", () => {
  const s = apply(fresh({ adhd: BEFORE_PROBES, fnd: BEFORE_PROBES }), obs);
  assert.equal(s.ready, true);
});

test("the shared secret in use after every app moved is flagged, not ignored", () => {
  // Something is still sending it: an app that did not pick up its new value,
  // or a caller nobody listed. Step 3 must not delete it.
  assert.equal(apply(fresh({ adhd: BEFORE_PROBES, fnd: BEFORE_PROBES }), obs).legacyAfterAllMoved, true);
});

test("the shared secret in use while an app is still unmoved is expected", () => {
  assert.equal(apply(fresh({ fnd: BEFORE_PROBES }), obs).legacyAfterAllMoved, undefined);
});

test("a refused request after a move is flagged", () => {
  // An app sending a value no app holds is an app failing and falling back.
  assert.equal(apply(fresh({ adhd: BEFORE_PROBES }), obs).rejectedAfterMove, true);
});

test("the state it keeps holds no request times", () => {
  // Whether, not when. A record of when he dictates is behavioural data the
  // service was built not to hold (§10); the watcher must not become one.
  const s = apply(fresh({ adhd: BEFORE_PROBES, fnd: BEFORE_PROBES }), obs);
  const requestTimes = obs.map((o: { t: number }) => o.t);
  const kept = JSON.stringify({ ...s, movedAt: undefined });
  for (const t of requestTimes) assert.ok(!kept.includes(String(t)), `request time ${t} kept in state`);
});

// --- waiting, or cannot see (§2.1) ------------------------------------------
//
// Added 2026-09-16, with Sean's yes, after three days in which the watcher saw
// nothing at all. Silence then meant two things — no capture reached the
// service while it was reading, or captures reached it and it could not see
// them — and only one of those is safe. These tests hold the two apart.

const HOUR = 60 * 60_000;
const probeTime = Math.min(...obs.map((o: { t: number }) => o.t));
const LATER = probeTime + HOUR;

/** A real record — FND's cold start — with its caller line removed. This is
 *  what a real request looks like to a watcher that cannot see the line. */
const unmarkedRecord = (() => {
  const real = lines.map((l) => (l.trim() ? JSON.parse(l) : null)).find((r) =>
    r && r.logs.some((x: { message: string }) => x.message === "capture-caller fnd"));
  return JSON.stringify({ ...real, logs: real.logs.filter((x: { message: string }) => !x.message.startsWith("capture-caller")) });
})();

test("capture requests after the move are recorded as traffic, and seeing them is not blindness", () => {
  const s = apply(fresh({ adhd: BEFORE_PROBES }), observations(lines, LATER));
  assert.equal(s.trafficSeenAfterMove, true);
  assert.equal(s.blindAfterMove, undefined, "Every one of these carried its caller line.");
});

test("a capture request with no caller line means the watcher cannot see", () => {
  const s = apply(fresh({ adhd: BEFORE_PROBES }), observations([unmarkedRecord], LATER));
  assert.equal(s.blindAfterMove, true,
    "While logging is on, every request the service handles writes one line. " +
    "A request with none is the watcher looking at the wrong thing, and if that " +
    "reads as waiting it waits forever.");
});

test("...but not while the request is too new for its line to have arrived", () => {
  // A request row and its log lines are delivered separately. Judged too soon,
  // a request that did log looks as though it did not — a false alarm, and a
  // watcher that cries wolf gets ignored like one that stays silent.
  const tooSoon = probeTime + 60_000;
  const s = apply(fresh({ adhd: BEFORE_PROBES }), observations([unmarkedRecord], tooSoon));
  assert.equal(s.blindAfterMove, undefined);
  assert.equal(s.trafficSeenAfterMove, true, "It is still traffic; it just is not judged yet.");
});

test("requests from before any app moved count as neither traffic nor blindness", () => {
  const s = apply(fresh({ adhd: AFTER_PROBES }), observations([unmarkedRecord, ...lines], LATER));
  assert.equal(s.trafficSeenAfterMove, undefined);
  assert.equal(s.blindAfterMove, undefined);
});

test("a request to any other path is neither", () => {
  // A favicon or a scanner hitting the root has no reason to carry a caller
  // line; counting it would raise the alarm over nothing.
  const other = JSON.stringify({ ...JSON.parse(unmarkedRecord), requestPath: "/favicon.ico" });
  const s = apply(fresh({ adhd: BEFORE_PROBES }), observations([other], LATER));
  assert.equal(s.trafficSeenAfterMove, undefined);
  assert.equal(s.blindAfterMove, undefined);
});

test("no capture requests at all is waiting, and says nothing", () => {
  const s = apply(fresh({ adhd: BEFORE_PROBES, fnd: BEFORE_PROBES }), observations([], LATER));
  assert.equal(s.trafficSeenAfterMove, undefined);
  assert.equal(s.blindAfterMove, undefined);
  assert.equal(s.ready, false);
});

test("the new facts hold no request times either", () => {
  const s = apply(fresh({ adhd: BEFORE_PROBES }), observations([unmarkedRecord, ...lines], LATER));
  const kept = JSON.stringify({ ...s, movedAt: undefined });
  for (const o of observations([unmarkedRecord, ...lines], LATER)) {
    assert.ok(!kept.includes(String(o.t)), `request time ${o.t} kept in state`);
  }
});
