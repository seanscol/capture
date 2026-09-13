#!/usr/bin/env node
/**
 * Watches the service's own logs for each calling app's name, for the length
 * of the per-caller secret migration and no longer.
 *
 * WHY THIS EXISTS. The shared CAPTURE_TOKEN is deleted only once each named app
 * has been SEEN authenticating by name. "Nobody has used the shared secret
 * lately" cannot license deleting it: an app that happened not to capture looks
 * exactly like one that moved, and that is absence of data (§2.1). So the gate
 * is positive evidence — "fnd" seen AND "adhd" seen, from real traffic after
 * both moved.
 *
 * WHY IT HAS TO POLL. This team is on Vercel's Hobby plan, where runtime logs
 * are kept for one hour (verified 2026-09-13: plan read from the Vercel API,
 * retention from Vercel's docs, no log drains configured). Evidence that is
 * not read within the hour is gone. Every 20 minutes means every request is
 * read by at least two runs while the Mac is awake. If the Mac sleeps through a
 * dictation's hour, that evidence is lost and this simply waits for the next
 * one — slower, never wrong.
 *
 * WHAT IT KEEPS. Whether each name has been seen: true or false. Not when, not
 * how often. The logs it reads carry timestamps; this discards them. A record
 * of when he dictates is behavioural data the service was built not to hold,
 * and a watcher that kept it would be that record by another route.
 *
 * WHAT IT SAYS. Nothing while waiting. When both names have been seen, one note
 * in the planning inbox. If it cannot read the logs three runs running, one
 * note saying so — a watcher that has quietly stopped working is
 * indistinguishable from one still waiting, which is the failure §2.1 names.
 *
 * Removed, with its state file, its note and its launchd job, in step 3.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const HOME = homedir();
const STATE = join(HOME, "Projects/capture/.caller-migration.json");
const NOTE = join(HOME, "Projects/ecosystem/inbox/capture-callers.md");
const REPO = join(HOME, "Projects/capture");
const EXPECTED = ["fnd", "adhd"];
const MARKER = /^capture-caller (\S+)(?: (\S+))?$/;
const ERROR_RUNS = 3;

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i === -1 ? null : (args[i + 1] ?? ""); };
const DRY = args.includes("--dry-run");

/**
 * The Vercel CLI is not on launchd's PATH and lives in npx's cache under a hash
 * that changes when the CLI updates. Found at run time rather than written in,
 * so an update does not silently break this.
 */
function vercelBinary() {
  const root = join(HOME, ".npm/_npx");
  if (!existsSync(root)) return null;
  const found = readdirSync(root)
    .map((d) => join(root, d, "node_modules/.bin/vercel"))
    .filter((p) => existsSync(p));
  return found.length ? found[found.length - 1] : null;
}

function readLogLines() {
  const fromFile = flag("--from-file");
  if (fromFile) return readFileSync(fromFile, "utf8").split("\n");
  const bin = vercelBinary();
  if (!bin) throw new Error("no Vercel CLI found in ~/.npm/_npx");
  // `vercel logs` exits cleanly with no output both when nothing happened in the
  // hour and when it could not really read anything. Those must not look alike —
  // waiting and broken are different states (§2.1). whoami fails loudly when the
  // login has lapsed, so a clean exit below is a real, authenticated read.
  execFileSync(bin, ["whoami"], { cwd: REPO, timeout: 60_000, stdio: "ignore" });
  return execFileSync(bin, ["logs", "--environment", "production", "--json", "--limit", "500"], {
    cwd: REPO, encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "ignore"],
  }).split("\n");
}

/**
 * Caller names in records at or after `since`.
 *
 * Every entry in a record's `logs` list is read, not just its `message`. On a
 * cold start the platform's own startup line takes `message` and the marker is
 * only in `logs` — measured on the first probe, 2026-09-13. Reading `message`
 * alone would miss exactly the dictations that land on a cold start, which for
 * an app used a few times a day is most of them, and this would wait forever
 * while looking healthy.
 */
export function observations(lines) {
  const out = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    let record;
    try { record = JSON.parse(line); } catch { continue; }
    if (typeof record.timestamp !== "number") continue;
    const messages = [record.message, ...(Array.isArray(record.logs) ? record.logs.map((l) => l?.message) : [])];
    const names = new Set();
    for (const m of messages) {
      const hit = typeof m === "string" ? MARKER.exec(m.trim()) : null;
      if (hit) names.add(hit[1] === "rejected" ? `rejected:${hit[2] ?? "?"}` : hit[1]);
    }
    // The time is used to decide what counts and then dropped. It is never
    // written anywhere: this watcher keeps whether, not when.
    for (const name of names) out.push({ name, t: record.timestamp });
  }
  return out;
}

/** Names seen at or after `since` — for the dry-run parser test. */
export function namesSeen(lines, since) {
  return new Set(observations(lines).filter((o) => o.t >= since).map((o) => o.name));
}

/**
 * Apply what was just read to what is already known.
 *
 * A name counts only after ITS OWN app was moved. Before that, the only thing
 * that can produce "capture-caller fnd" is a probe run from the Mac with FND's
 * secret — which is how the instrument was tested — and a probe is not FND.
 * The shared secret counts as still in use only once EVERY app has moved:
 * before then, the app not yet moved is supposed to be using it.
 */
