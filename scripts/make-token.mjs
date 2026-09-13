/**
 * Generates a secret for ONE calling app and puts it in .env.local:
 *
 *     npm run make-token -- fnd        ->  CAPTURE_TOKEN_FND=<new secret>
 *
 * Each caller has its own secret (src/callers.ts), so this takes the caller's
 * name and never writes the bare shared CAPTURE_TOKEN — that is the thing
 * being retired. Revoking an app is deleting its CAPTURE_TOKEN_<NAME> from the
 * service's Vercel environment and redeploying; re-issuing is this, then
 * setting the new value as that app's own CAPTURE_TOKEN.
 *
 * The secret is deliberately not printed. §10: "The key is never typed into a
 * chat." Open .env.local and copy it into the password manager from there.
 *
 * Two slips have already been caught in this file, both of which reported
 * success at something that had not happened: a `\s` matching across a blank
 * line, and a second entry appended below an empty placeholder that the loader
 * then read first. Hence the read-back at the end.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const FILE = ".env.local";
const name = (process.argv[2] ?? "").trim().toUpperCase();

if (!/^[A-Z0-9]+$/.test(name)) {
  console.error("Name the calling app:  npm run make-token -- fnd");
  process.exit(1);
}

const key = `CAPTURE_TOKEN_${name}`;
const SET = new RegExp(`^[ \\t]*${key}[ \\t]*=[ \\t]*(\\S+)[ \\t]*$`, "m");
const ANY = new RegExp(`^[ \\t]*${key}[ \\t]*=`, "m");

let existing = "";
try {
  existing = readFileSync(FILE, "utf8");
} catch {
  console.error(`${FILE} does not exist. Run:  cp .env.local.example ${FILE}`);
  process.exit(1);
}

if (SET.test(existing)) {
  console.log(`${key} is already set in ${FILE}. Not touching it.`);
  process.exit(0);
}

const line = `${key}=${randomBytes(32).toString("hex")}`;
const updated = ANY.test(existing)
  ? existing.replace(new RegExp(`^[ \\t]*${key}[ \\t]*=.*$`, "m"), line)
  : existing + (existing.endsWith("\n") || !existing ? "" : "\n") + line + "\n";
writeFileSync(FILE, updated);

const after = readFileSync(FILE, "utf8");
const count = after.split("\n").filter((l) => ANY.test(l)).length;
if (count !== 1 || !SET.test(after)) {
  console.error(`Something is wrong with ${key} in ${FILE}: expected one line with a value, found ${count}. Fix it by hand.`);
  process.exit(1);
}
console.log(`${key} was written to ${FILE}. It was not printed here.`);
