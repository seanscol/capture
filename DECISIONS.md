# DECISIONS.md — history, reasoning, and corrections

**Version 3.8 · 2026-09-16** — versioned as a set with `SYSTEM.md`. Added
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

**Corrections 1–18 have been archived** to
`~/Projects/ecosystem/CORRECTIONS-ARCHIVE.md`, which is **not copied to the
repos**. They are settled: each records a claim that was wrong, was fixed, and
no longer changes any decision. The growth constraint at the head of
`SYSTEM.md` permits shrinking at any time and this is the first time it has
been used. **The bug families in §7 carry everything the archived corrections
taught** — a family is the durable form, a correction is the incident.

**19 onward are live** because each still governs something: the fail-open
finding, the token rules, the read-surface decision, and the provenance rules
are all cited by current code.

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
**CLOSED 2026-09-07 — and its stated remedy was wrong.**
The entry below concluded that FND's lack of an `actor` field was why the
planted bout was harmful. FND now has one, and **it would not have helped.**
Marking a fabricated entry `system` removes it from the load total while
leaving it in the evidence base that sets the ceiling: **three days of 400
CLU marked `system` take the effective daily budget from 80 to 574.**
Fabricated load does not add to what he has done — **it raises what he is
permitted to do**, which is worse. `actor` is an effort-attribution
mechanism; the safety mechanism is and remains §7's rule against
production-write diagnostics. `[FND-chat 2026-09-07]`

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
