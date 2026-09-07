# SYSTEM.md — Sean's personal app ecosystem

**Version 3.1 · 2026-09-07** — FND is wired to the capture service; §2A.1
moved by decision, §2.4 now enforceable in FND, correction 22 closed. v3.0
was: — supersedes v2.8, which was **issued twice with
different content**: the planning chat revised it an hour later without
bumping the number, so ecosystem and the repos held different bytes at the
same version and the drift check could only read that as a copy edited in
place. **A version number identifies a release; reissuing one with different
content breaks every guard that keys on it.** Bumped rather than patched, so
the classifier sees `pending` and not `drifted`. v2.8 was the first version
to reach the repos since v2.3: **v2.4–v2.7 were written and never copied out**, so every
session spent two days auditing against a spec four versions old and
reporting staleness that had already been fixed. Same failure as the four
undeployed commits in the task app, in the same week. Growth is earned —
step 0b, the capture service and the ADHD wiring all shipped. **§4 rewritten as
structural constraints only; clinical and biographical detail removed**, on
the principle that intimate detail in a spec invites a session to mistake
salience for relevance. v2.5 added §4A and rewrote §10 from the built
capture service; v2.4 rewrote §5.6, §7, §8, §13.1 and §13.8 from what was
built rather than what was proposed.

**`operating-notes.md` sits beside this file and is part of the spec.**
See §4A.

---

## Read this before adding anything to this file

Two findings from the archive outrank everything else here, and Sean has
named them himself as the ones that matter. `[SEAN 2026-09-04]`

**He remembers the architecture of a life better than living it.** Thousands
of lines about what will be done; almost none about what was done.

**Nothing gets completed.** No record of anything finished in four years of
writing.

**Designing this system is that pattern running right now.** SYSTEM.md went
from v2.2 to v2.6 in twenty-four hours and roughly doubled in length, while
one component shipped. A specification is architecture. It is the most
comfortable possible substitute for the thing it describes, and it produces
the feeling of progress at none of the cost.

### The constraint that follows

**The spec may grow only in a version where something shipped. It may shrink
at any time.** Every new version of this file must correspond to a step
marked done in `NEXT-STEPS.md` with live evidence. A version that only adds
analysis is the failure mode, not the work.

**Corollary for any planning session:** when the choice is between recording
something and building something, build. An unrecorded insight costs one
insight. A month of unrecorded building costs nothing at all, because the
code is the record.

**The one exception is retrieval** — `operating-notes.md` item 2. Writing
something down so it can be found later is the single function the archive
proves is worth it. That is a low bar to clear and most additions do not
clear it.

---

**Status of every build step lives in `NEXT-STEPS.md` and nowhere else.**
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

**2.4 Nothing the system does on Sean's behalf may score.**

> **Enforceable in FND from 2026-09-07**, closing correction 22. Every entry
> records `actor` (`sean` | `system`) and `via` (`app` | `shortcut` |
> `voice` | `capture` | `import` | `diagnostic`). Three decisions on the
> record `[SEAN 2026-09-07]`:
>
> **Absent `actor` means his, and counts.** Every entry predating the field
> has none, and excluding an entry *raises what the app permits* — §2.1,
> upward is earned. No backfill, no migration: the default is the answer,
> not a gap.
>
> **A capture-derived bout is `sean`.** The model transcribed what he said
> and the bout happened to his body. Scoring these zero would make
> voice-logging silently add nothing to his load — absence read as good news
> on the input he uses most — and would make voice cheaper than typing,
> failing §2.1's incentive test.
>
> **A health import is `sean`, `via: import`.** §2.4 names bulk imports as
> system work worth zero, and **that clause does not transfer**: a watch
> reading is not effort. Marking these system would drop real HRV and
> skin-temperature readings out of the signals and *raise* what he is
> permitted. **§2.4 is about scoring effort, not about provenance** — the
> same correction §2.2's "corrupts everything downstream" clause needed.
>
> **And the finding that inverts the obvious reading:** marking a fabricated
> entry `system` does not neutralise it. **Three days of 400 CLU marked
> `system` take the effective daily budget from 80 to 574.** Scoring zero
> removes an entry from the load total while leaving it in the evidence base
> that sets the ceiling — so fabricated load does not add to what he has
> done, **it raises what he is permitted to do.** Correction 22 assumed an
> `actor` field would have made the planted bout harmless; it would not
> have. **`actor` is an effort-attribution mechanism, not a safety one**, and
> the safety mechanism remains §7's rule against production-write
> diagnostics. `[FND-chat 2026-09-07]` Bulk imports and
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

> **MOVED 2026-09-07, deliberately.** `[SEAN]` **FND may call the capture
> service.** *"The rule's real content is 'nothing else writes to FND' and
> that's untouched: capture is stateless, holds no FND credential, and the
> direction stays one-way — FND calls out, capture never calls in."* Two
> conditions, both built: **the fallback is exercised as the normal case**,
> via a settings switch that runs whole days on the word rules, with fifteen
> tests covering every way the service can fail — no token, no answer, 401,
> 413, 500, a 200 in the wrong shape, a 200 that parsed nothing; and every
> reply says which reader read it, **distinguishing chosen from fallen back
> to**, because a model parse and a keyword parse are wrong in completely
> different ways. The clause forbidding other apps writing to FND is
> unchanged and inviolate. `[FND-chat 2026-09-07]`

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

