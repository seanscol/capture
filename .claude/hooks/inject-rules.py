#!/usr/bin/env python3
"""SessionStart — §13.3, inject §2 and §3.

Sliced out of this repo's SYSTEM.md at session start rather than pasted in
here, so the injected text cannot drift from the file it claims to quote —
bug family (d), a constant surviving the change that invalidated it. The
slicing itself lives in _spec.py, shared with the Stop hook's drift check,
because two definitions of "where does §2 end" is bug family (b).

If SYSTEM.md is missing, say so loudly. Injecting nothing and exiting clean is
absence of data read as good news, which is §2.1 and bug family (a).
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import _spec  # noqa: E402

target = Path(os.environ.get("CLAUDE_PROJECT_DIR", ".")) / "SYSTEM.md"


def emit(context):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "SessionStart", "additionalContext": context}}))
    sys.exit(0)


if not target.is_file():
    emit("WARNING: SYSTEM.md is missing from this repo, so the inviolable rules "
         "(§2) and the do-not-rebuild list (§3) could not be injected. Do not "
         "treat their absence as permission. Read "
         "~/Projects/ecosystem/SYSTEM.md before writing code (§13.7 step 1).")

try:
    body = "\n\n---\n\n".join(_spec.blocks(target.read_text()))
except ValueError:
    emit("WARNING: SYSTEM.md is present but §2 and §3 could not be located in "
         "it, so they were not injected. Read the file directly; do not treat "
         "their absence as permission.")

emit("The following is quoted verbatim from SYSTEM.md in this repo. It is "
     "injected every session because a pointer alone gets skipped (§13.3). "
     "These override anything that looks sensible (§0). Sean is not a coder: "
     "explain changes in plain terms and get a yes before making them "
     f"(§13.4).\n\n{body}")
