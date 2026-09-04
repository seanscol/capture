/**
 * Reads .env.local into process.env, for local runs only.
 *
 * Existing variables are never overwritten: on Vercel the platform sets them
 * and this file does not exist, so the same code path serves both without a
 * branch. Nothing here prints a value.
 */
import { readFileSync } from "node:fs";

export function loadEnvLocal(path = ".env.local"): void {
  let contents: string;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return; // Absent is normal in production. Not a finding.
  }

  for (const line of contents.split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.trim().replace(/^["'](.*)["']$/, "$1");
  }
}