**Structural facts only.** Everything below constrains a design decision and
is stated as a constraint rather than as biography. Clinical and personal
detail is deliberately absent — see `operating-notes.md` for why.

- **Task initiation is the disability, not organisation.** He knows what
  needs doing; deciding and starting are the hard parts. **Anything
  requiring upkeep gets abandoned within a week.** `[NEXT]`
- **Capacity varies and is not predictable.** Not on a reliable cycle.
  Never assume today resembles yesterday; never project forward (§2.6).
  `[ECO]` `[NEXT]`
- **Physical exertion has consequences that arrive later, and are not
  proportional to effort.** That is the whole reason the FND tracker exists
  and why §2.7 forbids any other app computing about the body. The clinical
  detail lives in that app's own repo, where it is load-bearing; it does not
  belong here. `[FND]`
- **Work is open-ended.** Creative projects with no fixed end state. `[ECO]`
- **Night-shifted.** Wakes around midday, active to ~4am — which is why the
  logical day runs 05:00 → 05:00 and not midnight (§5.1). `[FND]` `[NEXT]`
- **iOS. Dictates heavily.** Scriptable widgets, Shortcuts and Back Tap for
  capture. `[NEXT]` `[FND]`

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

## 4A. What the archive shows

`operating-notes.md` sits beside this file and is part of the spec. Eleven
regularities derived from a four-year personal archive, each with a line
citation, agreed by Sean. `[SEAN 2026-09-04]` **It is content-free by
instruction** — the source analysis used biography as evidence and none of
it survives, because the lessons are structural and **intimate detail
sitting in a spec is an invitation for a session to mistake salience for
relevance and build a rule out of it.** Apply the same test to anything
added here. Nothing in it is clinical.

Six of its eleven items change what gets built:

**A completion channel and a decay mechanism are missing**, and their
absence is the archive's most consistent finding — no record of anything
being finished in 137,000 words. Any app holding a list needs both, or the
list grows forever, which is what the archive shows happening.

**Asterisks are the priority signal; frequency is the anxiety signal.** He
already runs a hand-applied one-to-seven notation, and the most-written-about
items are the least finished. Any ranking reading repetition or recency as
importance inverts his real priorities. **Open question: does the ADHD app's
forced-choice ranking read the asterisks?**

**Bias every surface toward the past tense.** *"What happened today"* is the
scarce input. This cuts against the grain of a task app and should be
resolved deliberately rather than by default.

**Breaking an unresolved thing into subtasks is the archive's most
consistently demonstrated failure mode.** The only passages in four years
that resolve anything are long and unbulleted. **This lands directly on the
capture service** — see §10.

**Plan size, tracked as a number and shown back.** Scope inflates as capacity
drops. Stating *"this week's plan is four times last month's"* describes what
he wrote rather than predicting what he will do, so §2.6 holds. This is his
own idea; the instrument is specified in the archive and unbuilt.

**There is no second person, and the system must not appear to be one.** It
can surface a signal early and make it visible; it cannot be the one who
notices, and designing as though it can replaces a gap with the appearance
of one being filled. **The right output of this pattern is a task with a
name on it: who gets called.** That task exists on no list. See §12 D3/Q2,
which reaches the same conclusion from a different direction.

### The meta-risk, and the test that answers it

The archive holds more than twenty full daily routines across four years,
identical in shape, none evidenced as running for a month. An integrated app
system is structurally the twenty-first, and more elaborate than any of them.

What would make it different is narrow. **Every previous system recorded what
he intended. This one has to record what happened.** Apply that test to any
proposed feature. It is a sharper form of §9's *"it must replace checking,
not add to it."*

The reason to build it anyway is retrieval: the archive contains two
near-identical rule lists, the second written because the first had been
lost. A system that did nothing but retrieval would already be worth it, and
it is the one thing the corpus proves he cannot do unaided.

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

**5.4 "Wire the app to it" means every capture path**, not the one the
contract names. The ADHD app's `/api/quick` was wired to the capture service
while the box inside the app posts to `/api/import` — so the endpoint in the
contract worked and the thing he uses daily was unchanged. `[ADHD-chat
2026-09-05]`

**Every app exposes two endpoints.**

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

**A link is not a read.** The routine app opening
`adhd-tasks-mu.vercel.app/week` in a browser is not one app reading another:
no data crosses, no dependency is created, and the task app still owns the
answer. §5.5 and §2A.3 are untouched by it. Worth stating because the
question came up and the instinct was to seek an exception where none was
needed. `[ADHD-chat 2026-09-06]`

**One named exception: the backup script** (§13.1). It reads both apps'
`/api/export` daily. It is not an app, but "operational tooling doesn't
count" is the kind of quiet reinterpretation this document keeps getting
caught by, so it is recorded as an exception rather than folded into the
rule. `[SEAN 2026-09-04]` The reasoning: the corrections log shows broad
categories get abused (1, 7, 8) and specific instances don't, and §13.8's
audit task will be the second case — two instances tell you what the
category is, one tells you nothing. Both chats raised this independently and
neither reinterpreted the rule on their own authority, which is the
behaviour the rule exists to produce. What makes the exception defensible is
that the script holds its own revocable credential (`INTEGRATION_TOKEN` for
FND, `ACCESS_KEY` for ADHD) and reads only.

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

