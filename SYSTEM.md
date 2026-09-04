# SYSTEM.md — Sean's personal app ecosystem

**Version 2.3 · 2026-09-03** — supersedes v2.2 (same day), which superseded
v2.0 (planning chat) and v2.1 (FND chat's edited copy). The FND chat should
still diff this against its v2.1 to confirm nothing of theirs was lost.

**Status of every build step now lives in `NEXT-STEPS.md` and nowhere else.**
v2.2 recorded done/not-done in three files and they disagreed within a day.
§13.7 gives order and reasoning only. This is §5.8 applied to status.

The single source of truth for how these apps relate to each other. Every
Claude Code session and every planning chat reads this before doing
anything. Its history, every correction, and the reasoning behind each
decision live in **`DECISIONS.md`** — this file states only what is
currently true.

---

## 0. Read this first

You are working on one app in a set. The set has rules no individual repo
can see. Before you write code:

1. Read §2 (seven inviolable rules) and §3 (do not rebuild). These override
   anything that looks sensible.
2. Read §5 (shared contract). Match it at the endpoint boundary or say why
   you can't.
3. If you are about to propose that two apps talk to each other, check §3.
   It has probably been tried.

At the end of a session in which a decision was made, record it in
`DECISIONS.md` and edit the relevant section here. Run `check-refs.py`
before committing. A decision that lives only in a chat is lost.

**Provenance.** Every claim carries a tag. What was decided is not the same
as what was assumed, and in six months the difference is the whole game.

| Tag | Source |
|---|---|
| `[FND]` | FND Tracker summary doc |
| `[NEXT]` | "Next" ADHD task app summary doc |
| `[ECO]` | "Personal app ecosystem — shared context" |
| `[FND-chat]` `[ADHD-chat]` | The Claude Code session for that repo, checked against the repo |
| `[SEAN]` | Said directly, with date |
| `[PROPOSED]` | Suggested by Claude, **not agreed** — needs Sean's yes |

Sean is not a coder. `[PROPOSED]` means exactly that.

**A provenance tag is a checkable claim.** Something tagged `[FND-chat]`
can be taken back to the FND chat and verified against the repo — and has
been, and has been found wrong. That is what the tags are for. A claim
without a tag is a claim nobody can check.

---

## 1. The core principle

> **Reduce the number of decisions between "I should do X" and "I am doing
> X."** Not better information, not better organisation — fewer decisions.
> `[ECO]`

Every app is judged against this. A corollary that has already killed
features: **a list is a decision.** Showing five options is worse than
showing one, even when all five are good. `[NEXT §1]`

---

## 2. Inviolable rules

Seven. Breaking one needs Sean's explicit permission. Everything else in
this document is a decision (§2A) or a design value (§6).

**2.1 Absence of data is never good news, and permission up must be
earned.** Nothing logged is *unknown*, not *fine*. Any increase in what the
system permits must come from positive evidence — never from missing
negative evidence, never from assertion. `[FND]` `[NEXT]` `[ECO]`

The operative form: **downward is free, upward is earned.** A signal that
reduces what the system expects can be honoured immediately, anywhere. A
signal that increases it must be evidenced, and honoured only where being
wrong is cheap. `[FND-chat]`

**The incentive test.** Before shipping any change, ask: *does this make
not-logging better than logging?* General form: *does this make any honest
input costlier than withholding it?* The principle alone did not catch a
real bug — relaxing a cap reads as correcting an error, not granting an
increase. A disposition isn't checked; a yes/no question is. `[FND-chat]`
Note that D3's manic floor has this shape: declaring a phase makes the
system do less for him, so it pays him to stay quiet.

**2.2 Never guess at input.** Anything unparseable is stored verbatim and
flagged. A wrong entry is worse than a missing one because it silently
corrupts everything downstream. `[NEXT]` A bare number takes the low-risk
interpretation; anything else needs an explicit keyword. `[FND]`

**2.3 Manual override always wins.** Sean attributing or annotating
something outranks any heuristic. `[ECO]` One exception under
consideration: the manic-phase floor, §12 Q3 — under consideration
*because* it is an exception.

**2.4 Nothing the system does on Sean's behalf may score.** Bulk imports and
scripted work are recorded but worth zero. `[NEXT]`

**2.5 The logical day runs 05:00 → 05:00 Europe/London.** Never midnight.
Anything after midnight files under the day before. `[FND]` `[NEXT]`
Non-midnight day boundaries caused more bugs than anything else in the
first build. `[ECO]`

**2.6 Nothing projects Sean's recovery trajectory, and nothing projected is
ever shown as a target.** Trusting a projected trajectory has directly
contributed to a real setback. `[ECO]` Projecting *a ceiling the growth
rule produces from past evidence* complies; forecasting how much better he
will be does not. `[FND-chat]`

**2.7 Pass-through, never synthesis, on anything physical.** Any app other
than the FND tracker may quote FND's numbers verbatim and must not compute
its own. If it wants to say something about Sean's body, it says what FND
says or it says nothing. `[FND-chat]`

FND's value is that it is the single authority on one question — how much
can he do today. A second answer, without the reaction attribution or the
ratchet logic behind it, *"doesn't need to write to FND to cause a relapse.
It only needs to be believed."* This constrains statements, not arithmetic:
the global app may use FND's `room` as an input to what it surfaces (§9);
it may not derive its own verdict about his state and show it.

**The synthesis form.** *No observation may assert a relationship in which a
physical quantity is one of the terms.* Quote FND's verdict, report the other
fact beside it, let Sean draw the line. This is a prohibition, not a limit:
a model asked to look across two datasets and report what it notices **will**
assert relationships, because that is what synthesis means. Capping the number
of observations and citing their sources do not touch it. `[ADHD-chat
2026-09-03]` The prohibition binds *the combination*, not either app, so it
also lands on the task app's data. `[ADHD-chat]`

**It prohibits assertion but not selection, and selection is where a model
does most of its work.** "On your three lowest-room days you finished nothing"
asserts nothing; the whole claim lives in which days were chosen. See §9 for
the structural answer. `[PROPOSED]`

---

## 2A. Structural decisions

Decided and load-bearing, but decisions — change them by deciding
differently, not by agent judgement.

**2A.1 FND is frozen with respect to other apps, not with respect to
Sean.** His own development of FND continues normally and this document
places no restriction on it. No other app writes to FND. No other app shares
code, packages or storage with FND. **FND never acquires a dependency on
another app.** Changes made *to* FND because the ecosystem needs them (e.g.
a second read token) are his own development — the prohibition is on FND
acquiring a dependency, not a feature. `[SEAN]` `[FND-chat]`

**2A.2 The FND tracker and the ADHD task app do not interact.** No calls,
no shared storage, no modelling of physical condition in the task app.
`[NEXT §7]` See §3.1. The *global* app may join FND and task data under
§12 D2 and §2.7; nothing there loosens this.

**2A.3 Apps are separate on the phone.** Separate icons, screens, purposes.
*"If they're all one app, then they're all just more tasks. If they're
separate things that then integrate, that makes sense."* `[SEAN]` This is
about surfaces, not code: shared libraries, storage instances and
conventions are encouraged, subject to 2A.1.

---

## 3. Do not rebuild

Built, then deliberately removed. It will look sensible again.

**3.1 FND → ADHD integration.** Built on the recommendation of the handover
doc that started the ADHD project. Removed 2026-08-29: *"I don't want them
to interact."* `[NEXT §7]` Sean's reason, later: partly the risk of *"some
sort of coding bug that then interacts in some way"* with FND. `[SEAN]`
Evidence the warning is needed: a Claude that had just read the FND summary
re-proposed this within one message. Ask before building it.

**3.2 Routine inside the ADHD app.** Removed 2026-09-01. A routine kept
inside a task app becomes one more task. `[NEXT §7]` The same applies to a
media backlog. `[PROPOSED]`

**3.3 A dashboard as the global app.** Ruled out before building: a
dashboard reintroduces the exact choosing-between-options problem the
ecosystem exists to remove. `[ECO]` See §9.

**3.4 "How much energy have you got?" and "How big a job do you want?"**
Both failed as check-in questions. It is now *"How long have you got?"* —
because every job the app gives him should be small, so the question
shouldn't arise. `[ADHD-chat]`

---

## 4. The person, as far as the software is concerned

- **ADHD.** Task *initiation* is the disability, not organisation. He knows
  what needs doing; deciding and starting are the hard parts. Anything
  requiring upkeep gets abandoned within a week. `[NEXT]`
- **Bipolar, on lithium.** Capacity varies — sometimes on a rough cycle,
  sometimes not; *do not assume it is predictable.* Lithium affects
  motivation and processing speed independently of mood. `[ECO]` `[NEXT]`
  Confirmed directly: *"So I am medicated."* `[SEAN 2026-09-03]` Recorded
  because Sean's saved claude.ai profile asserted the opposite and every
  session reads both; this file is the one that is right.
- **FND** with calf-exertion-triggered autonomic dysfunction, following
  double-knee arthroscopy. cPTSD history. `[FND]`
- **Creative professional.** Work is often open-ended. `[ECO]`
- **Night-shifted.** Wakes around midday, active to ~4am. `[FND]` `[NEXT]`
- **London. iOS.** Dictates heavily. Scriptable widgets, iOS Shortcuts and
  Back Tap for capture. `[NEXT]` `[FND]`

### How he works `[FND §4]` unless noted

- **Terse replies mean carry on.** "ok", "k", "yes" are approvals.
- **A correction is a spec change, not a complaint.** If he says a number
  is wrong, the model is wrong. Change the model; don't explain the number.
- **He dictates.** Messages ramble, self-correct, and end with a hedge.
  Extract the requirement; the hedge invites your judgement.
- **He argues with the model and is usually right.** Take objections as
  data.
- **Show numbers, not reassurance.** Replay over real history; print
  before/after.
- **He wants to be off the apps.** Anything that lets him check less is a
  feature.
- **He is not a coder.** Explain what a change does in plain terms before
  making it. Don't assume he can review a diff. `[SEAN]`

---

## 5. Shared contract

**Binds new apps. Binds at the endpoint boundary, not inside an app.** What
other apps can see is §5.4's endpoints; field names, internal schemas,
storage layout and framework choices are the app's own business. Specify
requirements, not implementations. `[ADHD-chat]`

**FND is grandfathered** and meets this at the boundary only, which it
already does: `/api/quick` echoes what it recorded, `/api/widget` exists,
the day boundary matches. `[FND-chat]` **The ADHD app complies in full**,
using its own field names. `[ADHD-chat]`

**5.1 Time.** All day arithmetic routes through one shared `app-time`
module. Logical day per §2.5. One implementation, imported.

**5.2 Storage.** JSON documents behind a `StorageAdapter` — filesystem in
development, Redis in production. Every key namespaced with the app's
prefix (`adhd-`, `routine-`, …). `DATA_DIR` resolved per call, never at
module load. `[NEXT]` `[FND]`

**5.3 Events.** An **append-only** log from which all statistics derive.
Every event records a stable identity, when it happened, **which logical
day it belongs to**, what kind of thing it was, and **who did it** — with
system actors scoring zero (§2.4). These are requirements, not field names.

**5.4 Every app exposes two endpoints.**

| | Path | Contract |
|---|---|---|
| `GET` | `/api/widget` | Small, cheap, read-only summary. |
| `POST` | `/api/quick` | Capture one line. **Always echoes back exactly what it recorded.** |

**5.5 Direction of dependency.** Apps never read each other. Only the
global app reads across, read-only. For FND the endpoints that matter are
**`/api/digest`** (a day as structured facts — *"everything an author would
need, nothing an author would decide"*), `widget`, `room`, `export`.
`[FND-chat]` Read-only governs how global treats *other apps*; global may
own a store of its own (§12 Q9).

**5.6 Auth.**

*ADHD:* shared key in `ACCESS_KEY`; `?key=…` sets an `access` cookie for a
year; calls need `Cookie: access=<key>`. `[NEXT]`

*FND (`src/proxy.ts`):* `API_TOKEN` gates **writes only**; `?key=…` sets a
`fnd_key` cookie; external callers use Bearer. **Fails open if the env var
is unset** — deliberately, so a typo cannot lock him out of logging
mid-relapse. GET is unauthenticated so logging stays frictionless, except
`/api/widget`, `/api/room`, `/api/digest` (guarded by
`WIDGET_TOKEN ?? CRON_SECRET`) and, **since 2026-09-03**, `/api/export`.
`[FND-chat]` A second read token, **`INTEGRATION_TOKEN`**, is also accepted
by those four routes, so the global app's access can be revoked without
killing the Scriptable widgets. Both need setting in Vercel. D2's "own
revocable credential" is now possible.

**Verified live, 2026-09-03.** `[FND-chat]` Every claim below was checked
against production or `vercel env ls`, not read off the code.

| | State |
|---|---|
| `WIDGET_TOKEN` | Set in Vercel. This is what holds the export gate. |
| `CRON_SECRET` | Set in Vercel. |
| `API_TOKEN` | **Not set.** |
| `INTEGRATION_TOKEN` | **Not set** — exists only in code written 2026-09-02. |

Gates confirmed by status code: `widget` `room` `digest` `export` all 401
with no credential; `export` also 401 with a *wrong* token, so the gate
compares against a real value rather than failing open. `logs` and
`biometrics` return 200, deliberately.

> **Every FND write endpoint is open, demonstrated not inferred.** With no
> credential: `POST /api/quick {"steps":1}` → 200, entry present in the
> record; `DELETE /api/logs?id=…` → 200, entry gone. Counts 612 → 613 → 612.
> `proxy.ts` fails open exactly as designed, on an assumption that never
> held. → §13.7 step 0b.
>
> The earlier evidence — a 400 rather than a 401 — proved nothing. Bug
> family (c): the instrument shared the assumption. See §7 practices.

**Why Phase A is safe** (§13.7 step 0b). `proxy.ts` reads `API_TOKEN` first
and returns before touching any header, so while it is unset a request with
a Bearer token and one without behave identically — both verified live.
Every writer can therefore be given its header *before* the env var is set,
at any pace, with nothing broken in between. `[FND-chat 2026-09-03]`

**The standalone-PWA trap** (§13.7 step 0b, Phase B). The manifest sets
`"display": "standalone"`. On iOS an installed home-screen web app runs in a
storage partition separate from Safari: cookies, Web Storage and IndexedDB
are isolated, though the Service Worker registration and CacheStorage are
shared. So setting the `fnd_key` cookie in Safari does not necessarily give
the installed icon the cookie, and a standalone PWA has no address bar to
type `?key=…` into. **The failure mode is silent:** Safari works, the icon
stops logging. There is a documented one-time exception — iOS copies cookies
across at the moment the app is added to the home screen — so the first
remedy to try is: authorise in Safari, delete the icon, re-add it. If that
fails, the fallback is a field in the app's own Settings; the FND chat must
state before Phase B whether the pasted value is stored as a cookie or
attached as a header. `[PROPOSED]`

Do not gate `/api/logs` or `/api/biometrics`: the pages fetch them
constantly, and a missing cookie on a new device mid-relapse would open the
app to nothing — the failure fail-open exists to prevent. `[FND-chat]`

Rule for `proxy.ts` and its env vars: **a change is not done until it is
verified live.** §5.6 recorded the export gate as done on 2026-09-02 when it
had not been made; a live check returned 200 unauthenticated. See §7(j).

**5.7 Placeholders are labelled.** Fixed durations and thresholds are
placeholders until proven against real data, in code and UI. `[ECO]`

**5.8 Constants live in code and the UI reads them.** Prose that hardcodes
"21 days" describes last month's model. `[FND]` This document follows it:
no test counts, no route counts.

---

## 6. Design values

- **One thing on screen.** Alternatives one tap away, never the default.
- **The app must never become another task.** No grooming, no review
  ritual.
- **The main screen fits with no scrolling.**
- **No breakable streaks.** Points only go up. A bad day earns less; it
  never takes anything away.
- **Starting is worth more than finishing.** "Open the document, five
  minutes" is a complete success.
- **Low friction to log.** One tap. Never a form where a tap will do.
- **No inflated positivity.** Stats reflect what happened, including "not
  much." Over-caution has a real cost too: *"if I know your warnings are
  overly cautious, over time I'm going to ignore them."*
- **Explain numbers next to them.** A figure he cannot interrogate is one
  he will distrust. Reproducibility is the stronger form: a model that
  can't be replayed can't be argued with, and he argues with the model
  constantly.
- **Name controls by what they do, not how he feels.** See §3.4.
- **Big tap targets.** 48px minimum; ADHD uses 52/64px.
- **Never let a chart mean two things.**
- **Notifications are one truncated line**; anything worth reading also
  lives where he can open it afterwards.
- **Never eyeball anything measurable.** Contrast is parsed from the
  stylesheet by a test. Layout is measured.

`[FND §5]` `[NEXT §3]` `[ECO]` throughout.

**Colour is unresolved.** FND themes by day level (blue easing / amber
careful / drained red / green pause). ADHD colours by importance band — red,
amber, blue, grey, defined in `globals.css` and contrast-tested. A global app
showing both breaks "never let a chart mean two things." See §12 D4, Q4.

*v2.2 hardcoded six hex values here. They still matched the stylesheet
exactly, so this is bug family (d) caught before it fired rather than after —
which is a weaker case than drift and a better reason to fix it, because it
was free. `[ADHD-chat 2026-09-03]`*

---

## 7. Bug families

Check for these by name in review. Each has been hit more than once.

**(a) Absence of bad news read as good news.** Nothing logged became "a
good day." Two real instances: the FND export button calling `res.blob()`
without checking `res.ok`, so a 401 downloads a file named like a backup
containing `{"error":"Unauthorized"}` — created by the fix for a different
problem; and a quiet day reading as a clean one. `[FND-chat 2026-09-03]`
Same shape: `git clone` leaving gitignored files behind and looking like it
worked. Third instance, found 2026-09-03: **`DELETE /api/logs` returns
`{"ok":true}` for an id that does not exist** — it reports success at
something it did not do. `[FND-chat]` Note that this bug is also what makes
the no-footprint auth probe work (§7 practices); when it is fixed the probe
improves rather than disappears — 404 means the request passed the gate, 401
means it did not.

*v2.0 recorded a different canonical instance here — a backup script
reporting "4 of 4" while copying nothing, "believed for months." It did not
happen. See `DECISIONS.md` correction 18.*

**(b) A value one part respects and another assumes.** Three different
daily-budget numbers on one screen. Export ONE definition. `[FND]`

**(c) Verification sharing the bug's assumption.** A test asserting a
renamed string that could never fail; tests that `Number()` a display
string and pass as `NaN`. When a measurement surprises you, check the
instrument first. `[FND]`

**(d) A constant surviving the change that invalidated it.** A 1.5×
multiplier kept after its input changed meaning. `grid-cols-8` over seven
tabs. This document's own stale rule numbers and test counts. `[FND]`

**(e) Correct but too slow to be an answer.** `assessRisk` hit 5.3s. Every
test passed; they assert answers, not that answers arrive. `[FND]`

**(f) Day boundaries defaulting to midnight** in some functions and not
others. `[ECO]` See §2.5.

**(g) Absence of data read as *precision*.** Distinct from (a): the app
didn't call the day fine, it called it *exactly 65 CLU* from partial data
and capped on that. Any derived quantity should know what fraction of its
input was present and say so or refuse. `[FND-chat]`

**(h) The dev copy is not the data.** A stale local copy of production —
eleven days and 45% of logs missing — made every number look normal. Caught
by the practice below. `[FND-chat]`

**(i) A fix that makes silence pay.** A cap relaxed because the app
couldn't see what happened, so staying quiet scored better than logging
honestly. Written while reasoning about §2.1 and still missed. The incentive
test in §2.1 exists because of this one. `[FND-chat]`

**(j) Documentation recording a fix that was never made.** §5.6 said
`/api/export` was gated; it was not. The proposal was recorded as the
outcome. Nothing is done until it is checked live. `[FND-chat]` This
document is prone to it — see also correction 18.

### Practices that worked `[FND §7]`

- Tests read **real stored entries** — never writing to real storage.
- Every regression test **carries the story in a comment**: not "checks
  limit is capped" but "on 17 Aug a 25-step bout reacted and the limit was
  reported as 25 while the ceiling allowed 7."
- **Commit messages explain the failure**, not the change.
- **When a model changes, replay it over real history** and print
  before/after.

Two more, earned on 2026-09-03 and both about *how you check*:

- **Before any diagnostic that writes to production, establish that no
  read-only proof exists.** A search obligation, not a preference. And if one
  must write, **the cleanup must not depend on the mechanism under test** —
  if the only way to clean up is the thing being tested, don't run it and
  accept not knowing. `[FND-chat 2026-09-03]`

  Earned the hard way. A one-step walking bout was written into the live
  record to prove writes were open. It counted in daily load, effective load
  and everything reading the API for about ninety seconds, and FND has no
  `actor` field (§5.3, grandfathered) so there was no way to mark it as
  system work worth zero — §2.4 has no enforcement in that app. Had
  `API_TOKEN` been set between the write and the delete, it would be in the
  record permanently. A read-only proof existed and had already been run:
  an unauthenticated `DELETE` against a nonexistent id.

  The planning chat specified the destructive method in its prompt. **The
  fix is a prompt constraint, not more care:** *use the least invasive method
  that answers the question; do not write to production unless no read-only
  alternative exists; if you must write, say so first.* A disposition isn't
  checked; an instruction is. Same move §2.1 makes with the incentive test.

- **For "is it set in production", read the environment list.** A status code
  is an inference about configuration; `vercel env ls` is the configuration.
  A 401 proves at least one of several accepted tokens is set, never which.
  `[FND-chat 2026-09-03]`

---

## 8. App register

### FND Tracker — live, Sean's active development

Relapse prevention. **Never relapse to the start again.** The enemy is the
ratchet: overload, don't stop, overload at a lower level, collapse. When a
design choice is ambiguous, this is the tiebreak. `[FND §1]`

- **Live:** `fnd-tracker.vercel.app` · **Repo:** `~/Projects/fnd-tracker`
  → `github.com/seanscol/fnd-tracker`
- **Stack:** Next.js 16 PWA on Vercel, TypeScript, SWR, `node:test`,
  Recharts, Scriptable widget, Shortcuts + Back Tap → `/api/quick`.
- **Routes that matter externally:** `digest`, `widget`, `room`, `export`.
- **Core model:** CLU (one walking step ≈ 1), effective load as a decayed
  sum, a ceiling measured against effective load, a 0–100 score combining
  five signals by noisy-OR. Five bands, from *not enough* through *working*,
  *pushing* and *risky* to *stop*. `[FND §2]` **The half-life and the band
  thresholds live in code and the UI reads them** — per §5.8, and because
  they are likelier to move than the colours were.

### Next (ADHD tasks) — live, active development

**What should I do right now?** Exactly one task, decided for him. `[NEXT]`

- **Live:** `adhd-tasks-mu.vercel.app` · **Repo:** `~/Projects/adhd-tasks`
  → `github.com/seanscol/adhd-tasks` (private, history audited clean).
- **Stack:** Next.js 16.3, TypeScript, Tailwind 4, SWR, `node:test`, Redis /
  JSON behind a namespaced `StorageAdapter`. Next 16 deprecates
  `middleware.ts` for `proxy.ts`.
- **Keys:** `adhd-tasks` · `adhd-events` · `adhd-comparisons` ·
  `adhd-nudges` · `adhd-checkins` · `adhd-settings`.
- **Endpoints:** `state` · `widget` · `quick` · `import` · `act` ·
  `breakdown` · `order` · `review` · `calibrate` · `checkin` · `intention`.

**How it decides — no LLM anywhere near this.** Importance (bands, set
calmly) and inclination (forced-choice pairs, in the moment) measured
separately, because in ADHD tasks are ranked by reward potential not
importance — his data confirmed it. One linear model, Bradley–Terry over
his recorded choices with shrinkage. **Linear on purpose:** explainable,
and — the stronger reason — **reproducible.** Gates before scoring, never
as penalties. Two anchors a day. Anything started and unfinished outranks
everything. `[NEXT §5]` `[ADHD-chat]`

**Biggest known limitation:** rule-based voice capture cannot handle real
dictation. A paragraph with five tasks, three deadlines and an instruction
to modify an existing task produced one unusable task. `[NEXT §8]` → §10.

### Routine — not built; deliberately the simplest app

Kicks off the day, says *do this now*, then the next. Not a list. Fun
icons. *"There's nothing about it that needs to be more than that."*
`[SEAN]`

`[PROPOSED]` Sequence anchored to **waking**, not clock time — he wakes at
noon. Falling behind is not a failure state: a queue he advances, not a
schedule he misses. Fun icons are a requirement, not decoration; fun is not
inflated positivity.

### Health — not an app

*"There might be no need for a health app; the few data we have feed
directly into the global app."* `[SEAN]` Health data is an **input to
synthesis** (§9), never a health tab in the global app. What still needs a
home — blood-test entry, manic phase history — see §12 Q9.

**MacroFactor monthly import: decided, do it** `[SEAN]` — with the
condition that the import and the query that consumes it land together. If
the synthesis doesn't read it, the monthly ritual is upkeep with no payoff.
One file drop, nothing else; a missed month must not break anything.
`[PROPOSED]`

**Manic phase history.** Charting what has happened: yes, unreservedly.
Charting *most likely future days*: unsafe at a single-digit episode count
— any fitted periodicity is an artifact, and the specific danger is
**false reassurance**: a chart saying "due in March" is a reason to
discount evidence in January. If forward marks are wanted, show the
observed distribution with the episode count printed on the chart, never a
highlighted date. `[PROPOSED]`

### Media — not built

*Here is the next film. Here is the next album.* Never the backlog.
`[SEAN]`

`[PROPOSED]` **The criteria step is the trap** — going through criteria is
choosing. Set preferences once, calmly, on a separate screen; learn the
rest from forced-choice pairs answered whenever, never at the point of use.
Reuse the ADHD app's Bradley–Terry model. Don't ask "how long have you got"
before recommending — see §3.4.

- **TMDB:** free non-commercial key, instant, posters via CDN. Attribution
  logo required; six-month cache cap.
- **Spotify:** recommendation endpoints dead for new apps since Nov 2024 —
  `recommendations`, `related-artists`, `audio-features`, previews. **Search,
  lookup, playback and playlists survive**, which is what he needs.
  Developer Mode now requires Premium; Feb 2026 removed more endpoints.

### Writing — separate, different shape, least urgent

Retrieval over his own corpus — *what do I think about this, what have I
written on it.* Not an event log. `[SEAN]` Where the corpus lives: §12 Q7.

### Global — not built; last of the integrated apps, smallest

See §9.

---

## 9. The global app

**Arbitration, not content.** Which one thing, from which sub-app, to
surface right now, given today's stated capacity. Not a dashboard (§3.3).
`[ECO]`

**It must replace checking, not add to it.** *"I don't want too many
notifications and I don't want to be looking at all these up all the
time."* `[SEAN]` Five apps plus global is six icons unless global is what
he opens *instead of* the others. If it becomes a sixth, it has failed.

Constraints, all inherited:

- **Pass-through, never synthesis, on anything physical** (§2.7).
- **No projection of his recovery, nothing shown as a target** (§2.6).
- **Read-only** via `/api/digest` primarily (§5.5).
- **Synthesis is batched, once or twice a day.** Capture is not (§10).
- **Cap the output.** A model asked for correlations always finds some.
  Every observation cites the events it came from. Signals require
  corroboration — a crossing plus a second independent reading, never one
  alone. `[PROPOSED]`
- **FND's verdict is never one of the observations.** It occupies a fixed
  slot, quoted verbatim, present every day whatever it says. The observations
  range over non-physical data only. `[PROPOSED]` This is the structural
  answer to §2.7's selection gap: capping and citing constrain what a model
  *says*, but the claim can live entirely in **which** facts it picks. If the
  physical verdict can't be selected, it can't be selected *for*, and §2.7
  holds by construction rather than by the model behaving well.

`[PROPOSED]` **Build it last and start it smallest:** as the daily
synthesis only — reads everything, writes three cited observations — with
no arbitration screen until the sub-apps have run long enough to have data
worth arbitrating over.

**Inputs he wants:** calendar (private iCal, easy); email into tasks
(blocked on Gmail's restricted-scope cost, §11); notes and diary as free
text; the writing corpus (Q7); health data as input (§8).

**Capacity is the thing that crosses apps.** A low/normal/high check-in
should scale what any app expects that day. `[ECO]` `[PROPOSED]` The signal
that crosses boundaries is **Sean's own declared capacity**, not one app's
inference about another's domain — subject to §2.1's asymmetry: a declared
low crosses freely; a declared high never crosses into anything physical.
See §12 Q1.

---

## 10. Capture service — planned, build first

**Not a hub.** A stateless parser behind HTTP: text and a target schema go
in, candidate structured items come out. It stores nothing. `[PROPOSED]`

- **The calling app stores the raw capture synchronously, before the model
  is called.** Capture never blocks on the parse. The parse returns within
  a second or two and echoes what it made of it — **live, not batched**,
  because a wrong parse he can't check while he remembers what he said is a
  wrong entry (§2.2). If the service is slow or down, the raw is safe and
  the app falls back to its existing parser and says so.
- **It never writes to an app and holds no credential for one.** The app
  calls it, gets candidates, writes to itself. This is why §5.5 needs no
  exception. **No cross-app routing:** a Shortcut targets one app's
  `/api/quick`; his thumb chooses the destination, not a model.
- **Creation and mutation are different risk classes.** Creations go to a
  confirm queue. **Any operation touching an existing record requires
  explicit confirmation naming the record — always, not only when
  confidence is low.**
- **One dictation earns one capture** regardless of how many items it
  yields. The parse is `system` work and scores zero (§2.4).
- **Generic:** receives the schema with the request; knows nothing about
  tasks or bands.
- **Own repo, own deployment, own API key** — the key lives only here.
  **It authenticates its callers** with a bearer token checked *before* the
  model is called: it is the one component where being called costs money.
- **Spend cap set in the Console at setup.** Model chosen by passing the
  acceptance test — the `[NEXT §8]` dictation — starting from the smallest.
- **The key is never typed into a chat.** `.env.local`, Vercel env vars,
  and a password manager.

---

## 11. External data — what is reachable

Verified 2026-09-01. Re-check before building; these move.

| Source | Status |
|---|---|
| **Apple Health** | Via iOS Shortcuts only. No web API. Same path FND capture already uses. |
| **Fitbit data** | Reachable *as Apple Health data* via Shortcuts. |
| **Fitbit API** | **Don't.** Three device readings ever. Legacy API decommissioned Sept 2026; successor needs a $500–4,500/yr CASA assessment. |
| **Screen Time** | **Blocked.** Opaque tokens, native-app entitlement, sandbox denies export. |
| **MacroFactor** | Manual export only (More → Data Export). No API. |
| **Calendar** | Private iCal URL. Easy. |
| **Gmail** | Restricted scopes: $540–1,800/yr, or test mode with weekly re-auth. `[NEXT §8]` |
| **TMDB** | Free key, instant. Attribution + 6-month cache cap. |
| **Spotify** | Search/lookup/playback/playlists yes; recommendations no. Premium needed for Developer Mode. |
| **Dating apps** | No public APIs. |
| **Money** | Not researched. Do last or never. |

---

## 12. Decisions and open questions

Full reasoning and history for each: `DECISIONS.md`.

### Decided `[SEAN 2026-09-01]`

- **D1.** A rough day flagged in one app does **not** soften another. Scope:
  app A's display never changes because of app B's data. Global seeing both
  (D2) and Sean's own declared capacity (Q1) are different questions.
- **D2.** The global app **may** join FND and task data, provided no risk
  to FND. Safeguards, first and most important: **§2.7 pass-through.** Then:
  read-only over HTTP; no writes; no shared code or dependencies; separate
  deployment; cached and rate-limited; **read failure means unknown, not
  fine**; its own revocable credential (pending the second token, §5.6).
- **D3.** Manic phase: **response specified, trigger not.** If manic —
  minimal, one task a day. A response to a present state, not a prediction.
  Structurally a capacity floor, not a bipolar model. **Do not implement
  this as a self-declaration toggle** — that builds in the exact
  disincentive §2.1's incentive test names (declaring makes the system do
  less for him). Q2's answer, *set in advance or by someone else*, is the
  answer to that, and the two must be read together.

  **D3 is currently unbuildable, and that is fine.** All three routes to its
  trigger are closed: declaration is forbidden by D3 itself, inference is a
  prediction in disguise (Q2), and *"by someone else"* has no one — **there
  is no second person.** `[SEAN 2026-09-03]` Nor is there anything for one to
  use: no second user, no second-person auth in §5.6, no outward
  notification path. **Deferred to the global app build** (§13.7 step 6),
  which is where it lives anyway. Do not re-litigate it before then.
- **D4.** One visual and feedback language, with per-app variation. Shared:
  type, spacing, tap targets, component shapes, the honest stance. Varying:
  colour and theme.
- **Health app: dissolved.** Data feeds global directly. MacroFactor import
  stays.

### Open — do not resolve by defaulting

- **Q1. One shared "who is this person / today's constraints" profile?**
  *"I'm not sure. I don't know."* Mostly resolved by asymmetry: a declared
  low is honoured everywhere immediately; a declared high only where wrong
  is cheap — the task app, never anything physical. Remaining: one profile
  object, or a capacity field per app?
- **Q2. How is a manic phase established?** Declaration fits §2.3 and §2.6;
  inference from screen time, sleep or spend is a prediction in disguise
  and mostly unreachable anyway. Third option that fits better than either:
  **set in advance, or by someone else** — a phase is the state in which
  he is least likely to declare it.

  Two things sharpen it. **"Set in advance" has two readings and they must
  not be run together:** *the response is agreed calmly in advance* is fine
  and is what Q3 assumes; *the phase is declared in advance* is a forecast
  wearing different clothes and hits §2.6. Separate them in any spec before
  someone builds the second thinking they built the first. `[ADHD-chat
  2026-09-03]` And **"by someone else" has no one** — see D3. Deferred with
  D3 to §13.7 step 6.
- **Q3. Can the D3 floor be switched off in the moment?** If yes it may not
  do its job; if no it breaches §2.3. Middle: one tap on, deliberate logged
  action off. Decide calmly, not at 4am.
- **Q4. When does FND get restyled?** Both code chats say (b): leave FND,
  build one language across the new apps, converge later or never — and
  there is nothing yet to converge onto. This defers something Sean asked
  for; his call.
- **Q5. When does the ADHD app adopt the shared package?** Convenience, not
  compliance. Only with a concrete reason.
- **Q7. Where does the writing corpus live?** Separate app *and* global
  wants to read it. Two copies drift; one store with two views cuts across
  2A.3. Options: global stores it; writing app exposes a read endpoint; the
  writing app *is* the corpus and global queries it.
- **Q9. Global owning its own data.** Blood tests, manic history, notes,
  its own observations — nothing else has a home for them. §5.5 read-only
  governs other apps, not this. **The discipline:** global's default screen
  stays arbitration; its own data lives behind a tap. A health overview on
  the front is §3.3's dashboard by the back door.

- **Q6.** ~~FND auth mechanism~~ — closed, recorded in §5.6.
- **Q8.** ~~What question does the health app answer~~ — closed: none;
  dissolved (§8).

---

## 13. Working practices

**13.1 Backup.** Two true statements, the second more useful than the
first:

**Time Machine is still off.** No whole-machine backup exists. That remains
the headline and only Sean can fix it — a system service, no Full Disk
Access grant, versioned, everything.

**A targeted backup now runs and has been proven unattended.** Daily launchd
job at 14:00, `~/bin/backup-app-data.sh`, covering both repos' `data/` and
`.env.local` into dated iCloud folders, 14 kept. Log at
`~/Library/Logs/backup-app-data.log`. Fails loudly, exits non-zero, no Full
Disk Access required. The 14:00 run on 2026-09-03 fired unattended and
reported `4 of 4`, exit 0 — the real proof, not a forced run. `[ADHD-chat
2026-09-03]`

**Outstanding, and cheap: look inside the folder.** `4 of 4` is precisely the
string correction 18 built a fabricated disaster around, and §7(a) is the
family where a success message *is* the failure. Nobody has yet listed
today's dated `AppBackups` folder and checked file count and sizes. One
command. No suggestion anything is wrong — but this document has a named
history of believing this specific message. `[PROPOSED]`

*Operational:* a background job cannot modify directories created by an
interactive shell in iCloud Drive. **Only ever trigger it via `launchctl
kickstart`**; if it starts failing oddly, delete `AppBackups` and let the job
rebuild it. `[ADHD-chat]`

**What a remote does not protect,** corrected: `data/` is a dev snapshot
(production is Redis). `.env.local` — v2.0 called its VAPID keys "the
irreplaceable one." **That was asserted without checking and is wrong:**
production serves the identical public key, so Vercel holds the same
keypair; losing the file costs fifteen minutes copying values back from the
dashboard, and the phone subscription survives. `[FND-chat 2026-09-03]`
Still worth a password-manager copy; no longer a reason for alarm.

**TCC and Full Disk Access — measured, not believed.** From a real launchd
job: read/write `~/Projects` YES; read `~/Downloads` NO; write iCloud Drive
YES. `[ADHD-chat 2026-09-03]` So the FDA grant to `/bin/bash` was
unnecessary — the outcome the section hoped for. **The general rule
survives the instance:** FDA attaches to the interpreter, so hundreds of
agent-written commands a week would inherit it. Don't grant it to bash;
move the data out of protected directories instead. If a folder moves:
`mv`, never re-clone.

**13.2 One session per repo at a time.** Parallel across repos is fine.

**13.3 Every repo has a `CLAUDE.md`** with §2 and §3 inline plus a pointer
here. Inline, because a pointer alone gets skipped.

**13.4 Plan before executing.** State what will change and why in plain
terms; get a yes; then do it. He cannot review a diff.

**13.5 Billing.** A Claude subscription does not include the API
(support.claude.com 9876003). Claude Code shares the subscription's limits,
so planning chats and coding sessions draw from one pool. Runtime model
calls need an API key and their own bill. An Agent SDK monthly credit
exists for Max plans (support.claude.com 15036540) but applies to Agent SDK
usage only.

**13.6 One writer to the spec files.** `[SEAN 2026-09-03]` Code sessions
**audit, object and report; they never edit `SYSTEM.md` or `DECISIONS.md`.**
Findings go back to the planning chat, which folds them in and copies the
result out to every repo in one pass.

The reason is on the record: a code chat edited `SYSTEM.md` and produced the
v2.1/v2.2 fork this file's header still has to reconcile. After §13.7 step 1
there are three copies on disk plus one in the Project. Multiple writers to
four copies is not a risk, it is a schedule.

Honest cost: this routes every edit through the component with the worst
track record in the corrections log. Two mitigations, both load-bearing —
**the planning chat writes nothing except from a code chat's pasted words**,
and the result goes straight back to them to audit.

**After any session with a decision:** report it; the planning chat records
it in `DECISIONS.md` and edits this file; `check-refs.py` runs. **After every
few sessions:** ask each repo's chat to audit this file against its repo.
That loop caught more errors than any other mechanism, and nothing here
weakens it — it is the *editing* that forks, not the checking.

**13.7 Build order.** Order and reasoning only. **What is done lives in
`NEXT-STEPS.md`.**

0. **Turn on Time Machine.** (§13.1)
0b. **Close the open FND write endpoints.** Two phases, and the split is the
    point. **Phase A carries no risk and no deadline:** `proxy.ts` returns
    before reading any header while `API_TOKEN` is unset (§5.6, verified
    live), so every writer — Shortcuts, Back Tap, Scriptable — can be given
    its Bearer header first, at any pace, with nothing broken in between.
    **Phase B is five minutes with the FND chat present:** set `API_TOKEN`
    and `INTEGRATION_TOKEN` in Vercel, redeploy, then verify in order — an
    unauthenticated write returns 401; a capture from the **home-screen
    icon**, not Safari, saves (§5.6, the standalone trap); a Shortcut
    capture saves; the Scriptable widget still renders. **Rollback:** delete
    `API_TOKEN` and redeploy — Vercel reads env vars at deploy time, so this
    is minutes, not seconds. Knowing that in advance is what makes Phase B
    attemptable rather than something to steel yourself for.

    **0b outranks 0.** An open write endpoint on a live medical record is an
    active exposure; no whole-machine backup is a latent one. Recorded here
    per this section's closing line. `[SEAN 2026-09-03]`
1. **Spec files into the repos.** `DECISIONS.md`, `CLAUDE.md` and
   `check-refs.py` alongside `SYSTEM.md` in `~/Projects/ecosystem/` and in
   both app repos. Until this lands, §13.6 instructs a step that cannot be
   complied with. Fold in §13.8's hooks in the same session.
2. **Capture service.** Own repo, own session (§10). Acceptance test
   written first. Deploy only when it passes.
3. **Wire the ADHD app to it.** Separate session, with fallback.
4. **Routine app.** First app on the shared package.
5. **Media.**
6. **Global** — last of the integrated apps; daily synthesis only, then
   arbitration later. **D3 and Q2 are decided here**, not before.

**Writing** sits outside this sequence — separate shape, whenever.

Move a step only for a reason recorded in `DECISIONS.md`.

---

**13.8 Enforcement rather than instruction** `[PROPOSED]`

Several rules in this document are currently requests a session may skip.
Claude Code **hooks** are shell commands run at fixed points in its
lifecycle, which makes an action always happen rather than depending on the
model choosing to run it. Four of this document's rules map straight onto
them. Land them with §13.7 step 1, in `.claude/settings.json`, which is
committed with the repo the way `CLAUDE.md` is.

| Rule | Hook |
|---|---|
| §13.6 one writer | `PreToolUse` on `Edit`/`Write` → block `SYSTEM.md` and `DECISIONS.md` |
| §7 no production-write diagnostics | `PreToolUse` on `Bash` → block `POST`/`DELETE` against the FND production URL |
| §13.6 run `check-refs.py` | `Stop` → run it every turn |
| §13.3 rules get skipped | `SessionStart` → inject §2 and §3 |

Why a hook and not a permission rule: `PreToolUse` hooks fire before any
permission-mode check and a hook returning deny blocks the tool even under
`--dangerously-skip-permissions`, so no session can reason its way past one.
Deny rules, by contrast, have repeated public reports of not being enforced;
treat any deny rule as unverified until tested. Sean runs the **desktop app**
`[SEAN 2026-09-03]`, where these are available.

**A weekly audit task, after step 1** `[PROPOSED]`. Claude Code Desktop can
run a local scheduled task with access to the repos. Read-only, working
folder `~/Projects/ecosystem`: run `check-refs.py`; confirm the `SYSTEM.md`
in both repos is identical to the ecosystem copy; check new `[FND-chat]` and
`[ADHD-chat]` claims against the repos; hit **only** FND's already-gated
read routes to confirm the gates hold — never `quick`, never `logs`, never a
write. Writes findings to `AUDIT.md`; never touches `SYSTEM.md` or
`DECISIONS.md`; **says nothing when everything matches.**

Two constraints on the whole idea, both from this document. **Detection can
be automated; writing cannot** — every entry in `DECISIONS.md` Part 2 is a
chat that recorded a report without checking it, and an unattended writer is
that failure with the human removed (§13.4, §13.6). And **a daily digest
would fail §9's own test** — it must replace checking, not add to it, and §4
says what happens to anything needing upkeep. A checker that is silent when
correct passes; one that reports every day does not.

**What this cannot do:** hooks catch *process* failures — a skipped check, an
unrecorded decision, an unauthorised edit. They cannot catch a coding bug in
one app affecting another. That is handled by §2A.1 and §2A.2 making the
interaction impossible, and no monitoring layer improves on it.
