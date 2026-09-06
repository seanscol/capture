# DECISIONS.md — history, reasoning, and corrections

**Version 3.0 · 2026-09-06** — versioned as a set with `SYSTEM.md`. Added
because without this line the drift check could only ever classify this file
as `unknown`: protected but not versioned. `[FND-chat 2026-09-06]`

Companion to `SYSTEM.md`. That file states what is currently true; this one
records **how it got that way** — every decision with its reasoning, every
question with its history, and every correction with what was wrong, who
caught it, and why it mattered. Read this when you need to know *why*, or
when something in `SYSTEM.md` looks wrong and you want to check whether it
has already been argued over.

Nothing in here is binding. `SYSTEM.md` is binding.

---

## Part 1 — Decisions, with reasoning

### D1 — A rough day flagged in one app does not soften another
**Sean, 2026-09-01: "I would say no."**

Raised as an open question in `[ECO]` with a real case both ways: for (less
friction, less re-explaining), against (conflating domains; one app's bad
day colouring everything else). Sean chose against.

Scope was then narrowed because a coding agent would blur it. Prohibited:
app A's *display* changing because of app B's *data*. Not prohibited: the
global app seeing both (D2), and Sean's own *declared* capacity being read
by every app (Q1) — because declared capacity is his input, not an app's
inference, and that distinction is the whole question.

### D2 — The global app may join FND and task data
**Sean, 2026-09-01:** *"As long as there are safeguards, there's no risk to
the FND app itself or the data, then I am fine — because ultimately I want
the global app to integrate all the data, so there has to happen."*

The decision is Sean's; the safeguards were written by Claude and reviewed
by the FND chat. The FND chat's review found that the first list of seven
was entirely technical — no writes, no shared code, separate deployment,
rate limits — and missed the risk that can actually hurt him: a second
answer to "how much can I do today," without FND's tests or ratchet logic
behind it, that only needs to be *believed* to cause a relapse. That became
§2.7 (pass-through, never synthesis) and the first safeguard.

The "own revocable credential" safeguard turned out not to be possible as
FND stands: one read token covers `widget`/`room`/`digest` and the
Scriptable widgets use it. A second token variable is pending.

§2A.2 (FND ↔ ADHD do not interact) is untouched by D2. The join happens
only in the global app.

### D3 — Manic phase: response specified, trigger not
**Sean, 2026-09-01:** *"If I'm manic, then no tasks or only one task a day,
everything minimal."*

Two consequences drawn by Claude: it is a **response to a present state,
not a prediction**, and so doesn't run into §2.6; and it is structurally a
capacity setting with a floor, so the global app may need no bipolar model
at all. Still open: how the state is established (Q2), whether the floor
can be lifted in the moment (Q3). The FND chat later observed that D3 has
the shape the incentive test (§2.1) catches — declaring a phase makes the
system do less for him, so it pays him to stay quiet — which is why Q2 and
Q3 are harder than they look.

### D4 — One visual language, with variation
**Sean, 2026-09-01:** yes, but the apps shouldn't feel like one app; and he
wants FND and ADHD brought onto a single language.

The second half was initially recorded as blocked by the freeze — an error
(see Correction 1 below). Under the corrected §2A.1 it is his own
development and unblocked; Q4 became a sequencing question. Both code chats
recommend deferring it, for two reasons: a "styling-only" change is exactly
the kind that turns out not to be, and there is nothing yet to converge FND
onto. Recorded as deferring something he asked for; his call.

### Health app dissolved
**Sean, 2026-09-01:** *"There might be no need for a health app actually,
and the few data that we have feed directly into the global app."*

Preceded by Q8 — what question does the health app answer? — raised because
it was the one app that answered none, and would therefore need upkeep and
be abandoned within a week (§4). Consequences: health data is an *input to
synthesis*, not a health tab; blood-test entry and manic history need a
home (→ Q9); MacroFactor's import stays by Sean's decision, conditional on
the synthesis actually consuming it.

### §5.5 and the backup script: exception, not amendment
**Sean, 2026-09-04:** *"let's go with the exception."*

The backup script now reads both apps' `/api/export` daily, making it a
second thing reading across — which §5.5 reserves for the global app. Both
code chats raised this independently and **neither reinterpreted the rule on
its own authority**, which is the behaviour the rule exists to produce.

Two options were put: amend §5.5 to admit "operational tooling, read-only,
with its own revocable credential," or record a named exception. The
argument for the exception, and the one Sean took: this document's history is
that broad categories get abused and specific instances don't — corrections
1, 7 and 8 are all rules quietly widened or narrowed — and §13.8's audit task
will be the second case wanting the same permission. Two instances tell you
what the category actually is; one tells you nothing. Deciding again when the
second arrives is the point, not the cost.

What makes it defensible either way: the script reads only, and holds its own
credential — `INTEGRATION_TOKEN` for FND, chosen over the already-set
`WIDGET_TOKEN` precisely so that revoking the backup does not empty the
phone.

### Build order: capture before routine
Claude first placed routine before capture, on the reasoning that a small
visible app should come before infrastructure. Sean pushed back
(2026-09-01): capture is integral to an app in daily use, whereas nothing
yet suffers from the routine app's absence. He was right. Recorded because
the original reasoning will look sensible again.

### Capture service: separate repo, stateless, live parsing
Three decisions, each made after an error:

- **Separate repo** rather than inside the ADHD app: blast radius. An API
  key, network latency and a nondeterministic model inside the app he uses
  daily means a capture bug can take that app down.
- **Stateless, app writes to itself**: resolved an apparent contradiction
  with §5.5 that the ADHD chat found (the service "writes into apps"). It
  doesn't — the app calls it and writes its own data. No exception needed.