**Verified live, 2026-09-04.** `[FND-chat]` Checked against production and
`vercel env ls`, not read off the code. **Step 0b is done** — for step
status see `NEXT-STEPS.md`, not this section.

| | State |
|---|---|
| `API_TOKEN` | Set. Gates every write. |
| `INTEGRATION_TOKEN` | Set. Read token for the backup script, revocable alone. |
| `WIDGET_TOKEN` | Set. On the phone, in Shortcuts and Scriptable. |
| `CRON_SECRET` | Set. |

> **The write hole is closed.** An unauthenticated
> `DELETE /api/logs?id=<nonexistent>` returned 401 at 01:03 BST on
> 2026-09-04. The same request returned `200 {"ok":true}` the previous day.
> Every writer — Shortcuts, Back Tap, the app itself — was given its
> credential first and confirmed logging afterwards.

**`INTEGRATION_TOKEN` rather than `WIDGET_TOKEN` for the backup**, though
the latter was already set. `WIDGET_TOKEN` lives on the phone; sharing it
would mean revoking the backup also empties the home screen, and being
revocable alone is the entire reason a credential exists. `[FND-chat
2026-09-04]`

**How it was closed, and why the order mattered.** `proxy.ts` reads
`API_TOKEN` first and returns before touching any header, so while it was
unset a request with a Bearer token and one without behaved identically.
Every writer could therefore be given its header *before* the env var was
set, at any pace, with nothing broken in between. Keep this in mind for any
future gate: **the sequence that has no broken window is worth finding.**

**The standalone-PWA trap, resolved.** The manifest sets
`"display": "standalone"`, and on iOS an installed home-screen web app runs
in a storage partition separate from Safari — cookies, Web Storage and
IndexedDB isolated, Service Worker registration and CacheStorage shared. So
authorising in Safari need not authorise the icon, and a standalone PWA has
no address bar to type `?key=…` into. The app now has a Settings → Access
field; the token becomes an httpOnly `fnd_key` cookie issued by the server.
Verified by logging from the icon. Two remedies if it ever recurs: iOS
copies cookies across once at the moment an app is added to the home screen,
so delete and re-add; failing that, store the token in the app's own storage
and attach it as a header. `[FND-chat 2026-09-04]`

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

**The canonical instance, restored and corrected.** On its first scheduled
run, the backup script announced `backed up 4 of 4 sources: 0 files` and
exited 0 while launchd, lacking Full Disk Access, failed every single copy.
Caught within minutes and fixed by counting real failures rather than
assuming `cp` worked. **v2.0 wrapped this in "believed for months," which is
false** — the script was a day old. v2.3 then deleted the whole instance on
the strength of a check run against post-fix output. Both halves are now
corrected: the instance is real, the disaster framing was fabricated. See
`DECISIONS.md` 18 and 25. `[FND-chat 2026-09-04, contemporaneous comment at
~/bin/backup-app-data.sh:235–242 plus the shape of the fix around it; the
original log was truncated between runs and does not survive]`

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

**(k) A correct system computing from a record that has silently lost
something.** Every family above is about a derived number being wrong. This
one is about the base being wrong while every derivation is right. On
2026-09-04 a real 110 CLU chair session from 1 September was found missing
from FND's live record — deleted the previous day while removing what looked
like a duplicate. It was the bout the overheating reaction was attributed to
and the one holding the budget cap up. Effect: 1 Sept load 175 → 75, cap
88 → 38, attribution gone. **Nothing in the app noticed.** It surfaced only
because a backup routine compared two copies, on the one day anyone was
looking. `[FND-chat 2026-09-04]`

The general shape: any system whose statistics derive from an append-only
log inherits the log's omissions in silence, and no test of the derivation
can catch it. Two mitigations shipped the same night, and the second is the
interesting one: deleting an entry that carries a description **or** is
≥40 CLU now confirms and names the entry, because two rows that look alike
is exactly what went wrong and a generic "are you sure?" would not have
stopped it; ordinary five-step walks still delete without asking,
deliberately, because **a dialog he sees constantly is one he clicks through
on the day it matters.** That is §6's friction principle used as a safety
mechanism rather than a courtesy.

**(l) A checker structurally unable to see a class of error, and silent
about it.** `check-refs.py` passes on `[NEXT §8]`, a reference to a section
of `NEXT-STEPS.md` that does not exist — it reads the `§8` as `SYSTEM.md`'s
§8, which does. The reference is broken and the checker reports clean. This
is (a) inside the tool built to catch (a). `[capture-chat 2026-09-04]` The
general form: **a checker that cannot distinguish two cases will always
report the one it can see.** Every guard in this system should state what it
is blind to — §10's three §2.2 guards do; `check-refs.py` does not.

**(m) A default nobody chose.** `temperature` was never set on the capture
service, so every parse ran at the API default of 1.0 — full randomness.
**Five prompt changes had already been made against output that was being
sampled rather than computed.** Distinct from (d), where a constant survives
the change that invalidated it: here nothing went stale, because nobody ever
set it, so there was nothing to notice. `[capture-chat 2026-09-05]` The
general form: **a default nobody chose looks exactly like a decision.**

