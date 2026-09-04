#!/usr/bin/env python3
"""Stop — §13.6 run check-refs.py, plus the drift checks §13.6 implies.

Three findings, one message:

  1. check-refs.py against this repo's SYSTEM.md.
  2. Every SYSTEM.md under ~/Projects agrees with the ecosystem copy.
  3. This repo's CLAUDE.md still carries §2 and §3 verbatim.

(2) and (3) exist because §13.7 step 1 created copies. §13.6 calls multiple
writers to multiple copies "not a risk, it is a schedule", and named the
weekly audit as the detector — which is [PROPOSED] and unbuilt. Until it is,
this is the only thing that would notice drift.

(3) is bug family (b) specifically: §13.3 puts the rules inline in CLAUDE.md,
§13.8 injects them live from SYSTEM.md, and a session reads both. If they ever
disagree, nothing else in the system would say so.

Reports; never blocks. Exit is always 0. A blocking Stop hook running a check
that can fail is a session you have to force-quit: check fails, session cannot
stop, session continues, check fails.

Silent when everything matches, per §13.8's own test — a checker that reports
every day gets ignored, and §4 says what happens to anything needing upkeep.
"""
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import _spec  # noqa: E402

root = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
findings = []


def digest(path):
    return hashlib.md5(path.read_bytes()).hexdigest()


def rel(path):
    """Shorten for display, without pretending a path outside ~ is inside it."""
    try:
        return "~/" + str(path.relative_to(Path.home()))
    except ValueError:
        return str(path)


# --- 1. references resolve -------------------------------------------------
script, target = root / "check-refs.py", root / "SYSTEM.md"

# Absence of data is never good news (§2.1). A missing checker is not a pass.
missing = [p.name for p in (script, target) if not p.exists()]
if missing:
    findings.append(
        f"check-refs did not run: {' and '.join(missing)} missing from this "
        f"repo (§13.7 step 1)."
    )
else:
    try:
        r = subprocess.run([sys.executable, str(script), str(target)],
                           capture_output=True, text=True, timeout=30, cwd=root)
        if r.returncode != 0:
            findings.append("check-refs.py found broken references in "
                            f"SYSTEM.md:\n\n{(r.stdout + r.stderr).strip()}")
    except (subprocess.SubprocessError, OSError) as e:
        findings.append(f"check-refs could not be run: {e}")

# --- 2. the copies agree ---------------------------------------------------
source = _spec.ECOSYSTEM / "SYSTEM.md"
if not source.is_file():
    findings.append(
        f"the ecosystem copy of SYSTEM.md is missing ({rel(source)}), so the "
        f"copies could not be compared. Absence is not agreement (§2.1)."
    )
else:
    want = digest(source)
    drifted = [p for p in _spec.spec_copies()
               if p != source and digest(p) != want]
    if drifted:
        findings.append(
            "SYSTEM.md copies have drifted from the ecosystem original:\n\n"
            + "\n".join(f"    {rel(p)}" for p in drifted)
            + f"\n\n  original: {rel(source)}\n\n"
            "  §13.6: the planning chat is the only writer, and copies the "
            "result out to every repo in one pass. A code session reports "
            "this; it does not reconcile it."
        )

# --- 3. CLAUDE.md still carries the rules ----------------------------------
claude_md = root / "CLAUDE.md"
if target.exists() and claude_md.is_file():
    try:
        want_blocks = _spec.blocks(target.read_text())
    except ValueError:
        findings.append("§2 or §3 could not be located in this repo's "
                        "SYSTEM.md, so CLAUDE.md could not be checked "
                        "against it.")
    else:
        have = claude_md.read_text()
        stale = [name for name, body in zip(("§2", "§3"), want_blocks)
                 if body not in have]
        if stale:
            findings.append(
                f"CLAUDE.md no longer carries {' and '.join(stale)} verbatim "
                "from SYSTEM.md.\n\n"
                "  §13.3 requires them inline; the SessionStart hook injects "
                "them live from SYSTEM.md. A session reads both, so a "
                "disagreement means one of the two is wrong and nothing else "
                "would say which (bug family (b))."
            )
elif target.exists() and not claude_md.is_file():
    findings.append("CLAUDE.md is missing from this repo (§13.3).")

# --- report ----------------------------------------------------------------
if findings:
    body = "\n\n".join(f"  {i}. {f}" for i, f in enumerate(findings, 1))
    print(json.dumps({"systemMessage":
        f"Spec check found {len(findings)} thing(s) to look at:\n\n{body}\n\n"
        "  This session does not fix these (§13.6) — report to the planning "
        "chat."}))

sys.exit(0)
