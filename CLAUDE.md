<!-- BEGIN:ecosystem-spec v2.3 -->

# Ecosystem rules — read before writing code

This repo is one app in a set. The set has rules no individual repo can see
(§0). The full spec is `SYSTEM.md` in this repo, copied from
`~/Projects/ecosystem/SYSTEM.md`; the history behind every rule, and every
correction, is in `DECISIONS.md`. **What is built and what is not lives in
`~/Projects/ecosystem/NEXT-STEPS.md` and nowhere else** — not here, not in
`SYSTEM.md`.

§2 and §3 are reproduced below **verbatim**, per §13.3: a pointer alone gets
skipped. They are sliced out of `SYSTEM.md` by a script, not retyped. Read
§2A in `SYSTEM.md` too — it sits between them and is load-bearing.

**This session never edits `SYSTEM.md` or `DECISIONS.md`** (§13.6). Code
sessions audit, object and report; findings go back to the planning chat,
which is the only writer. Run `python3 check-refs.py SYSTEM.md` before
committing.

**Sean is not a coder** (§4). Explain what a change does in plain terms and
get a yes before making it (§13.4). Do not assume he can review a diff. A
correction from him is a spec change, not a complaint.

**Before any diagnostic that writes to production, establish that no
read-only proof exists** (§7 practices). If you must write, say so first. If
the only way to clean up is the thing being tested, do not run it and accept
not knowing.

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

## This app: Capture

The stateless capture-parsing service (§10). Free text and a target schema go
in over HTTP; candidate structured items come out. **It stores nothing, writes
to no app, and holds no credential for any app.** The calling app has already
saved the raw capture before it calls, so nothing here is on the path between
Sean and his own words.

- **Live:** `capture-three-lyart.vercel.app` · **Repo:** `github.com/seanscol/capture`
- **Deployed 2026-09-04 with the acceptance test NOT fully passing**, on Sean's
  explicit decision after being shown the measurements (§13.4). Do not let
  this read as a green test later — it is not one, and §7(j) is the family
  where documentation records a fix that was never made. `MODEL-EVIDENCE.md`
  has the figures and the three remaining failures. What is deployed and what
  is not is status: read `~/Projects/ecosystem/NEXT-STEPS.md`, never this
  file.
- **Stack:** TypeScript on Vercel, no framework. One endpoint. Deliberately
  frameworkless: §10 wants an answer "within a second or two" and a framework
  would spend that budget on cold starts before reading the request.
- **Tests:** `npm test` runs everything that is free — auth ordering, the
  §2.2 contract, the schema check — and ends by printing that the acceptance
  test did **not** run. `npm run test:acceptance` runs the §10 dictation
  against the real model and **costs money**. An unrun test is not a green
  one (§2.1), which is why the free suite says so out loud.
- **Day arithmetic:** none, and that is deliberate. Deadline phrases are
  returned exactly as spoken — `"today"`, `"this evening"`, `"within ten
  days"` — and the calling app resolves them through its own `app-time`
  (§5.1). Resolving a date here would put a second implementation of the
  05:00 boundary in the ecosystem, which is bug family (f) by construction.
  **If anything in `src/` ever needs to know what day it is, that is the
  moment to stop and re-read §5.1.**
- **Storage:** none. There is no adapter, no `DATA_DIR`, no key prefix,
  because there is nothing to store. A capture passes through memory and is
  gone. This is the property that makes §5.5 need no exception for it.
- **Auth:** `src/handler.ts`. `CAPTURE_TOKEN` gates the one endpoint as a
  Bearer token, compared as a digest so neither length nor content leaks
  through timing. It is checked **before the body is read and before the
  model is called** — `tests/auth.test.ts` holds that order in place by
  counting model calls, not by reading status codes.

  **It fails CLOSED, and the difference from FND is deliberate.** FND's
  `proxy.ts` fails open when `API_TOKEN` is unset so a typo cannot lock him
  out of logging mid-relapse (§5.6). That reasoning inverts here: nothing
  medical depends on this service, the calling app falls back to its own
  parser, and what an unset variable would open is a metered API key. An
  unset variable is absence of data, which is never a grant of permission
  (§2.1). **Which tokens are actually set in production is status: read
  `~/Projects/ecosystem/NEXT-STEPS.md`, never this file** — and read the
  environment list, not a status code (§7 practices).
- **The API key** lives in `ANTHROPIC_API_KEY`, read in `src/model.ts` and
  nowhere else. Never hardcoded, never printed, never in a response body, and
  never typed into a chat (§10): `.env.local`, Vercel env vars, and a
  password manager. `.env.local` is gitignored.
- **Model:** the smallest that passes the acceptance test, named in
  `src/model.ts` and echoed back in every response, so callers and tests read
  it rather than assume it (§5.8).

**Which rules bite hardest here.**

**§2.2 is the whole product.** This service exists because a rule-based
parser cannot handle real dictation, and the failure mode of replacing it
with a model is that a model will always produce *something*. So the answer
shape has a first-class place to say "I could not read this", and everything
the model returns is checked before it is passed on: an item with no
confidence, or quoting words that were never said, becomes a flagged verbatim
fragment rather than a plausible item. **If the shape had nowhere to put "I
do not know", the shape itself would force a guess.**

**§10 splits creations from mutations by risk class.** Anything touching an
existing record must name that record and wait for explicit confirmation —
always, not only when confidence is low. They are separate lists in the
response so the distinction cannot be lost by accident downstream.

**§2.4: the parse is system work and scores zero.** Nothing here emits
scoring information, because the service does not know what scoring is. That
rule lands on the *calling* app, and this file is not where it is enforced.

**§2.7 does not apply and must not be made to.** This service says nothing
about Sean's body, and the way to keep that true is that it says nothing
about any domain at all: it is generic, and knows nothing about tasks or
bands (§10). `tests/contract.test.ts` asserts the prompt it builds carries no
domain vocabulary. Domain words belong in the caller's schema, which the
caller wrote.

<!-- END:ecosystem-spec v2.3 -->