**(n) A failure path that destroys the evidence of the failure.** The backup
fetched straight to its destination and ran `rm -f` on failure — so a failed
14:00 run deleted good exports written at 01:31, and the error path removed
the body that would have explained it. Two sessions produced two contradictory
diagnoses and neither could check. **Failure was destructive, not merely
unsuccessful.** Now: fetch to `.incoming`, `mv` only after validating, and
keep the first 2KB of any failing response locally — local rather than iCloud,
because an error page can carry a token. `[FND-chat 2026-09-05]`

**(o) A green signal about the wrong artefact.** Three instances in one day.
Production served two-day-old code because no Git repo was connected, while
every local check passed and a 404 read as a broken build. A test suite passed
on a working tree that did not contain the test — which failed immediately
when restored. And a status code behind an auth gate was read as evidence of a
deployment. **"The tests passed" is a claim about the tree they ran on, not
about the commit.** `[ADHD-chat, capture-chat 2026-09-05]`

**(p) A convention standing in for a guard.** Test files were meant to import
a helper that redirects `DATA_DIR`; five of sixteen didn't, and a test run
wrote to the real `data/` and destroyed the dev snapshot — 166 rows to 2. The
storage adapter now refuses to write outside a temp directory during a test
run. **A convention is not a guard; it is a hope with documentation.**
`[ADHD-chat 2026-09-05]` Sub-finding worth its own line: TypeScript elides
`import { x } from "./helpers"` when the binding is unused, so "import it for
the side effect" silently does nothing. Use a bare `import "./helpers"`.

**(q) A phrase acquiring his authority without having come from him.** A
session labelled one of his priorities *"People and places"* and wrote a code
comment presenting it as his words. He caught it. The fault is not the
wording — it is a phrase gaining the weight of a quotation in files that are
full of real quotations doing exactly that job. Same shape as correction 18,
in a different medium. `[ADHD-chat 2026-09-05]` **Quote him or don't attribute.**

**(r) A test that counts rather than locates.** Two `add*Log` calls in FND's
`/api/quick` ended `} as never)`. The cast silenced type checking, so the
provenance object for each landed in the HTTP response below it instead of in
the entry — **entries went into the record with no `actor` while the reply
carried one.** The test that should have caught it counted `provenance:`
occurrences against the number of entry-creating calls per file. The totals
matched. It now brace-matches each call's own argument. **Counting is not
locating, and the same shape will be in any check that asserts a total rather
than a place.** `[FND-chat 2026-09-07]`

Two things worth separating out of that. **A cast turns a check off**, and
both casts here were unnecessary — `tsc` was clean without them, so the
silencing bought nothing. And it is bug family (c) once more: the
verification shared the assumption it existed to test.

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

Two more, from the night of 3–4 September:

- **A diagnostic log worth quoting later must not be truncated between
  runs.** The log holding `4 of 4 sources: 0 files` was deleted before the
  next test to get clean output — reasonable at the time, and it cost the
  only transcript of the instance §7(a) is built on. What survives is a
  comment and the shape of the code around it. `[FND-chat 2026-09-04]`

- **Append to a credential file with `>>`, never `>`.** A single `>`
  truncates, silently removing whichever token was already there, and the
  failure appears at the next scheduled run in a log nobody reads until
  something is lost. Bug family (a) turning on one character. `[ADHD-chat
  2026-09-04]` The credential file is `~/.config/app-backup/tokens.env`,
  `chmod 600`, one line per app, outside both repos and outside iCloud.

Four more, from 4–6 September:

- **For "is it deployed", read the deployment list.** Exactly parallel to the
  env-var practice above. A status code behind an auth gate is an inference
  about deployment; `vercel ls` is the deployment. Two days of pushes deployed
  nothing and an hour went into a theory never checked against the list.
  `[ADHD-chat 2026-09-05]`
- **Latency figures from different sessions are not comparable.** The cost of
  constrained decoding was nearly recorded backwards by comparing yesterday's
  number with today's. Back-to-back or not at all. `[capture-chat 2026-09-05]`
- **Reproduce before blaming.** Three times a failure that looked like the
  capture service's was the task app's, and once the reverse. Each was settled
  by one call to the live service with the same input, so every report went to
  the other session as a cause rather than a hypothesis. `[capture-chat]`
- **A screenshot of the app being wrong is worth more than a test.** Every
  finding in two days of capture work except the `temperature` default came
  from Sean sending one. **The acceptance suite was green through several of
  them.** `[capture-chat 2026-09-05]` This is worth stating as a limit rather
  than a triumph: it means the cost of discovery currently sits on him, which
  is the wrong place for it.

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
- **Keys and endpoints are not listed here.** Per §5.8: they live in code,
  and a test fails if a store is added without `/api/export` reading it.
  Both lists went stale twice in three days. Correction 12 with different
  nouns. `[ADHD-chat 2026-09-05]`

**How it decides — no LLM anywhere near this.** Importance (bands, set
calmly) and inclination (forced-choice pairs, in the moment) measured
separately, because in ADHD tasks are ranked by reward potential not
importance — his data confirmed it. One linear model, Bradley–Terry over
his recorded choices with shrinkage. **Linear on purpose:** explainable,
and — the stronger reason — **reproducible.** Gates before scoring, never
as penalties. Two anchors a day. Anything started and unfinished outranks
everything. `[NEXT §5]` `[ADHD-chat]`

