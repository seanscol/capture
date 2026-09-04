# Which model, and what it actually does

§10 says the model is "chosen by passing the acceptance test — starting from
the smallest." This records what happened when that was done, because the
result inverts the assumption in the instruction: **escalating made it worse.**

Measured 2026-09-04 against `tests/acceptance.test.ts` — the §8 dictation.
Each run is a fresh parse; the model is non-deterministic, so single runs
prove nothing and every figure below is over repeated runs.

| Model | Fully clean runs | Assertions passed | Typical latency | Cost per parse |
|---|---|---|---|---|
| `claude-haiku-4-5` | 2 of 5 | 55 of 65 | ~4.9s | ~$0.005 |
| `claude-sonnet-5` | 0 of 3 | ~25 of 39 | ~6.2s | ~$0.02 |
| `claude-opus-5` (effort low) | 0 of 3 | 30 of 39 | ~6.2s | ~$0.05 |

**Haiku is the best of the three on every axis**: fastest, cheapest, and the
only one observed to pass everything. Sonnet lost the payee in two runs of
three and kept a task the speaker had cancelled out loud. Opus was
*consistent* rather than accurate — the same three failures every run.

**The acceptance test does not pass reliably.**

**Deployed anyway on 2026-09-04** to `https://capture-three-lyart.vercel.app`, on Sean's explicit decision
after being shown these figures and the four rule breaks: *"deploy, um, all
the rule breaks are all fine with me. I don't mind the latency at all. And
given that I can review the way it's been passed, then I'm not too worried."*
Recorded here because a deployment that happened despite a failing test must
not later look like one that happened because the test passed (§7(j)).

Verified live, not inferred (§7 practices): an unauthenticated POST returns
**this service's** 401 — `content-type: application/json`, body
`{"error":"Unauthorized."}` — not Vercel's Deployment Protection page, which
returns 401 too and would have looked identical from the status code alone. A
correct token returns 200 with a real parse, which is what proves protection
is off rather than masking everything. The 401 body says "Unauthorized"
rather than "not configured with a token", which is positive evidence that
`CAPTURE_TOKEN` is set in production — read from the response, and confirmed
against `vercel env ls`.

A shorter, ordinary capture — one creation and one cancellation — returned in
**2038ms**. The ~4.6s figure below is the six-item dictation, which is the
hardest input this service has, not a typical one.

## After the coverage check

`src/coverage.ts` was added to catch failure 3 below in code rather than by
asking the model more nicely. Re-measured over five runs on Haiku, against a
test that now has one more assertion in it:

| | |
|---|---|
| Fully clean runs | 1 of 5 |
| **Silent-loss failures** | **0 of 5** |
| Typical latency | ~4.6s |

The model still dropped the cancellation instruction in one of those runs.
The difference is that it now comes back in `unaccounted`, in Sean's own
words, instead of not coming back at all.

So the failures that remain are all the **visible** kind — they arrive in the
confirm queue where he sees them before anything is written. That is not the
same as the test passing, and the test still says so.

## The three failures that remain, and they are not equal

Two of them are visible to Sean and one is not, which is the distinction that
matters more than the count.

**1. A deadline invented for "call Westcott"** — seen in 3 of 5 runs. He gave
that one no deadline. It sits between two dated items, and the model borrows
from a neighbour. A §2.2 failure, but it lands in the confirm queue where he
sees it.

**2. "next week" attached to the physio items** — seen in 3 of 5. Also
visible in the queue.

Worth recording: **all three models lean towards attaching "next week"** to
the physio work, and Opus does it every single time. The ground truth here is
Sean's own reading — the spoken "No" retracted "next week" along with "find a
physio", corroborated by his count of three deadlines (§2.3, manual override
wins). But the models agreeing against it suggests his reading is the
minority one for that construction, and that is worth him knowing rather than
being quietly engineered around.

**3. The cancellation instruction disappears entirely** — seen in 2 of 5. Not
created, not modified, not flagged: gone. **This is the serious one**, and it
is a different kind of failure from the other two. §10 sends creations to a
confirm queue and requires modifications to name their record, so a wrong
deadline is friction he can see and correct. An item that never arrives
appears nowhere, and the absence reads as "he didn't say that" — §2.1
exactly, and bug family (a).

## What was tried on the prompt, and what it cost

Five changes, each fixing one failure and some introducing another. Recorded
because the pattern is the finding:

- Listing "or" as a cancelling word made the model keep the half of a
  sentence the speaker had corrected *away from*, and strip the payee.
- A rule telling it to drop details attached to retracted words made it drop
  a real person's name.
- Adding rules until there were eight of them made it lose the cancellation
  instruction altogether. Compressing them back fixed the latency and some of
  the reliability.
- The sharpest single rule found: *never attach a detail to an item the
  speaker did not say it about* — most errors are a real detail on the wrong
  item, not an invented one.

**The methodological limit, stated plainly: there is one test paragraph.**
Every change above was tuned against it, which is how a prompt comes to pass
one dictation and generalise to none. A second and third real dictation are
needed before any of this can be called reliable — and they cannot be
invented here, because a made-up paragraph would carry the same assumptions
the prompt already has (bug family (c)).
