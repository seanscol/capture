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