**Voice capture is wired end to end** to the capture service on every path
(§10). A dictated paragraph produces several tasks; modifications wait for a
tap; the raw words are stored before the model is called; the fallback says
which reader read it. **Two taps is the floor on iOS** — Safari has no Web
Speech API, so the mic must be the keyboard's and the box has to be focused
synchronously inside the tap. A Shortcut is the only route to one tap.

**Three mechanisms added 2026-09-05, all from his own documents.** *This
week* rotates the work-slot priorities one week each — *"if everything's
important right now, I do nothing; but if I rotate, I can do them"* —
leaving treatment and social permanently unslotted. *Recovery* reads his
Recovery Log as a grid and says when a column has gone quiet, never how long
since he did anything. *Questions* asks two a day about what the app doesn't
know, and skipping costs nothing.

### Routine — next to build; deliberately the simplest app

Says *do this now*, then the next. Not a list. Fun icons. *"There's nothing
about it that needs to be more than that."* `[SEAN]`

Sequence anchored to **waking**, not clock time — he wakes around noon.
**It is a full-day sequence, not a morning one**, running from breakfast to
the last thing at night. `[SEAN 2026-09-06]` Falling behind is not a failure
state: a queue he advances, not a schedule he misses. Fun icons are a
requirement, not decoration; fun is not inflated positivity.

**The boundary with the task app, decided.** `[SEAN 2026-09-06]` **The
routine app owns anything anchored to waking. The task app owns anything
with a cadence longer than a day**, because those compete for attention and
a routine has no ranking. Without this the two collide: "morning play" and
"cook something properly" differ only in cadence, and he would be prompted
twice by different apps. The routine app must not grow a general
recurring-things feature.

**The sequence, seven stages** `[SEAN 2026-09-06]`:

1. Breakfast · Brush
2. Read
3. Day plan · Day-specific intentions · Plan exercise
4. Morning play · Rehab · Meditate
5. Gym · Cafe
6. Rehab
7. Oats & dishes · Bath · Teeth & medication · Floss

Rehab appearing at stages 4 and 6 is deliberate, not a duplicate.

**Stage 5 requires leaving the house and often will not happen.** A whole
stage being skipped is normal — no red, no "missed", and it must not block
stages 6 and 7.

**The "not yet" list is stored but never shown as part of the sequence.**
Held so he doesn't have to remember it, promoted one item at a time when the
current sequence is holding. `[SEAN 2026-09-06]` Currently: supplements
(fish oils, glucosamine, green mussel, creatine), Yoga 20 minutes, laundry,
supplements (magnesium, B12).

**Why this is a rule and not a preference.** The archive holds more than
twenty full daily routines, none evidenced as running for a month
(`operating-notes.md` items 1 and 3). A routine that starts with a third of
its items unperformed begins every day in failure, which is the shape of all
twenty. **Build what he does; promote from the store.**

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

## 10. Capture service — BUILT AND LIVE

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
- **Spend cap set in the Console at setup.**
- **The key is never typed into a chat.** `.env.local`, Vercel env vars,
  and a password manager.

### Built and live, 2026-09-04 to 2026-09-06

`capture-three-lyart.vercel.app/api/parse`, private repo `seanscol/capture`,
model **claude-haiku-4-5**. The ADHD app is wired to it on every capture
path. Two real dictations exist as acceptance tests; a third would still be
worth more than further tuning.

**Corrections to what this section used to claim:**

- **"Creations go to a confirm queue" is dropped.** Creations go straight in;
  only modifications wait, always, naming the record. `[SEAN 2026-09-04]`
  *"A wrongly created task is a line I delete. §2.2's 'corrupts everything
  downstream' is an FND rule about load calculations and it doesn't transfer
  to a task list. The queue puts friction exactly where I can least afford
  it."* **§2.2 is intact; its consequence clause is FND-specific**, and that
  clause was doing the work of justifying the queue.
- **"Returns within a second or two" is measured and false.** 3.4–5.4s warm,
  over 7s cold. Accepted rather than fixed: streaming would buy nothing
  because he is waiting for a Shortcut to reply, not watching a screen.
  `[SEAN]`
- **The service fails closed** — the opposite of FND's `proxy.ts`, and
  deliberately. What an unset variable would open here is a metered API key,
  and nothing medical depends on it. §2.1: upward is earned.
- **A modification's record is checked against the model's own description**,
  not merely that the id is known. In production the model returned
  `described_as: "Finish tax return"` beside the id of an unrelated task.
  **The check belongs in the service**, which is the only place holding both
  halves — the caller's id-to-label list and the model's description — so
  every future caller inherits it rather than rediscovering it.
- **Constrained decoding (`strict`) was shipped and removed.** It guarantees
  the schema and runs generation at roughly a third of the rate, and the cost
  scales with output: a six-item capture went 6.2s → 14.6s, past the calling
  app's timeout, so it would have fallen back to keyword parsing every time.
  Kept as a switch, defaulted off. A `["string","null"]` union on one field
  cost ~5s a parse under strict, because constrained decoding holds both
  branches open.