- **Live parsing, not batched**: Claude's v0.x said structuring "happens
  afterwards, batched." The ADHD chat: that destroys the echo-back property
  of `/api/quick`, so a wrong parse he can't check while he remembers what
  he said becomes a wrong entry, and §2.2 silently stops working. Cost was
  never the reason to batch — ten dictations a day is pennies. Refinement:
  raw is written synchronously *before* the model is called, so capture
  never blocks and both properties survive.

---

## Part 2 — Corrections log

Each entry: what `SYSTEM.md` said, what was wrong, who caught it, why it
mattered. In order of how much damage the error would have done.

### 1. "FND is frozen" — would have blocked Sean's own work
**v0.1–v0.4 said:** "The FND tracker is frozen. No refactors, no dependency
updates, no small cleanups," inlined into every repo's CLAUDE.md as an
override on anything sensible.
**Caught by:** FND chat, 2026-09-01. Growth charts had shipped to FND the
day before; an agent reading the rule literally should have refused.
**What went wrong:** Sean's words were about *coupling* — he didn't want a
coding bug in another app propagating into FND. Claude generalised a rule
about coupling into a freeze on his own development.
**Now:** §2A.1. FND never acquires a dependency on another app; Sean's
development is unrestricted.

### 2. Safeguards protected the software, not the person
**v0.3 said:** seven technical safeguards for D2.
**Caught by:** FND chat. "It doesn't need to write to FND to cause a
relapse. It only needs to be believed."
**Now:** §2.7, pass-through never synthesis, an inviolable rule.

### 3. Capture batched instead of live
See Part 1. Caught by ADHD chat. The worst error because it was
self-undermining: two stated properties that cancelled.

### 4. `/api/widget` named as the integration point
**v0.x said:** the global app reads only `/api/widget`.
**Caught by:** FND chat. `/api/digest` was built 2026-08-30 for exactly this
job; reconstructing a day from `widget` is the mistake `digest` exists to
prevent.

### 5. "Downward free, upward earned" did not catch a real bug
**Caught by:** FND chat, from its own debugging, 2026-09-01. A fix capping
from recent typical level made silence pay (budget 120 if quiet, 83 if
logged honestly), written *while explicitly reasoning about §2.1*, because
relaxing a cap reads as correcting an error.
**Now:** the incentive test in §2.1 — a yes/no question rather than a
disposition.

