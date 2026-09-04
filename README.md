# capture

The stateless capture-parsing service — `SYSTEM.md` §10.

**Live:** `https://capture-three-lyart.vercel.app/api/parse` — POST only, Bearer token required.

**The acceptance test does not fully pass.** It was deployed anyway on
2026-09-04, by Sean, after being shown what fails and how often
(`MODEL-EVIDENCE.md`). Every remaining failure produces a candidate he sees in
the confirm queue before anything is written; the one failure he could not
see — an item vanishing silently — is caught in code by `src/coverage.ts`.

Free text and a target schema go in over HTTP. Candidate structured items come
out. **It stores nothing, writes to no app, and holds no credential for any
app.** The calling app has already saved the raw words before it calls, so
this service is never on the path between Sean and his own capture. If it is
slow or down, the app falls back to its own parser and says so.

---

## Setting it up — the part that needs you

**1. Create `.env.local`.** Copy the example:

```bash
cp .env.local.example .env.local
```

**2. Paste the Anthropic API key into it.** Open `.env.local` and put the key
after `ANTHROPIC_API_KEY=`, on the same line, with no quotes and no spaces.

The key comes from console.anthropic.com, on an account **separate from the
Max subscription** — a Claude subscription does not include the API (§13.5).
**Set a monthly spend limit while you are there.** This file is gitignored and
is never committed, printed, logged, or echoed in a response.

**3. Generate the caller token:**

```bash
npm run make-token
```

That writes a `CAPTURE_TOKEN` into `.env.local` without printing it. Open the
file to copy it into your password manager — it is what the task app will send
to prove it is allowed to call this. If it is unset, the service accepts
nothing and returns 401.

---

## Running the tests

```bash
npm test
```

Free. Nothing reaches the network. Covers the auth ordering, the §2.2
behaviour, and the schema check. It finishes by telling you that the
acceptance test did **not** run — a green suite here is not a passing
acceptance test, and absence of a run is never good news (§2.1).

```bash
npm run test:acceptance
```

**This costs money.** It sends the §10 dictation to the real model and checks
the parse. It is the test that chooses the model, and it prints which model
answered and how long it took.

---

## The endpoint

`POST /api/parse`, with `Authorization: Bearer <CAPTURE_TOKEN>`.

```jsonc
{
  "text": "the capture, verbatim",
  "schema": { /* JSON Schema for ONE item. Yours, not ours. */ },
  "existing": [ { "id": "t-101", "label": "Buy headphones" } ]  // optional
}
```

`existing` is how a change to something that already exists can name the
record it means. Without it, `target.id` is always `null`.

The answer:

```jsonc
{
  "model": "…",            // which model answered. Read it; never assume it.
  "created":  [ { "item": {…}, "confidence": 0.9, "source_text": "…" } ],
  "modified": [ { "target": { "id": "t-101", "described_as": "…" },
                  "intent": "cancel", "confidence": 0.8, "source_text": "…" } ],
  "unparsed": [ { "text": "…", "reason": "…" } ],
  "elapsed_ms": 900
}
```

**`created` and `modified` are separate because they are different risk
classes** (§10). Anything in `modified` touches a record that already exists
and needs explicit confirmation naming that record — **always**, not only when
confidence is low.

**`unparsed` is not an error list.** It is where the honest answer goes when
something could not be mapped, returned in the speaker's own words and flagged
(§2.2). A response can be a complete success and still have things in it.

`source_text` is quoted from the input, character for character. It is what
lets Sean check a candidate against what he actually said, which is the whole
reason the parse has to come back in a second or two rather than overnight.

### Status codes the caller should branch on

| | |
|---|---|
| `200` | Parsed. Look at all three lists. |
| `400` | The request was wrong — no text, no schema, or too short to hold anything. |
| `401` | No token, wrong token, or the service has no token configured. |
| `405` `413` | Not a POST; or the capture is too long. |
| `502` | The model was unreachable or broke. **Fall back and say so.** |

---

## Notes for whoever wires an app to this

Read `SYSTEM.md` §10 first, and `NEXT-STEPS.md` Step 5 for the order things
must happen in. Three that are easy to get wrong:

- **Store the raw capture first, synchronously, before calling this.** Capture
  must never block on the parse.
- **One dictation earns one capture event** however many items it yields, and
  the parse is system work that scores zero (§2.4). This service emits nothing
  about scoring because it does not know what scoring is — that rule lands in
  your app, not here.
- **Deadline phrases come back exactly as spoken** — `"today"`, `"this
  evening"`, `"within ten days"`. This service does no date arithmetic on
  purpose. Resolve them through your own `app-time` (§5.1); a second
  implementation of the 05:00 boundary is bug family (f) by construction.