**The pattern across every fix, and the reason to trust the result:** in
every case the answer was a check in code, not a better instruction in the
prompt. An instruction the model ignored two runs in three is not a guard.

### What the build changed

**"Start with the smallest and escalate" is falsified.** It assumes the
ladder goes up. Measured against the acceptance dictation, the larger models
were both **less accurate and slower**. The smallest is not a compromise
here; it is the best option on both axes. Do not let another app inherit the
assumption. `[capture-chat 2026-09-04]`

**Always set `temperature` explicitly for structured extraction, and
`strict: true` on the tool.** The API default is 1.0, so the same paragraph
got a genuinely different reading call to call. Twelve runs of analysis and
five prompt rewrites were spent diagnosing behaviour that was partly
sampling noise. With `temperature: 0`, ten runs produced one identical
decision-set. Separately, **`required` in a tool schema is a suggestion
without `strict: true`** — one call omitted the `modified` key entirely, and
an absent field is not "no changes," it is not answering, which nothing
downstream can distinguish. `[capture-chat 2026-09-04]`

**§2.2 is enforced structurally, not requested.** Grounding now sorts every
field into **four origins**, each with a reason that is true: *grounded* (its
own quote contains it), *borrowed* (another candidate quotes it — strip),
*orphan* (nobody quotes it — keep and flag), *invented* (nowhere — strip).
The two-origin version was the worst bug of the build: a deadline stated in a
separate sentence read as unsupported and was stripped, **and the app then
told him he hadn't said words he had said.** Two further guards, each with a
stated blind spot: *coverage* catches text no candidate quoted, and is blind
to a lossy item whose quote is complete; *grounding* removes any string
field whose words don't appear in that candidate's own quote, and is blind
to a claim inside a quote wider than the model used; *dropped-from-quote*
catches a name or number in the quote the item never uses, and is blind to
lost detail that is neither. Invented dates went from two runs in three to
none. **The known hole:** when the model quotes a wider span than it used —
quoting a whole retraction, then taking a date from inside it — the words
are present and grounding sees nothing wrong. Recorded, not fixed; fixing it
against one paragraph would be tuning to noise.

**A second caller, and one token for both.** FND was wired to the service on
2026-09-07. The service checks a single expected value, so FND, the ADHD app
and any future caller send the same string — **revoking one revokes all**.
FND itself has deliberately the opposite arrangement, `API_TOKEN` for writes
and `INTEGRATION_TOKEN` for reads, *"so the global app's access can be
revoked without killing the Scriptable widgets."* Not urgent: the token is a
credential for nothing but a metered API key. But §10 says the service
authenticates its *callers*, plural, and today it authenticates one.
`[FND-chat 2026-09-07]` `[PROPOSED]`

**What FND sends, and what it refuses to.** One bout with components, never
one item per exercise — two items with no stated time have no gap between
them to make them separate, so they merge, and only a separately stated time
makes a second bout. **Enforced in code, not asked for in the prompt.** The
model never prices anything (CLU lives in `activities.ts` and the enum is
generated from it at request time), never resolves a time (*"at two"* is
14:00 or 02:00 and both are ordinary), and never guesses an activity — an id
off the list is refused rather than mapped to the nearest. Symptom shorthand
never leaves the app: *"zero one one two"* is four syllables, deterministic
and offline, and it is the input most likely to be skipped when he feels
bad. `existing` is never sent — voice creates bouts, editing a past one is a
screen job — and a modification arriving anyway is reported, never applied.
**`unparsed`, `unaccounted`, `removed`, `unverified` and `dropped` all reach
him:** a capture that reads three of four exercises and reports three cleanly
silently lowers his load. Timeout 14s, taken from the ADHD client rather than
re-derived. `[FND-chat 2026-09-07]`

**Outstanding:** five prompt rules were written before the temperature
default was found, so they were tuned against randomised output. Some fixed
real problems; some may be fitting noise. Strip them back one at a time
against a deterministic baseline. `[capture-chat 2026-09-04]` And the
service is proven against exactly one dictation, which is how a parser comes
to handle one paragraph and generalise to none.

**A constraint from §4A that the build does not yet honour.** The archive's
most consistently demonstrated failure mode is breaking an unresolved thing
into subtasks; the only passages in four years that resolve anything are
long and unbulleted. This service converts speech into task lists whether or
not a list is the right output for what was said. Nothing currently
distinguishes *"five things to do"* from *"I am stuck on something."* Not a
reason to withhold it — but a calling app should be able to receive
*"this doesn't look like a task list"* as an answer, and cannot today.
`[PROPOSED]`

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

**A targeted backup runs daily and now pulls the live record.** launchd job
at 14:00, `~/bin/backup-app-data.sh`, into dated iCloud folders, 14 kept.
Log at `~/Library/Logs/backup-app-data.log`. Fails loudly, exits non-zero,
no Full Disk Access required.

**Until 2026-09-04 it backed up the wrong copy.** It copied each repo's
`data/`, which is the development snapshot; production for both apps is
Redis. FND's backup held 644 logs newest 2026-09-02 against 688 live; the
ADHD app's held 551 preference judgements from 29 August against 633 live —
82 forced-choice answers that are the ranking model's training set and
cannot be reconstructed. The job had been reporting success daily and the
report was honest. It was backing up a museum piece. **Bug family (h) in the
backup itself.** `[ADHD-chat, FND-chat 2026-09-04]`