export function apply(state, obs) {
  const moved = state.movedAt ?? {};
  for (const name of EXPECTED) {
    if (moved[name] !== undefined && obs.some((o) => o.name === name && o.t >= moved[name])) {
      state.seen[name] = true;
    }
  }
  const allMoved = EXPECTED.every((n) => moved[n] !== undefined);
  if (allMoved) {
    const last = Math.max(...EXPECTED.map((n) => moved[n]));
    if (obs.some((o) => o.name === "legacy" && o.t >= last)) state.legacyAfterAllMoved = true;
  }
  const first = Math.min(...Object.values(moved));
  if (Number.isFinite(first) && obs.some((o) => /^rejected:(unknown|duplicate)$/.test(o.name) && o.t >= first)) {
    state.rejectedAfterMove = true;
  }
  state.ready = allMoved && EXPECTED.every((n) => state.seen[n]);
  return state;
}

function note(body) {
  if (DRY) { console.log("--- would write note ---\n" + body); return; }
  writeFileSync(NOTE, body);
}

/**
 * Only when launched, never when imported. The first test of apply() imported
 * this file, which ran the whole script, found no state, and exited before a
 * single assertion — no PASS and no FAIL, which is a test that did not run and
 * would have read as quiet success.
 */
function main() {
  // --- dry run against a file: test the parser without touching anything -------
  if (DRY) {
    const since = Date.parse(flag("--since") ?? "1970-01-01T00:00:00Z");
    console.log([...namesSeen(readLogLines(), since)].sort().join("\n") || "(nothing)");
    process.exit(0);
  }

  // --- arming: `--moved adhd --at 2026-09-13T19:52:37Z` -------------------------
  const movedName = flag("--moved");
  if (movedName !== null) {
    if (!EXPECTED.includes(movedName)) { console.error(`unknown caller: ${movedName}`); process.exit(1); }
    const at = Date.parse(flag("--at") ?? "");
    if (!Number.isFinite(at)) { console.error("--at needs an ISO time: when that app's new deployment was built"); process.exit(1); }
    const st = existsSync(STATE)
      ? JSON.parse(readFileSync(STATE, "utf8"))
      : { movedAt: {}, seen: Object.fromEntries(EXPECTED.map((n) => [n, false])), failedRuns: 0, ready: false };
    st.movedAt[movedName] = at;
    writeFileSync(STATE, JSON.stringify(st, null, 2));
    console.log(`armed: ${movedName} counts from ${new Date(at).toISOString()}`);
    process.exit(0);
  }

  if (!existsSync(STATE)) {
    console.error(`${new Date().toISOString()} not armed: no ${STATE}`);
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(STATE, "utf8"));
  if (state.ready) process.exit(0);

  let lines;
  try {
    lines = readLogLines();
    state.failedRuns = 0;
  } catch (e) {
    state.failedRuns = (state.failedRuns ?? 0) + 1;
    writeFileSync(STATE, JSON.stringify(state, null, 2));
    console.error(`${new Date().toISOString()} could not read logs (${state.failedRuns}): ${e.message}`);
    if (state.failedRuns >= ERROR_RUNS) {
      note(`# capture — the caller watcher cannot read the logs

  _Written by \`capture/scripts/watch-callers.mjs\` after ${state.failedRuns} failed runs in a row._

  The per-caller secret migration is waiting on evidence it can no longer collect:
  ${e.message}

  **Nothing is broken for Sean.** Both apps still authenticate; the shared secret
  is still accepted. Step 3 simply cannot proceed until this reads logs again.
  Most likely cause: the Vercel CLI's login expired on the Mac. Log at
  \`~/Library/Logs/capture-caller-watch.log\`.
  `);
    }
    process.exit(1);
  }

  const obs = observations(lines);
  // One-time instrument check under launchd's real context: how much it READ,
  // never what or when. Off unless the job's environment sets it.
  if (process.env.CAPTURE_WATCH_VERBOSE === "1") {
    console.log(`${new Date().toISOString()} read ${lines.filter((l) => l.trim()).length} records, ${obs.length} caller lines`);
  }
  apply(state, obs);

  if (state.ready) {
    note(`# capture — per-caller secrets: step 3 is ready

  _Written by \`capture/scripts/watch-callers.mjs\`. It keeps no times; it only
  records whether each name has appeared._

  Both apps have now been **seen** authenticating to the capture service by name,
  from real use after each was moved to its own secret: **fnd** and **adhd**.

  ${state.legacyAfterAllMoved
    ? "**But the shared secret was ALSO used after both moved.** Something is still sending it — an app that did not pick up its new value, or a caller nobody listed. **Do not delete the shared secret.** Find the caller first."
    : "The shared secret was not seen in use after both moved. That is absence, and it is not what licenses step 3 — the two names above are."}
  ${state.rejectedAfterMove
    ? "\n**Requests were also refused after the move** (a value no app holds, or one held by two). An app may be failing and falling back to its keyword parser. Check before step 3."
    : ""}

  **Step 3, in a capture session:** delete \`CAPTURE_TOKEN\` from the service's
  Vercel environment, remove the legacy path from \`src/callers.ts\`, delete
  \`CAPTURE_LOG_CALLERS\`, redeploy, and remove this watcher — its launchd job
  \`com.sean.capture-caller-watch\`, \`capture/.caller-migration.json\`, and this note.
  `);
  }

  writeFileSync(STATE, JSON.stringify(state, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