### 6. §5 was the ADHD app's architecture presented as a universal contract
**Caught by:** FND chat (FND already failed two clauses), then ADHD chat
(the ADHD app itself failed §5.3's field names).
**Now:** the contract binds at the endpoint boundary; §5.3 states
requirements not field names; FND grandfathered; ADHD complies.

### 7. Ten flat "hard rules" mixing the inviolable with preferences
**Caught by:** FND chat. "If everything is a hard rule, an agent triages
them itself and you don't get to choose which."
**Now:** seven inviolable rules (§2), structural decisions (§2A), design
values (§6).

### 8. "No forward projections" over-generalised
**v0.x said:** no forward projections at all.
**Caught by:** FND chat. A compliant twelve-week ceiling projection was live
on the Limits tab and a literal reading would delete it.
**Now:** §2.6 narrowed to recovery trajectory and targets.

### 9. Q1 framed as one decision
**Caught by:** FND chat. Declared capacity down is safe; declared capacity
up is permission by assertion — the hole §2.1 exists to close. The
asymmetry was promoted into §2.1 itself.

### 10. Wrong outcome recorded for a design rule
**v1.1 said:** "How big a job do you want?" worked.
**Caught by:** ADHD chat. It was rejected the next day; it is now "How long
have you got?" — because every job should be small, so the question
shouldn't arise. Would have been copied into the next app with the rule.

### 11. Stale cross-reference after renumbering
**v1.0–v1.2:** §10 cited §2.6 for "verbatim text must survive"; after
renumbering that was §2.2 and §2.6 meant projections.
**Caught by:** FND chat. The dangerous class is references whose target
still exists but now means something else. Now checked by `check-refs.py`.

### 12. Counts in prose
"~504 tests" was 508 within days; "99 tests" was 105; "21 routes" was 31
and was wrong when stated. All dropped, per §5.8, at the FND chat's
suggestion. Bug family (d) in the document that names it — three times.

### 13. Inferred paths
**v1.1 said:** FND lives at `~/Downloads/fnd-tracker`.
**Caught by:** FND chat. The folder is `~/Downloads/Logging calf`;
`fnd-tracker` is the remote name. Claude inferred a path from a remote
rather than checking — exactly what it should never do.

### 14. Q1 and visual-language questions under-captured from [ECO]
Claude compressed two of Sean's open questions into narrower versions
while writing v0.1, and only noticed on a second read of the same file.

### 15. Moving folders framed as protection
**v1.x said:** move repos out of `~/Downloads`.
**Caught by:** FND chat. The machine has no backup, so the destination is
no safer than the origin. Then reframed by Claude: `~/Downloads` is
TCC-protected and a plain folder is not, so the move may remove the need
for a Full Disk Access grant — a real function, but a different one.

### 17. `/api/export` recorded as gated when it was not
**v2.0 §5.6 said:** export is gated.
**Reality:** a live check on 2026-09-03 returned HTTP 200, unauthenticated,
full record in one request. The FND chat had *proposed* gating it, Sean had
said yes, and the planning chat recorded the proposal as the outcome.
**Caught by:** FND chat, by checking live.
**Now, verified 2026-09-03:** `GET /api/export` returns 401 with no
credential *and* 401 with a deliberately wrong token, so the gate compares
against a real value. `WIDGET_TOKEN` is what holds it. **`INTEGRATION_TOKEN`
is not set in Vercel** — v2.2 recorded it as delivered alongside the gate;
it exists only in code. Bug family (j) again, in the correction written to
record bug family (j). Caught by `vercel env ls`.
**Why it matters:** nothing is done until verified live, and for "is it set"
the live check is the environment list, not a status code — a 401 proves at
least one accepted token is set, never which. And it hid something worse —
see 19.

### 18. A real instance wrapped in a fabricated consequence — then wrongly deleted entirely
**v2.0 §7(a) said:** canonical instance — a backup script reporting "4 of 4
sources" and exiting 0 having copied nothing, *believed for months,
discovered when needed.*
**v2.3 said:** it did not happen at all; the real output was
`BACKUP FAILED — 2 of 4`, exit non-zero.
**What is actually true, established 2026-09-04.** Both outputs are real and
they are consecutive runs either side of a fix. On its **first scheduled
run**, launchd lacking Full Disk Access, every copy failed and the script
printed `backed up 4 of 4 sources: 0 files` and exited 0. It was then fixed
to count real failures; the next run printed `BACKUP FAILED — 0 of 4`, and a
later one `BACKUP FAILED — 2 of 4`, both exit non-zero. v2.3's check was run
against the post-fix output and used it to deny the pre-fix output.
**So:** the instance is real. *"Believed for months"* is false — the script
was a day old and it was caught within minutes. That half was a chat's
counterfactual which the planning chat wrote up as narrated history, and it
remains the planning chat's error.
**Evidence:** a contemporaneous comment at `~/bin/backup-app-data.sh:235–242`
describing the failure in the past tense, written in the same edit as the
fix, plus the presence of that fix — the `failed` counter, the zero-files
check, the non-zero exit — in the same file. **Weaknesses, named by the
source:** `~/bin` is not version-controlled so there is no commit timestamp,
and the original log was truncated between test runs and does not survive.
Enough to establish the instance; not a transcript.
**Caught by:** FND chat both times — *because* it was tagged `[FND-chat]`
and could be taken back and checked. A provenance tag is a checkable claim
(§0). See 25 for how the second check went wrong.

### 25. The check that disproved 18 shared the assumption it was testing
Correction 18's v2.3 form concluded the instance never happened, on the
strength of an output reading `BACKUP FAILED — 2 of 4`. That output is from
**after** the fix. Asking a fixed script whether the bug ever existed is bug
family (c) — verification sharing the bug's assumption — committed inside the
corrections log, in an entry whose whole subject is a claim recorded without
checking.
**The planning chat then asserted it as settled**, twice, telling Sean flatly
that the instance was fabricated and instructing him to correct a code
session that had it right. Correction 20's shape again: an unchecked
assertion reads exactly like a checked one, and citing a document is not
checking when the document is what is in question.
**What recovered it:** the FND chat produced the contemporaneous comment and
named its own evidential weaknesses unprompted. Correction 18's own
conclusion — that a provenance tag is a checkable claim — is what made the
recovery possible. The tag worked. The check was aimed one step too late.
**The practice that falls out of it:** when checking whether a bug existed,
check the state *before* the fix, or say you cannot. And §7 now carries: a
diagnostic log worth quoting later must not be truncated between runs.

### 19. `API_TOKEN` never set — every FND write endpoint open
Not a documentation error but the most important finding of the day.
`proxy.ts` fails open by design if the env var is unset, so a typo can't
lock him out mid-relapse. The env var was never set in Vercel. The design
was right; the assumption underneath it never held. Found while gating
export. Now §13.7 step 0b.

**Evidence upgraded 2026-09-03.** The original evidence was that
`POST /api/quick` with no credential returned 400 rather than 401. That is
*consistent with* fail-open and demonstrates nothing — bug family (c), the
instrument sharing the assumption. Two real proofs replaced it: an
unauthenticated `DELETE /api/logs?id=<nonexistent>` returning
`{"ok":true}` (no footprint), and an unauthenticated `POST` that landed in
the record, 612 → 613 → 612. The first is the one that should have been
sufficient. See correction 22.

### 22. A diagnostic wrote to the production health record
**What happened:** to demonstrate the write hole, a one-step walking bout
was posted to the live record with no credential, confirmed present, then
deleted. It existed for about ninety seconds and while it existed it counted
in daily load, effective load, and anything reading the API. FND has no
`actor` field — §5.3, grandfathered — so there was no way to mark it as
system work worth zero. **§2.4 has no enforcement in FND.**
**The sharper part:** the cleanup depended on the hole under test. Had
`API_TOKEN` been set between the write and the delete, the fabricated bout
would be in his medical record permanently, unremovable.
**Caught by:** the FND chat, unprompted, immediately after doing it — and it
also found the read-only alternative and reported that it had run it first.
**Whose error:** the planning chat's. Its prompt specified the destructive
method — *"POST a real payload with no credential, check whether it appears
in the data, then delete it"* — for a question a read-only probe had already
answered and reported. The marginal certainty gained was small: same proxy,
code already read, `if (!token) return NextResponse.next()` returns before
route dispatch. Small is not zero. It was not worth a fabricated entry in a
medical record.
**Now:** two practices in §7 — establish that no read-only proof exists
before writing to production, and never let cleanup depend on the mechanism
under test. Stated as a prompt constraint rather than a disposition, for the
same reason §2.1 has the incentive test. A disposition isn't checked.
**Not a pattern:** an earlier claim that this was the second such write that
day was retracted — see 23.

### 23. Two claims asserted, then retracted by their own source
Within one exchange the FND chat stated, and then corrected, that (a) this
was the second diagnostic write to production that day, and (b) it had found
the no-footprint proof only *after* running the destructive test. Both were
wrong. There was one diagnostic write; the other production write that day
was an attribution link Sean had asked for. And the no-footprint probe came
**first**, on the FND chat's own initiative, before the planning chat's
instruction.
**Why it is here:** this is correction 20's mechanism — *asserted by a chat
without checking, recorded by the planning chat, thereafter read as
established* — firing twice in one day in the document that names it.
**What stopped it:** the planning chat held both as open questions rather
than writing them into the spec, and the source corrected itself unprompted.
Nothing entered `SYSTEM.md`. That is the §13.6 loop working, and it is the
argument for the discipline in §13.6, not against it.
**Surviving consequence:** the rule from 22 stands on one instance. "Twice is
a pattern" does not.

### 24. The planning chat asserted a limit it had not checked
**It said:** it could not monitor the process, framed as a hard capability
limit, and proposed a role designed around that limit.
**Reality:** Claude Code Desktop runs local scheduled tasks with access to
local files and tools, and hooks run shell commands at fixed points in the
session lifecycle — between them, most of what "monitoring" meant here is
buildable. §13.8.
**Caught by:** Sean, who said it seemed obvious and asked whether more
efficient approaches existed. He was right, and the follow-up research found
several.
**What went wrong:** a limit of what had been checked was reported as a limit
of what was possible. Correction 20's shape, committed by the planning chat
about *itself*. The general lesson is the one this file keeps relearning:
**an unchecked assertion reads exactly like a checked one.**
**Real limits that survive:** the planning chat still sees only what is
pasted to it, still cannot verify anything live, and hooks still cannot catch
a coding bug in one app affecting another (§2A.1, §2A.2 do that).

### 20. VAPID keys called "irreplaceable"
**v2.0 §13.1 said:** losing `.env.local` would silently kill the phone's
push subscription.
**Reality:** production serves the identical public key; Vercel holds the
keypair; recovery is fifteen minutes from the dashboard.
**How it got there:** asserted by a chat without checking, recorded by the
planning chat, and thereafter read as established. Bug family (d) operating
on the document itself.

### 21. TCC protection stated as belief when it was measurable
**v2.0 §13.1 said:** `~/Projects` is "believed not to be" TCC-protected.
**Reality:** measured from a real launchd job — `~/Projects` read/write yes,
`~/Downloads` read no, iCloud Drive write yes. The FDA grant was
unnecessary. The general rule (FDA on bash is inherited by every agent
command) survives the resolved instance.

### 16. CLAUDE.md template never updated
**v0.1 template** carried the "frozen" rule (Correction 1) and was not
touched through nine revisions of the spec — the file that goes into every
repo and is read first. Bug family (d) in the artefact where it does the
most damage. Fixed in v2.0.

---

## Part 3 — Open questions, with history

**Q1** Shared profile — raised `[ECO]`; Sean "I don't know"; mostly
resolved by asymmetry (Correction 9). Remaining: one object or per-app
field.
**Q2** How a manic phase is established — declared vs inferred, then the
FND chat's third option: set in advance or by someone else. **2026-09-03:
there is no second person** `[SEAN]`, and nothing for one to use — no second
user, no second-person auth, no outward notification path. With declaration
forbidden by D3 and inference forbidden by §2.6, D3's trigger has nothing to
hang on, so D3 and Q2 are **deferred to the global app build** rather than
left as live questions each new session re-argues. Separately: *"set in
advance"* was found to conflate two things — the *response* agreed calmly in
advance (fine, and what Q3 assumes) and the *phase* declared in advance (a
forecast, §2.6). `[ADHD-chat 2026-09-03]`
**Q3** Can the floor be lifted in the moment — the §2.3 exception under
consideration. FND chat linked it to the incentive test.
**Q4** FND restyle timing — see D4.
**Q5** ADHD adopts shared package — narrowed to convenience after
Correction 6.
**Q6** FND auth — closed 2026-09-01 by the FND chat from `src/proxy.ts`.
**Q7** Writing corpus location — raised 2026-09-01 from Sean's description
of the writing and global apps.
**Q8** What question does the health app answer — closed: none; dissolved.
**Q9** Global owning its own data — promoted from Q8's bullets by the FND
chat because it was the only consequence touching a rule.

---

## Part 4 — Changelog

**3.0 — 2026-09-06.** `DECISIONS.md` joins the versioned set, and the hooks
are found to have forked.

- **This file now carries a `**Version` line.** Without one the drift check
  could only classify it `unknown` — protected but not versioned. Numbered
  3.0 rather than reissuing 2.9, on the rule adopted one version earlier:
  **burn a number rather than reuse one.**
- **The hooks have forked, and nothing could have told anyone.**
  `adhd-tasks` and `capture` carry a different drift-check implementation
  from `fnd-tracker` — two sessions solved the same problem independently and
  `_spec.version()` takes the file's text in one and its path in the other.
  **The hooks are shared tooling copied into every repo, exactly like
  `SYSTEM.md`, but nothing versions them and nothing checks them: the drift
  detector does not detect drift in itself.** Bug family (l), fourth
  instance. `[FND-chat 2026-09-06]`
  **Resolved:** `fnd-tracker`'s implementation survives — it is the one
  carrying `--defs`, the single shared definition, path-based matching and
  missing-copy detection. Take it wholesale rather than merging. `[SEAN]`
  **Proposed, not yet done:** hooks live in
  `~/Projects/ecosystem/.claude/hooks/`, are copied out like the spec, carry
  a version, and are drift-checked like everything else. `[PROPOSED]`
- **A copy that was never made is in no list of copies**, so a repo missing
  `operating-notes.md` read as a repo in agreement. §2.1 exactly: absence of
  data is not good news. Now reported. `[FND-chat 2026-09-06]`

**2.9 — 2026-09-06.** Two planning-chat errors, both caught by sessions.

- **v2.8 was issued twice with different content.** Same version line,
  different bytes, an hour apart. The drift check reported it as *"a copy was
  edited in place"* — the only branch it has for that evidence — and nobody
  had edited a copy. **The source changing without a bump is a case the
  classifier cannot see.** Bug family (b): a value one part respects and
  another assumes. Fix is discipline, not code: **never reissue a version
  number.** A content hash beside the version line would catch it if it
  recurs — the version says which release, the hash says whether it is
  actually that release. `[capture-chat, FND-chat 2026-09-06]` `[PROPOSED]`
- **The instruction to run `check-refs.py` over `operating-notes.md` would
  have produced silent false-clean.** That file has its own `## 4.`, `## 9.`
  and `## 10.` headings, so three of its five §-references resolve against
  the wrong document and report clean; only §2.6 and §12 would show broken.
  **That is not noise, it is silence** — precisely what `check-refs.py`'s own
  docstring names as the failure it exists for. References must be checked
  against the definitions of the document they point *into*, which is what
  the `--defs` flag does. Third instance of bug family (l). `[FND-chat,
  capture-chat 2026-09-06]`
- **The canonical list of what a repo holds** now lives only in
  `NEXT-STEPS.md`; §13.7 step 1 points at it. It was maintained in two places
  and drifted within a week — §5.8 applied to a file list. `NEXT-STEPS.md`
  itself is deliberately not in the repos: one copy on disk, read at its path.
  `[SEAN 2026-09-06]`, on `[FND-chat]`'s objection, which was better reasoned
  than the instruction it overrode.

**2.8 — 2026-09-06.** The first version since v2.3 to reach the repos.

- **v2.4–v2.7 were written and never copied out.** Every session spent two
  days auditing against a four-version-old spec and reporting staleness that
  had already been fixed — §5.6's token table, §8's lists, §10's confirm
  queue. **Same failure as the four undeployed commits in the task app, in
  the same week, by the chat that wrote the rule about it.** Bug family (o):
  a green signal about the wrong artefact, applied to documents.
- **Five new bug families.** (m) a default nobody chose — `temperature`
  unset, five prompt changes made against sampled output. (n) a failure path
  that destroys the evidence of the failure — the backup's `rm -f` deleted a
  good copy and the body that would have explained it. (o) a green signal
  about the wrong artefact, three instances in one day. (p) a convention
  standing in for a guard — a test run destroyed the dev snapshot. (q) a
  phrase acquiring his authority without having come from him.
- **Four new practices:** for "is it deployed", read the deployment list;
  latency figures from different sessions are not comparable; reproduce
  before blaming; a screenshot of the app being wrong is worth more than a
  test — stated as a limit, because it puts the cost of discovery on him.
- **§10 rewritten from the shipped service.** Confirm queue dropped for
  creations `[SEAN]`; latency measured and accepted; fails closed; checks a
  modification's record against the model's own description; `strict`
  shipped and removed at a third of the generation rate. **In every case the
  fix was a check in code, not a better instruction in the prompt.**
- **§8's ADHD key and endpoint lists deleted** rather than updated, per
  §5.8. They went stale twice in three days.
- **The routine app is specified** — full-day sequence, seven stages, the
  waking/cadence boundary with the task app, and a stored "not yet" list
  that is never shown as part of the sequence. `[SEAN 2026-09-06]`
- **A link is not a read** (§5.5). The routine app opening the task app's
  `/week` in a browser needs no exception.

**2.7 — 2026-09-04.** A constraint on this document's own growth.

- **The two archive findings Sean names as outranking the rest** are now at
  the head of `SYSTEM.md` and `operating-notes.md`: he remembers the
  architecture of a life better than living it, and nothing gets completed.
- **The spec may grow only in a version where something shipped. It may
  shrink at any time.** Written because designing this system is the pattern
  it describes: v2.2 → v2.6 in twenty-four hours, roughly doubling in
  length, with one component shipped. `[SEAN 2026-09-04]`
- **Corollary:** when the choice is between recording something and building
  something, build. The exception is retrieval — `operating-notes.md` item 2
  — which is a low bar most additions do not clear.

**2.6 — 2026-09-04.** Personal content stripped from the spec.

- **§4 rewritten as structural constraints only.** Diagnoses, clinical
  description and history removed. What survives is the six facts that each
  constrain a design decision — upkeep gets abandoned, capacity is
  unpredictable, exertion has delayed non-proportional consequences,
  work is open-ended, night-shifted hence the 05:00 boundary, iOS and
  dictation. Clinical detail for the FND tracker lives in that app's repo,
  where it is load-bearing.
- **`operating-notes-psychology.md` → `operating-notes.md`**, rewritten
  content-free. The source analysis used biography as evidence —
  bereavement, illness, relationships, named people — and none survives. All
  eleven structural findings and their line citations do.
- **The reason, in Sean's words:** *"the lessons are structural, not
  content… I don't want any random salience misjudgment to generate from
  nowhere some intimate detail and make that into a rule for coding."*
  `[SEAN 2026-09-04]` **This is now the test for anything added to §4 or
  §4A:** does it constrain a design decision, or is it merely true?
- **Left standing, and flagged for a decision:** §12 D3/Q2 and Q9 still name
  a phase and a health-data type, because they are design decisions *about*
  those things and removing the words would make them incoherent. Different
  category from biography; still Sean's call.

**2.5 — 2026-09-04.** The archive arrives, and the capture service ships.

- **§4A added**, pointing at `operating-notes-psychology.md` — eleven
  regularities derived from 137,000 words of Sean's 2023–2026 archive, each
  with a line citation, agreed by him. `[SEAN]` Six change what gets built:
  a completion channel and decay are missing and their absence is the
  archive's most consistent finding; asterisks are the priority signal and
  frequency is the anxiety signal; every surface should bias toward the past
  tense; breaking an unresolved thing into subtasks is the most consistently
  demonstrated failure mode; plan size should be tracked as a number and
  shown back (his own idea); and there is no second person, so the right
  output of that pattern is a task with a name on it.
- **The meta-risk is named in the spec.** The archive holds more than twenty
  full daily routines in four years, identical in shape, none evidenced as
  running a month. This system is structurally the twenty-first. The test
  that distinguishes it: **every previous system recorded what he intended;
  this one has to record what happened.**
- **§10 rewritten from the built service.** *"Start with the smallest and
  escalate"* is falsified — larger models were less accurate *and* slower.
  Always set `temperature` explicitly and `strict: true` on the tool; the
  API default of 1.0 meant twelve runs of analysis partly diagnosed sampling
  noise. §2.2 is now enforced by three guards, each stating its blind spot.
- **§7(l) added** — a checker structurally unable to see a class of error,
  and silent about it. `check-refs.py` passes on `[NEXT §8]` because it
  reads that reference as `SYSTEM.md`'s §8. Bug family (a) inside the tool
  built to catch (a).
- **Step 4 done**, 10 of 10 on the acceptance dictation after
  `temperature: 0`. Flagged by the building session and worth keeping
  visible: five prompt rules were tuned against randomised output and may be
  fitting noise.

**2.4 — 2026-09-04.** The night steps 0b, 1 and 2 all landed, plus the
backup fix and one real incident found by accident.

- **Step 0b done.** Every FND write endpoint now gated; an unauthenticated
  `DELETE` returns 401, verified 01:03 BST. `API_TOKEN` and
  `INTEGRATION_TOKEN` set. The two-phase order worked exactly as designed —
  every writer got its header first, nothing broke in between, and the
  standalone-PWA trap resolved via a Settings → Access field, confirmed by
  logging from the icon rather than Safari.
- **The backup was protecting a museum piece.** It copied each repo's
  `data/`; production for both apps is Redis. 44 FND entries and two days
  missing; 82 ADHD judgements missing, being the ranking model's training
  set. Both now fetch `/api/export`. Bug family (h) in the backup itself.
  §13.1 rewritten. Verified by reading the file: 689 and 633.
- **New bug family (k)** — a correct system computing from a record that has
  silently lost something. A real 110 CLU bout from 1 September had been
  deleted while removing a duplicate; 1 Sept load read 75 instead of 175 and
  the cap 38 instead of 88. Nothing in the app noticed. It surfaced only
  because the backup fix compared two copies. Restored.
- **Corrections 18 and 25.** The `4 of 4 / 0 files` instance is real after
  all; only *"believed for months"* was fabricated. v2.3 deleted it on the
  strength of a check run against post-fix output — bug family (c) inside the
  corrections log, then asserted as settled by the planning chat.
- **§13.8 rewritten from what was built**, not proposed. Four hooks live in
  both repos; two fired live, one confirmed from another session, one silent
  by design. Four lessons recorded, each of which nearly shipped wrong — the
  polite door, the blocking check, enforcement blocking its own remedy, and
  bug family (c) twice inside the hook meant to prevent bad checks.
- **§5.5 gains a named exception** for the backup script `[SEAN]`, rather
  than an amendment admitting "operational tooling."
- **§13.2 breached twice, harmlessly**, and the gap named: the rule says
  nothing about a session in one repo reaching into another.
- **§8** gains the ADHD app's `/api/export`, which the repo had and the spec
  didn't.
- Two practices added to §7: don't truncate a diagnostic log between runs;
  append to a credential file with `>>`, never `>`.

**2.3 — 2026-09-03.** A day of live verification, three new corrections
(22–24), and two structural decisions.

- **§5.6 rewritten from live checks and `vercel env ls`**, not from code.
  Export gate real (401 with no token *and* with a wrong one). `WIDGET_TOKEN`
  and `CRON_SECRET` set; `API_TOKEN` and `INTEGRATION_TOKEN` not. Writes
  demonstrated open both directions. New practice: for "is it set in
  production", read the environment list.
- **§13.7 step 0b split into two phases.** `proxy.ts` returns before reading
  any header while `API_TOKEN` is unset, verified live, so every writer can
  be given its Bearer token first at any pace. The "don't leave the room"
  window in v2.2 was unnecessary. Also recorded: **0b outranks 0**, active
  exposure over latent, per §13.7's closing line. `[SEAN]`
- **The standalone-PWA trap named** (§5.6). iOS gives an installed
  home-screen app a storage partition separate from Safari, so the icon can
  stop logging silently while Safari works. Phase B's completion test is
  therefore *log from the icon, not Safari*. One-time cookie copy at install
  is the first remedy to try.
- **§13.6 becomes one writer to the spec files.** `[SEAN]` Code sessions
  audit and report; the planning chat edits. The v2.1/v2.2 fork is the
  evidence. The audit loop is untouched — editing forks, checking doesn't.
- **§13.8 added: enforcement rather than instruction.** `[PROPOSED]` Four of
  this document's rules mapped onto Claude Code hooks, plus a silent weekly
  audit task. Written after correction 24.
- **§2.7 gains the synthesis form**, and §9 the structural answer to it. The
  ADHD chat's escalation: a model asked to look across two datasets *will*
  assert relationships, so this needs a prohibition rather than a limit. The
  planning chat's addition: the prohibition covers assertion but not
  *selection*, so FND's verdict occupies a fixed slot and is never one of the
  observations.
- **D3 and Q2 deferred to the global app build**, with the reason recorded:
  no second principal exists.
- **Constants dropped** from §6 (six hex values) and §8 (CLU bands,
  half-life) per §5.8. The colours still matched — bug family (d) caught
  before firing, which is why it was free to fix.
- **§4 medication status confirmed directly** `[SEAN]`, because the saved
  claude.ai profile asserted the opposite and sessions read both. *(Removed
  again in v2.6 — see below. It resolved a contradiction rather than
  constraining a design.)*
- **Status moved out of `SYSTEM.md`.** `NEXT-STEPS.md` is the only file that
  says done or not-done; three files disagreed within a day of v2.2.
- Outstanding and cheap: nobody has looked *inside* the backup folder. `4 of
  4` is the string correction 18 built a fabricated disaster around.

**2.2 — 2026-09-03.** Supersedes v2.0 and the FND chat's v2.1. Corrections
17–21 above applied: export actually gated plus `INTEGRATION_TOKEN`;
`API_TOKEN` never set (step 0b); the fabricated §7(a) instance replaced
with two real ones; VAPID keys recoverable; TCC measured. New bug families
(i) and (j). §13.1 rewritten from measured facts, including the launchd
backup that ran unattended. §13.7: repos moved (done), `DECISIONS.md` and
`CLAUDE.md` still not on disk. §0: a provenance tag is a checkable claim.
D3 now explicitly forbids a self-declaration toggle and points at Q2.
Writing moved outside the numbered sequence.

**2.0 — 2026-09-02.** Split into `SYSTEM.md` (current state) and
`DECISIONS.md` (history). `CLAUDE.md` rewritten — it had carried the freeze
error unchanged through nine revisions.

### Earlier (v0.1 → v1.7), verbatim from `SYSTEM.md` before the split

Verbatim from `SYSTEM.md` before the v2.0 split.

**1.7 — 2026-09-01.** Three findings from the FND chat's day of debugging,
plus two corrections.

- **§2.1 gains the incentive test:** *before shipping a change, ask whether
  it makes not-logging better than logging.* Added because the principle
  alone failed — a fix that made silence pay was written while explicitly
  reasoning about §2.1, since relaxing a cap reads as correcting an error
  rather than granting an increase. A disposition doesn't get checked; a
  yes/no question does. Noted that D3's manic floor has the same shape.
- **New bug family (g): absence of data read as *precision*.** Distinct from
  (a), which points the wrong way to catch it — the app didn't call the day
  fine, it called it exactly 65 CLU and capped on that.
- **New bug family (h): the dev copy is not the data.** A stale local copy
  lies silently and everything downstream inherits it. Recorded with the
  practice that caught it, as a win for "tests read real stored entries".
- **Q9 promoted** out of Q8's list: global owning its own data. §5.5's
  read-only governs how global treats other apps, not whether it has a store
  — but it must be said, or an agent refuses to build a blood-test form.
- **§5's boundary principle generalised** past events to the whole section.
- **Route count dropped** — v1.x said 21, it is 31, and it was wrong when
  first stated. Same treatment as the test count, same reason (§5.8).
- **§13.6a:** the cross-reference check is now a required step with a
  script, not a hope.


**1.6 — 2026-09-01.** §10 gains the practical setup constraints: the capture
service must authenticate its callers (it is the only component where being
called costs money, so an open endpoint is a bill anyone can run up), a
spend cap set at setup rather than after a retry loop, model chosen by
passing the `[NEXT §8]` acceptance test rather than by guess, and the API key
never typed into a chat.


**1.5 — 2026-09-01.**

- **§13.1(2) closed.** The ADHD repo now has a private remote at
  `github.com/seanscol/adhd-tasks`, 14 commits, `main`, with the history
  audited first — no env file ever committed, `ACCESS_KEY` in no commit.
  `[ADHD-chat]` The history audit is the step worth repeating for every
  future repo.
- **§13.1(1) still open and still the top item.** The backup script covers
  644K, not the machine.
- **Full Disk Access for `/bin/bash`: recommendation added — look for
  another route first.** Sean is about to run agent-driven shell commands
  constantly across several repos, and FDA on `/bin/bash` is inherited by
  all of them.
- **§13.1(3) reframed.** Moving folders out of `~/Downloads` is still not
  protection, but `~/Downloads` is TCC-protected and a plain `~/Projects` is
  not — so a move may remove the need for the FDA grant. Believed, not
  verified; testable in one step.
- **§7(a) gains its canonical instance:** a backup script reporting "4 of 4
  sources" while copying zero files. Kept because of when it would have
  surfaced.
- **MacroFactor monthly import: decided, do it** `[SEAN]`, with the
  condition that the import and the query consuming it land together.


**1.4 — 2026-09-01.**

- **§13.1 rewritten around a finding that outranks everything else in this
  document: the Mac has no backup at all** — no Time Machine, no iCloud
  Desktop & Documents. `[FND-chat]` Moving folders was already only
  tidiness; the real reason is not that FND has a remote but that the
  destination sits on the same unbacked-up disk. Added what a remote does
  *not* protect (gitignored `data/`, and `.env.local` with VAPID push keys —
  the genuinely irreplaceable file), and `mv` rather than re-clone, since a
  clone leaves gitignored files behind and looks like it worked.
- **§5.3 rewritten as requirements rather than field names.** v1.x promoted
  the ADHD app's schema to a standard, then found the ADHD app failing it.
  The contract binds at the endpoint boundary, not inside an app. The ADHD
  app complies today, `actor` included. Q5 narrowed accordingly.
- **Q8 answered:** possibly no health app at all. §8 and §13.7 updated;
  four consequences listed that need settling before it's final.
- §6 and §13.7 step 2 were already corrected in v1.3, before the chats'
  latest message arrived.


**1.3 — 2026-09-01.** Corrections from the FND and ADHD chats.

- §8 heading said "live, frozen" while the body said under active
  development. The heading is what gets skimmed. Fixed.
- §13.1 gave FND's folder as `~/Downloads/fnd-tracker`. The folder is
  **`~/Downloads/Logging calf`**; `fnd-tracker` is the remote name. v1.1
  inferred the path from the remote rather than checking — it led nowhere.
- §10 cited §2.6 for "the verbatim text must survive". After the v1.0
  renumbering that is §2.2. **The dangerous stale references are the ones
  whose numbers still exist** — a pointer to a deleted §2.9 is obvious, a
  pointer to a §2.6 that now means something else is not. Bug family (d),
  in the document that names it, for the second time.
- §6 recorded the wrong outcome: "How big a job do you want?" did not work
  either. It is now "How long have you got?", because every job the app
  gives him should be small. §9's `/api/checkin` line fixed to match.
- §13.7 step 2 pointed at `/api/widget`; §5.5 says `/api/digest`.
- §5.6: the `/api/export` exposure recorded, with the agreed fix (gate
  export only) and a note to do all three `proxy.ts` changes in one pass.


**1.2 — 2026-09-01.** §8 filled in from Sean's descriptions of the routine,
health, media and writing apps. Substantive additions: the health app has no
question it answers yet (Q8) and is the likeliest to be abandoned; manic
phase *history* is safe to chart and manic phase *forecasting* is not, at
single-digit episode counts, with false reassurance as the specific danger;
the media app's "criteria" step would reintroduce the decision §1 exists to
remove; the global app must replace checking rather than add to it. §11
research: TMDB is free and easy for artwork; Spotify's recommendation
endpoints are dead but search, lookup and playback survive, which is the
part he actually needs; Fitbit *data* remains reachable via Apple Health and
Shortcuts even though the Fitbit *API* is written off. New: Q7 (where the
writing corpus lives), Q8.


**1.1 — 2026-09-01.** Review by the ADHD app's Claude Code chat.

- **§10 corrected: capture parses live, not batched.** v1.0 deferred
  structuring, which destroys the echo-back property of `/api/quick` and so
  quietly disables §2.2 — a wrong parse he can't check is a wrong entry.
  Raw is written synchronously first, parse returns immediately after.
  Batching now belongs only to the global app's daily synthesis (§9).
- **The §5.5 / §10 contradiction resolved rather than exempted.** The
  capture service never writes to an app and holds no credential for one;
  the app calls it and writes to itself. No cross-app routing either.
- **§8: reproducibility added as the stronger reason** to keep an LLM out of
  the ranking. A model that can't be replayed can't be argued with.
- **Q4:** both other chats recommend (b), noted along with the fact that
  this defers something Sean asked for.
- Counts dropped from the ADHD entry too (v1.0's "99 tests" was 105).
  §13.1 sharpened — the missing remote is the most urgent item here.

**1.0 — 2026-09-01.** Substantial correction after review by the FND app's
Claude Code chat against the actual repo. Changes, in order of how much
damage the error would have done:

- **§2.1 (freeze) was wrong and is replaced.** It would have had an agent
  refuse Sean's own FND development — the growth charts shipped 2026-08-31,
  the limits rebuild, the pacing chart. His words were about coupling; v0.x
  generalised them into a freeze on his own work. Now §2A.1.
- **§2.7 added: pass-through, never synthesis, on anything physical.** The
  D2 safeguards protected the software and missed the risk that can hurt
  him. Now the first safeguard and an inviolable rule.
- **§5.5 corrected:** `/api/digest` exists, built 2026-08-30 for exactly
  this job. v0.x restricted the global app to `/api/widget`, which is the
  mistake digest was built to prevent. §8's route list corrected too.
- **Q1 made asymmetric** and mostly resolved: declared low honoured
  everywhere, declared high only where being wrong is cheap. The asymmetry
  is now generalised into §2.1.
- **§2 restructured** from ten flat "hard rules" into seven inviolable rules
  plus §2A structural decisions and §6 design values. Ten equal absolutes
  meant an agent triaging them itself.
- §5 rescoped: binds new apps; FND grandfathered at the endpoint boundary.
- §2.6 (projections) narrowed to recovery trajectory and targets — v0.x
  would have deleted a compliant chart live on the Limits tab.
- Q2 gains a third option: set in advance, or by someone else.
- Q6 closed; FND's auth recorded, and the credential safeguard in D2 marked
  as not currently possible.
- §8 test count dropped (v0.x said ~504; it was 508 within days — bug family
  (d) in this document). §13.1 now covers both repos. §11 Fitbit decided by
  three device readings, not by CASA research.

**0.4 — 2026-09-01.** Capture service shape added to §10: stateless, own
repo, own key, calling app keeps the raw, consumers degrade rather than
break. Build order added as §13.7 — capture now precedes the routine app,
reversing the earlier ordering at Sean's prompting. Both marked
`[PROPOSED]`.

**0.3 — 2026-09-01.** Four decisions from Sean recorded in §12: D1 (no
cross-app softening), D2 (global app may join FND and task data, with
safeguards), D3 (manic phase → minimal, one task a day; a response to
present state, not a prediction), D4 (one visual language with per-app
variation). §2.2 and §9 updated to point at them. Six items remain open;
Q1, the shared profile, is explicitly undecided — *"I'm not sure. I don't
know."*

**0.2 — 2026-09-01.** Two items from `[ECO]` that v0.1 under-captured added
to §12: the shared-profile question, and the consistent visual/feedback
language question (v0.1 had narrowed the latter to colour in the global
app). No decisions changed.

**0.1 — 2026-09-01.** First version. Compiled by Claude from three source
documents (`[FND]`, `[NEXT]`, `[ECO]`) and a planning conversation with
Sean. Everything marked `[PROPOSED]` is unratified and awaits his decision.

Decisions recorded from 2026-09-01:
- Apps stay separate *on the phone*; shared code and storage underneath are
  fine, except for the FND tracker, which is frozen. (§2.1, §2.3)
- Reason for the FND/ADHD non-interaction rule now recorded in full: the
  original instruction plus the risk of a coding bug propagating into the
  FND app. (§2.1, §3.1)