**Now:** both apps expose `GET /api/export` and the job fetches it. FND uses
`INTEGRATION_TOKEN`, ADHD uses `ACCESS_KEY`; both live in
`~/.config/app-backup/tokens.env`, `chmod 600`, outside both repos and
outside iCloud. `.env.local` is still copied because it genuinely exists
nowhere else. The stale `data/` copies were removed rather than kept
alongside — two files claiming to be the same record, one stale, is the bug
being fixed and not a second line of defence.

**A fetch must be able to fail.** A failed fetch still writes something — a
401 body, an error page — and that something looks like a backup. So: fetch
to a temp file; require HTTP 200; require valid JSON; require the expected
array to be non-empty; and **require it to be no smaller than the last good
backup.** Only then move it into place. The size check is the one that
matters, because a half-written export arrives as valid JSON with fewer
entries and reads as a real backup forever after. `[FND-chat 2026-09-04]`

**Verified by reading the file, not the log:** 689 FND entries and 633 ADHD
judgements after a `launchctl kickstart` run. Not 644 and 551.

**Hardened 2026-09-05, after it failed unattended and then destroyed a good
backup.** The 14:10 run on 09-04 failed both live fetches and the error path
`rm -f`'d the exports written successfully at 01:31 — bug family (n). Five
fixes: fetch to `.incoming` and `mv` only after validating, so failure can no
longer take a good copy with it; `rc=$?` captured after each `curl`, because
only the HTTP status was recorded and a DNS failure, a timeout and a disk-full
write were indistinguishable; the first 2KB of any failing response kept
locally at `~/Library/Logs/backup-app-data-last-failure.txt`; the shrink guard
extended to the append-only stores together rather than one; and `~/bin` put
under git and into `SOURCES`, so **the script that protects everything else is
no longer the one thing protected by nothing.** `[FND-chat 2026-09-05]`

`tasks` is guarded non-fatally, deliberately — it is not append-only, and a
fatal guard would wedge the backup permanently after one deliberate deletion
with no way out. The cost, stated so nobody rediscovers it: **a shrinking
`tasks` store produces a log line nobody has to act on**, which is §7(a)'s
shape, and it will be read on the day something is lost and not before.

**The "proven unattended" claim in v2.3 was true when written and did not
cover what it was cited for** — the 09-03 run predates the live-export feature
and proves file copying only. Bug family (d) applied to evidence rather than a
constant. `[capture-chat 2026-09-05]`

**This backup is what found the deleted bout** — see §7(k). Comparing the
old snapshot against the new export turned up two entries present in the
snapshot and absent from production. That was not what the comparison was
for.

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

**Breached twice on 2026-09-04, harmlessly, which is luck.** An FND session
committed twice into `adhd-tasks` while an ADHD session was live there;
nothing collided because the changes stayed out of `src/`. Both sessions
flagged it unprompted, neither hid it. **A third breach on 09-05:** the
capture session appended tests to `adhd-tasks` while that repo's own session
had twelve modified files open. Caught by checking `git status` before going
further; the change was backed out and nothing was lost.

**§13.8 gives four rules hooks and this is not one of them.** A `SessionStart`
or `PreToolUse` check for *"am I editing a repo whose working tree is dirty
with someone else's work"* would have stopped it, and is the obvious fifth
hook. `[capture-chat 2026-09-05]` `[PROPOSED]` **The gap the rule doesn't cover:** it
says one session per repo, and says nothing about a session in one repo
reaching into another — which is what actually happened, and is the harder
case, since the session doing the reaching is by definition not the one
holding that repo. Left open rather than patched. `[PROPOSED]`

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
1. **Spec files into the repos.** **The canonical list of what a repo holds
   lives in `NEXT-STEPS.md` and is not repeated here** — it was maintained in
   two places and drifted within a week, which is §5.8 applied to a file list.
   `spec_copies()` discovers repos rather than enumerating them, which is how
   a fourth repo was found still on v2.3. Until this lands, §13.6 instructs a step that cannot be
   complied with. Fold in §13.8's hooks in the same session.
2. ~~**Capture service.**~~ **Done** — live, wired, two real acceptance
   dictations (§10).
3. ~~**Wire the ADHD app to it.**~~ **Done** — every capture path, not just
   the one the contract names (§5.4).
4. **Routine app — next.** First app on the shared package. Boundary with
   the task app decided; sequence in §8.
5. **Media.**
6. **Global** — last of the integrated apps; daily synthesis only, then
   arbitration later. **D3 and Q2 are decided here**, not before.

**Writing** sits outside this sequence — separate shape, whenever.

Move a step only for a reason recorded in `DECISIONS.md`.

---

**13.8 Enforcement rather than instruction** — built 2026-09-04

Several rules in this document used to be requests a session could skip.
Claude Code **hooks** are shell commands run at fixed points in a session's
lifecycle, so the action always happens rather than depending on the model
choosing to run it. Four are now installed in both app repos, in
`.claude/settings.json`, committed with the repo the way `CLAUDE.md` is.

