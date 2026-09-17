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

> **MOVED 2026-09-08, deliberately — the first amendment to §2 itself, made
> by the only person who can.** `[SEAN]` The synthesis prohibition is lifted
> for the **global app's physical-record layer** (§13.7 step 5): it may
> notice and suggest patterns across
> FND, routine, nutrition, Fitbit and blood-test data — correlations
> included. His reasoning: false correlations are his to discern (§2.3,
> manual override always wins), and noticing things he isn't aware of is the
> app's point. The counter-case — many-comparison noise, and §2.7's own
> *"it only needs to be believed"* — was put in full and is recorded at
> DECISIONS 3.3; he decided with it in front of him.
>
> **Extended 2026-09-08** `[SEAN]`: sanctioned sources become six — FND,
> routine, nutrition, Fitbit, blood tests, and **phase history**, which may
> be correlated with the other five. And one named chart: **observed manic
> episode-days counted by day of year** — an instrument he has kept by hand
> for ten years to anticipate episodes and prepare. **Correction, 2026-09-17:
> v3.5 cited `operating-notes.md` item 5 as specifying a "mania chart". It
> does not. The word "mania" does not appear in that file at all — the
> citation was fabricated by the planning chat and put to Sean as evidence
> that his own archive had already asked for this. Bug family (q), committed
> by the chat that wrote (q), in quotation marks, in a decision touching
> bipolar disorder. The decision stands on his direct statement and on
> nothing else; it is worth re-examining without the invented support.** Constraints are part of the grant:
> episode count printed on the chart, **no date highlighted as due, no
> fitted periodicity drawn, no month coloured as safe**, hypomanic episodes
> a separate series off by default. **The chart drives nothing** — sets no
> floor, changes what no app expects, feeds no capacity response; that is
> D3, still deferred. The sparse-data caveat (rare events over 366 buckets
> cluster by chance, and a chart is most persuasive exactly where a belief
> already exists) was put to Sean directly and accepted: *"Yes to chart."*
> The cheap error is preparing for a September that was noise; the
> expensive one it guards against is the reverse.
>
> **Extended again 2026-09-16** `[SEAN]`, on the global session's question,
> asked before building rather than after: **the amendment covers a daily
> model-written synthesis, not only the deterministic physical-record layer.**
> The constraints already agreed are the terms of the grant, not commentary on
> it — every observation labelled a suggestion, citing the data it came from,
> printing its n; at most one a day and none if nothing clears the bar; one
> weekly digest that says nothing when it has nothing; facts and not verdicts;
> dismissals durable. The alternative considered and rejected was a templated
> synthesis assembled from rules, which is reliable and cannot say *"you've
> mentioned climbing eleven times and there's a gym five minutes away"* — the
> thing the layer exists for.
>
> **What survives, unmoved: FND is the sole authority on present capacity.**
> Nothing computes a rival verdict on how much he can do today, nothing
> modifies or reweights FND's numbers, and §2.6 stands — noticing a past
> pattern is not forecasting. Every suggestion is labelled as a suggestion
> and cites the data it came from.

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
- **Auth:** `src/handler.ts` and `src/callers.ts`. **One secret per calling
  app**, named on the service side — `CAPTURE_TOKEN_FND`, `CAPTURE_TOKEN_ADHD` —
  and discovered by that prefix, so adding or revoking an app is configuration,
  never code. Each app sends its own value from its own `CAPTURE_TOKEN`.
  Compared as digests against **every** configured secret with no early exit,
  and a value configured for more than one app is refused for all of them — a
  revocation that silently fails to revoke is the failure being prevented.
  Checked **before the body is read and before the model is called** —
  `tests/auth.test.ts` and `tests/callers.test.ts` hold that order by counting
  model calls, not by reading status codes. **Which apps currently hold a secret
  is status: read `vercel env ls`, never this file.**

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

<!-- shared:planning-inbox -->
### Reporting to the planning chat

Write this session's update for the planning chat to
`~/Projects/ecosystem/inbox/<this repo>.md`, **overwriting the file, never
appending.** Several sessions appending to one file at once lose updates
silently and there is no way to tell afterwards; one file per repo cannot race,
and its worst case is a stale section, which the collector labels with its age.

It is this repo's **current position**, not a log: decisions Sean made, findings
the planning chat should hold, and what happens next here. History belongs in
the git log and in `DECISIONS.md`.

Write it as you go rather than at the end. A session that stops without writing
it has lost what it found, and between uploads these files exist nowhere else —
which is why `inbox/` is in the backup.

`~/bin/collect-planning-inbox.sh` concatenates every repo's file into
`~/Projects/ecosystem/planning-inbox.md` for Sean to upload in one piece, and
names the repos that wrote nothing, because "no news" and "nobody wrote" look
identical in a file that shows only what exists.

This block is copied into every repo by `~/bin/sync-shared-files.sh` from
`ecosystem/shared/blocks/planning-inbox.md`. Change it there, not here: an edit
here is drift, and the script will replace it.
<!-- /shared:planning-inbox -->

<!-- shared:no-api-is-not-no-access -->
### No official API is not the same as no access

`[SEAN 2026-09-12]`, in his words:

No official API does not mean no access. Before concluding a source is
unavailable, ask Sean whether he can see it logged in — in a browser, in the
app, or via an export tool like Google Takeout or Apple's privacy portal. He has
credentials and a browser; you have neither. The Apple Podcasts saved-episodes
list was declared impossible and turned out to be visible in Chrome while logged
in.

