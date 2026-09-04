/**
 * Generates a caller token and appends it to .env.local.
 *
 * It is deliberately not printed. §10: "The key is never typed into a chat."
 * The same goes for the token that guards the key — open .env.local and copy
 * it into the password manager from there.
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";

let existing = "";
try { existing = readFileSync(".env.local", "utf8"); } catch { /* first run */ }

if (/^\s*CAPTURE_TOKEN\s*=\s*\S/m.test(existing)) {
  console.log("CAPTURE_TOKEN is already set in .env.local. Not touching it.");
  process.exit(0);
}

appendFileSync(".env.local", `${existing.endsWith("\n") || !existing ? "" : "\n"}CAPTURE_TOKEN=${randomBytes(32).toString("hex")}\n`);
console.log("A CAPTURE_TOKEN was written to .env.local. It was not printed here.");
console.log("Open the file to copy it into your password manager.");
