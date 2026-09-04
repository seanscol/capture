#!/usr/bin/env python3
"""PreToolUse on Edit|Write — §13.6, one writer to the spec files.

Code sessions audit, object and report; they never edit SYSTEM.md or
DECISIONS.md. A code chat editing SYSTEM.md is what produced the v2.1/v2.2
fork the current file's header still has to reconcile.

Exit 2 blocks the call and returns stderr to the model. PreToolUse hooks run
before any permission check, so this holds even under
--dangerously-skip-permissions: no session can reason its way past it.
"""
import json, sys
from pathlib import Path

PROTECTED = {"SYSTEM.md", "DECISIONS.md"}

try:
    payload = json.load(sys.stdin)
except (json.JSONDecodeError, ValueError):
    sys.exit(0)  # Not our business; never break the session on a malformed payload.

path = payload.get("tool_input", {}).get("file_path", "")
if path and Path(path).name in PROTECTED:
    name = Path(path).name
    sys.stderr.write(
        f"BLOCKED by §13.6 (one writer to the spec files): this session may not "
        f"edit {name}.\n\n"
        f"Code sessions audit, object and report — they do not edit {name} or the "
        f"other spec file. Report the finding to the planning chat, which is the "
        f"only writer and copies the result out to every repo in one pass.\n\n"
        f"The reason is on the record: a code chat edited SYSTEM.md and produced "
        f"the v2.1/v2.2 fork that file's header still has to reconcile.\n"
    )
    sys.exit(2)
sys.exit(0)