| Rule enforced | Hook | Verified |
|---|---|---|
| §13.6 one writer | `PreToolUse` on `Edit`/`Write` → block the spec files | **Fired live.** Blocked a real write; file not created, md5 unchanged |
| §7 no production-write diagnostics; §13.6 one writer | `PreToolUse` on `Bash` → block production `POST`/`DELETE`, and writes to the spec files by any shell verb | **Fired live, five times**, three unplanned. One genuine false positive found and fixed |
| §13.6 run `check-refs.py`; copies must not drift | `Stop` → run it, plus compare every `SYSTEM.md` copy against the ecosystem original and `CLAUDE.md`'s §2/§3 against `SYSTEM.md`'s | Script proven across four scenarios. **Wiring unproven** — silent by design, so it will first speak when something is genuinely wrong |
| §13.3 rules get skipped | `SessionStart` → inject §2 and §3, sliced live from `SYSTEM.md` | **Confirmed** by a session in the other repo listing all seven unprompted |

Why a hook and not a permission rule: `PreToolUse` hooks fire before any
permission-mode check and a hook returning deny blocks the tool even under
`--dangerously-skip-permissions`, so no session can reason its way past one.
Deny rules have repeated public reports of not being enforced; treat any deny
rule as unverified until tested.

**Four things the build taught, each of which nearly shipped wrong:**

**The polite door is not the only door.** The first hook blocked `Edit` and
`Write` and not `Bash` — so `cat > SYSTEM.md`, `sed -i`, `cp` all walked
straight past it. A rule enforced against the tools a session normally uses,
with the shell wide open, is a suggestion. `[FND-chat 2026-09-04]`

**A blocking check can trap the session.** `check-refs.py` exits non-zero
when it finds a problem; a `Stop` hook that blocks on failure means the
session cannot stop, runs again, fails again. The hook reports and never
blocks. A session you must force-quit is worse than a check you must read.
`[FND-chat 2026-09-04]`

**Enforcement can block its own remedy.** The Bash hook blocked `cp` to
`SYSTEM.md` — including the copy that installs the *next* version. §13.6
says the planning chat copies the result out to every repo, but a chat
cannot write to disk, so a code session must run that copy. The fix is not
to weaken the hook but to encode the direction of authority: **a copy whose
source is `~/Projects/ecosystem/` is allowed; every other direction and
every other verb is not.** `[FND-chat 2026-09-04]`

**Bug family (c) twice, in the hook meant to prevent bad checks.** The
false-positive fix matched verb and filename across newlines, so prose
mentioning `cp` and `SYSTEM.md` twenty lines apart read as one command. And
the direction-aware allowance passed its unit test, then was blocked the
first time it ran for real: the test handed the hook `cwd=ecosystem`, while
the actual command is `cd ~/Projects/ecosystem && cp …` with the `cd`
*inside* the command. Both caught by running it live rather than trusting a
green suite. 22 cases now pass in both repos — **ten of which assert
something must be allowed**, because a hook that denies everything passes no
test worth having. `[FND-chat 2026-09-04]`

**A remaining tension, not resolved:** §2 and §3 now exist twice per session
— inline in `CLAUDE.md` per §13.3, and injected live from `SYSTEM.md` by the
hook. Update `SYSTEM.md` without regenerating `CLAUDE.md` and a session sees
both versions. That is bug family (b) — a value one part respects and
another assumes — created by two rules that each make sense alone. The
`Stop` hook's drift check is what catches it; before that check existed,
nothing would have. `[FND-chat 2026-09-04]`

**A weekly audit task** `[PROPOSED]`, still unbuilt. Claude Code Desktop can
run a local scheduled task with access to the repos. Read-only, working
folder `~/Projects/ecosystem`: run `check-refs.py`; confirm every
`SYSTEM.md` copy matches the ecosystem original; check new `[FND-chat]` and
`[ADHD-chat]` claims against the repos; **confirm production is running the
current commit** (one call, and it would have caught two days of pushes
deploying nothing); hit **only** FND's already-gated
read routes — never `quick`, never `logs`, never a write. Writes findings to
`AUDIT.md`; never touches `SYSTEM.md` or `DECISIONS.md`; **says nothing when
everything matches.** Much of the drift-detection half now lives in the
`Stop` hook instead, which runs more often and costs nothing.

Two constraints on the whole idea, both from this document. **Detection can
be automated; writing cannot** — every entry in `DECISIONS.md` Part 2 is a
chat that recorded a report without checking it, and an unattended writer is
that failure with the human removed (§13.4, §13.6). And **a daily digest
would fail §9's own test** — it must replace checking, not add to it, and §4
says what happens to anything needing upkeep. A checker silent when correct
passes; one that reports every day does not.

**What this cannot do:** hooks catch *process* failures — a skipped check, an
unrecorded decision, an unauthorised edit. They cannot catch a coding bug in
one app affecting another. That is handled by §2A.1 and §2A.2 making the
interaction impossible, and no monitoring layer improves on it.

**What it did do, on its first night:** the session that had written a
fabricated entry into the production health record said of the Bash hook,
unprompted, *"it would have stopped me planting that test entry in your
production record earlier tonight."* That morning it was a sentence in a
document. `[FND-chat 2026-09-04]`
