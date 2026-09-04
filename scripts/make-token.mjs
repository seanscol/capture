/**
 * Generates the caller token and puts it in .env.local.
 *
 * It is deliberately not printed. §10: "The key is never typed into a chat."
 * The same goes for the token guarding the key — open .env.local and copy it
 * into the password manager from there.
 *
 * Two slips already caught here, both worth keeping in mind because both
 * failed by looking like success:
 *
 *   `\s` matches newlines, so testing for `CAPTURE_TOKEN\s*=\s*\S` reached
 *   across a blank line and matched the `#` of the following comment. It
 *   reported the token as already set when the line was empty.
 *
 *   Appending a second CAPTURE_TOKEN line left the empty placeholder above
 *   it, and the loader takes the first occurrence — so the file looked
 *   correct, contained a real token, and authenticated nobody.
 *
 * Both are bug family (a): a success message for something that did not
 * happen. Hence `verify()` at the end, which reads the file back rather than
 * trusting that the write did what it said.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const FILE = ".env.local";
const SET = /^[ \t]*CAPTURE_TOKEN[ \t]*=[ \t]*(\S+)[ \t]*$/m;
const EMPTY = /^[ \t]*CAPTURE_TOKEN[ \t]*=[ \t]*$/m;

let existing = "";
try {
  existing = readFileSync(FILE, "utf8");
} catch {
  console.error(`${FILE} does not exist. Run:  cp .env.local.example ${FILE}`);
  process.exit(1);
}

if (SET.test(existing)) {
  console.log(`CAPTURE_TOKEN is already set in ${FILE}. Not touching it.`);
  process.exit(0);
}

const token = randomBytes(32).toString("hex");
const line = `CAPTURE_TOKEN=${token}`;

const updated = EMPTY.test(existing)
  ? existing.replace(EMPTY, line)
  : existing + (existing.endsWith("\n") || !existing ? "" : "\n") + line + "\n";

writeFileSync(FILE, updated);

// Read it back. A write that reports success is not a write that happened.
const after = readFileSync(FILE, "utf8");
const lines = after.split("\n").filter((l) => /^[ \t]*CAPTURE_TOKEN[ \t]*=/.test(l));
if (lines.length !== 1 || !SET.test(after)) {
  console.error(`Something is wrong with CAPTURE_TOKEN in ${FILE}: expected one line with a value, found ${lines.length}. Open the file and fix it by hand.`);
  process.exit(1);
}

console.log(`A CAPTURE_TOKEN was written to ${FILE}. It was not printed here.`);
console.log("Open the file to copy it into your password manager.");
