/**
 * Auth is checked BEFORE the model is called.
 *
 * "This endpoint costs money when called; it must never be open." §10:
 * "It authenticates its callers with a bearer token checked *before* the
 * model is called: it is the one component where being called costs money."
 *
 * A 401 alone does not prove that. The response could be correct while the
 * model was called anyway and the answer thrown away — the bill would still
 * arrive. So every case below asserts the 401 AND that the model recorder
 * shows zero calls.
 *
 * That is a read-only proof, per §7 practices: it establishes the absence of
 * a call positively, by counting, rather than inferring it from a status
 * code. §5.6 records what inferring costs — "a 400 rather than a 401 proved
 * nothing. Bug family (c): the instrument shared the assumption."
 *
 * Free to run. Nothing here reaches the network.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/handler.ts";
import { recordingModel } from "./helpers/recording-model.ts";
import { TASK_SCHEMA } from "./fixtures/dictation.ts";

const TOKEN = "test-token-not-a-real-secret";
const body = JSON.stringify({ text: "buy milk", schema: TASK_SCHEMA });

const req = (over: Partial<Parameters<typeof handle>[0]> = {}) => ({
  method: "POST",
  headers: {} as Record<string, string | undefined>,
  body,
  ...over,
});

/** Runs one request and reports both halves of the proof. */
async function attempt(over: Parameters<typeof req>[0], token: string | undefined = TOKEN) {
  const model = recordingModel();
  const res = await handle(req(over), { model, token });
  return { res, calls: model.calls };
}

const NEVER_CALLED = "The request was rejected, but the model was called anyway. " +
  "The rejection is free; the call is not. This is the one endpoint where " +
  "being called costs money (§10).";

test("no Authorization header: 401, and the model is never called", async () => {
  const { res, calls } = await attempt({});
  assert.equal(res.status, 401);
  assert.equal(calls, 0, NEVER_CALLED);
});

test("wrong token: 401, and the model is never called", async () => {
  const { res, calls } = await attempt({ headers: { authorization: "Bearer wrong" } });
  assert.equal(res.status, 401);
  assert.equal(calls, 0, NEVER_CALLED);
});

test("a token that is a prefix of the real one is still wrong", async () => {
  const { res, calls } = await attempt({
    headers: { authorization: `Bearer ${TOKEN.slice(0, -1)}` },
  });
  assert.equal(res.status, 401, "A near-miss must not pass.");
  assert.equal(calls, 0, NEVER_CALLED);
});

test("the right token: 200, and the model is called exactly once", async () => {
  const { res, calls } = await attempt({ headers: { authorization: `Bearer ${TOKEN}` } });
  assert.equal(res.status, 200);
  assert.equal(calls, 1, "One request, one model call. More than one is money.");
});

test("CAPTURE_TOKEN unset: 401 — this endpoint fails CLOSED", async () => {
  const model = recordingModel();
  const res = await handle(req({ headers: { authorization: `Bearer ${TOKEN}` } }), {
    model,
    token: undefined,
  });
  assert.equal(res.status, 401,
    "FND's proxy.ts fails OPEN when API_TOKEN is unset, deliberately, so a " +
    "typo cannot lock Sean out of logging mid-relapse (§5.6). That reasoning " +
    "does not transfer here and inverts. Nothing medical depends on this " +
    "service — the calling app has already stored the raw capture and falls " +
    "back to its own parser (§10). What an unset token opens here is a " +
    "metered API key. And an unset variable is absence of data, which is " +
    "never good news and never a grant of permission (§2.1): upward is " +
    "earned. So it fails closed, and the difference from FND is deliberate.");
  assert.equal(model.calls, 0, NEVER_CALLED);
});

test("an empty CAPTURE_TOKEN is not a token", async () => {
  const model = recordingModel();
  const res = await handle(req({ headers: { authorization: "Bearer " } }), { model, token: "" });
  assert.equal(res.status, 401,
    "An empty string is what a mis-set Vercel env var looks like. It must " +
    "not authenticate an empty Bearer header into a match.");
  assert.equal(model.calls, 0, NEVER_CALLED);
});

test("auth is checked before the body is even read", async () => {
  const { res, calls } = await attempt({ body: "{ this is not json" }, TOKEN);
  assert.equal(res.status, 401,
    "No credential and a malformed body. A 400 here would prove the body was " +
    "parsed first — the check would still be in the wrong order, and only " +
    "the accident of a bad body would have stopped the spend.");
  assert.equal(calls, 0, NEVER_CALLED);
});

test("GET is not this endpoint: 405, and the model is never called", async () => {
  const { res, calls } = await attempt({
    method: "GET",
    headers: { authorization: `Bearer ${TOKEN}` },
  });
  assert.equal(res.status, 405);
  assert.equal(calls, 0, NEVER_CALLED);
});

test("an oversized body is refused before the model, even with a valid token", async () => {
  const { res, calls } = await attempt({
    headers: { authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ text: "x".repeat(200_000), schema: TASK_SCHEMA }),
  });
  assert.equal(res.status, 413,
    "Input length is the bill. A valid token is authorisation to parse a " +
    "capture, not to send an unbounded prompt.");
  assert.equal(calls, 0, NEVER_CALLED);
});

test("a valid token with no text does not reach the model", async () => {
  for (const bad of [{}, { text: "" }, { text: "   " }, { text: "hi" }]) {
    const model = recordingModel();
    const res = await handle(
      req({ headers: { authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ ...bad, schema: TASK_SCHEMA }) }),
      { model, token: TOKEN }
    );
    assert.equal(res.status, 400, `should refuse: ${JSON.stringify(bad)}`);
    assert.equal(model.calls, 0, NEVER_CALLED);
  }
});

test("a request with no schema does not reach the model", async () => {
  const { res, calls } = await attempt({
    headers: { authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ text: "buy milk" }),
  });
  assert.equal(res.status, 400,
    "§10: the service 'receives the schema with the request; knows nothing " +
    "about tasks or bands'. With no schema there is nothing to parse into, " +
    "and a default schema invented here would be this service knowing about " +
    "tasks.");
  assert.equal(calls, 0, NEVER_CALLED);
});
