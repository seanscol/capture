/**
 * The schema check. Free to run.
 *
 * Its job is to catch what a model actually gets wrong — a missing required
 * field, an invented field, a string where a number was declared. It is not a
 * full validator and must never be described as one: a clean result means
 * "nothing detected", not "verified" (§2.1).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/schema.ts";
import { TASK_SCHEMA } from "./fixtures/dictation.ts";

test("an item that fits raises nothing", () => {
  assert.deepEqual(validate({ title: "Call Westcott" }, TASK_SCHEMA), []);
  assert.deepEqual(validate({ title: "Tax return", due: "this evening", urgent: true }, TASK_SCHEMA), []);
});

test("a missing required field is caught", () => {
  const problems = validate({ due: "today" }, TASK_SCHEMA);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /requires "title"/);
});

test("a field the caller never asked for is caught", () => {
  const problems = validate({ title: "x", project: "Home" }, TASK_SCHEMA);
  assert.match(problems.join(" "), /"project".*not a field/,
    "additionalProperties is false in this schema. An invented field is the " +
    "model answering a question the caller did not ask.");
});

test("a wrong type is caught", () => {
  assert.match(validate({ title: "x", urgent: "yes" }, TASK_SCHEMA).join(" "), /urgent should be/,
    'The string "yes" is not a boolean. A caller storing it would get a truthy ' +
    "value for every answer including \"no\".");
});

test("an enum violation is caught", () => {
  const schema = { type: "object", properties: { size: { enum: ["s", "m", "l"] } } };
  assert.match(validate({ size: "xl" }, schema).join(" "), /not one the schema allows/);
});

test("an integer satisfies number, but a float does not satisfy integer", () => {
  assert.deepEqual(validate(3, { type: "number" }), []);
  assert.deepEqual(validate(3, { type: "integer" }), []);
  assert.match(validate(3.5, { type: "integer" }).join(" "), /should be/);
});

test("a nullable field declared as a type list is allowed", () => {
  assert.deepEqual(validate(null, { type: ["string", "null"] }), []);
  assert.deepEqual(validate("x", { type: ["string", "null"] }), []);
});

test("what it cannot check, it stays quiet about", () => {
  assert.deepEqual(validate({ anything: 1 }, { $ref: "#/definitions/Thing" }), [],
    "It reports what it can prove wrong. Silence here means not checked, " +
    "never verified — the distinction §2.1 turns on.");
});