This block is copied into every repo by `~/bin/sync-shared-files.sh` from
`ecosystem/shared/blocks/no-api-is-not-no-access.md`. Change it there, not here:
an edit here is drift, and the script will replace it.
<!-- /shared:no-api-is-not-no-access -->

<!-- shared:medication-stays-out -->
### Medication stays out

`[SEAN 2026-09-13]`, in his words: *"my medication is a clinical matter between
me and my psychiatrist. Nothing here optimises for it, and the mania chart still
drives nothing."*

Its scope, also his: it covers his medication, the clinical matter between him
and his psychiatrist, and *"all other drugs are not covered by this."*

Reading, not his words: no app records doses, timing or adherence of that
medication, and no chart, correlation, cue or suggestion takes it as an input.
Ask him before anything touches it.

This block is copied into every repo by `~/bin/sync-shared-files.sh` from
`ecosystem/shared/blocks/medication-stays-out.md`. Change it there, not here:
an edit here is drift, and the script will replace it.
<!-- /shared:medication-stays-out -->

<!-- shared:load-is-clinical -->
### Taking load off his brain is a clinical requirement

`[SEAN 2026-09-13]`, in his words: *"Taking load off my brain is a clinical
requirement, not a preference — my neuropsychiatrist describes freeing up
processing capacity as part of FND recovery. Every feature either removes load
or adds it. Anything that needs me to check, triage or remember is on the wrong
side, however useful it looks."*

And: *"I have an ADHD brain and I'm building a normal one. I can't single out
individual things from a mass, can't prioritise among many important things,
can't do one thing at a time when everything is present, and lose track of
practical things. Any feature that hands me a list to triage has failed."*

Reading, not his words: every plan answers *"does this remove load or add it?"*
before anything is built, and names what it would ask him to check, triage or
remember. The same test applies to how a session reports to him: one
recommendation rather than a menu of options, and one decision at a time.

This block is copied into every repo by `~/bin/sync-shared-files.sh` from
`ecosystem/shared/blocks/load-is-clinical.md`. Change it there, not here:
an edit here is drift, and the script will replace it.
<!-- /shared:load-is-clinical -->

<!-- shared:sessions-are-sandboxed -->
### Sessions run in a sandbox — a refusal is deliberate

`[SEAN 2026-09-16]` Claude Code runs under managed settings on his Mac
(`/Library/Application Support/ClaudeCode/managed-settings.json`). The source and
the full reasoning are in `~/Projects/ecosystem/machine-sandbox.md`. A repo's own
settings cannot undo it. It applies to the commands a session runs, never to
Sean's own Terminal, and only to sessions started after it was installed — so a
session that can still reach a blocked path needs restarting, not debugging.

**If one of these is refused, do not debug it and do not route around it:**

- **Credentials:** the Vercel CLI login, `~/.config/app-backup`,
  `~/.config/media-app`, `~/.config/routine`. So `vercel` fails inside a session,
  and so do media's and routine's scripts that read `~/.config`. Propose the exact
  line for the Terminal tool, which asks Sean each time, or ask him to run it.
  `vercel env ls` output is safe to share: values print as `Hidden`.
- **Transcripts:** `~/.claude/projects/**/*.jsonl`, cross-session searches
  included. Memory files and saved tool outputs still read.
- **Writes outside `~/Projects`, `~/bin` and `~/.npm`**, and writes to this
  repo's own `.claude/` settings and hooks. Another repo's hooks stay writable, so
  a changed copy of a shared hook is caught by the drift test, not prevented.
- **Network, domain by domain.** `git fetch` and `git push` to github.com have
  been refused with `CONNECT tunnel failed, response 403` beside a sandbox note
  that the host "is not on the allow list". That is the sandbox, not GitHub:
  GitHub's own refusal reads `Write access to repository not granted`. Ask Sean
  to push from his Terminal.

**`$TMPDIR` is one folder shared by every session.** Never write a fixed name
there. Routine's and the task app's sessions wrote a backup under the same name at
the same moment, and routine's storage file was briefly replaced by the task
app's. Use your session's scratchpad or a folder made with
`mktemp -d "$TMPDIR/<repo>.XXXXXX"`, and check any file restored from a temporary
copy against git before trusting it (`git diff -- <file>` shows what the restore
changed).

**Four refusals that look like bugs** (found 2026-09-16):

- **`npx tsx` — so `npm test` in every repo — fails** with
  `listen EPERM … tsx-<uid>/<pid>.pipe`: the tsx command opens a local socket the
  sandbox refuses. `node --import tsx --test tests/*.test.ts` runs the same tests
  without one; the same goes for a test that starts `npx tsx` in a subprocess.
- **`mktemp` with no template** fails with `mkstemp failed on /var/folders/…:
  Operation not permitted`: without a template it ignores `$TMPDIR`. Always give
  it one, `mktemp "$TMPDIR/<name>.XXXXXX"`, and stop if it fails — a script that
  carried on used an empty path.
- **`diff <(…) <(…)`** fails with `/dev/fd/…: Operation not permitted`. Write each
  side to a file in a folder `mktemp -d` made, and diff the files.
- **`ERROR: failed to copy trust settings of system certificate`**, printed by
  npx commands, is noise: the command still runs. Read its exit code.

To check whether the sandbox is on, use the probe in `machine-sandbox.md`, never
by reading a credential. A check must be able to produce the failing answer.

This block is copied into every repo by `~/bin/sync-shared-files.sh` from
`ecosystem/shared/blocks/sessions-are-sandboxed.md`. Change it there, not here:
an edit here is drift, and the script will replace it.
<!-- /shared:sessions-are-sandboxed -->
