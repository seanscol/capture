#!/usr/bin/env python3
"""PreToolUse on Edit|Write — §13.6, one writer to the spec files.

Code sessions audit, object and report; they never edit the spec files. A code
chat editing SYSTEM.md is what produced the v2.1/v2.2 fork the current file's
header still has to reconcile.

Which files those are is defined once, in _spec.py, and imported. This hook
used to keep its own set of two names, block-prod-writes.py its own regex of
the same two, and _spec.py its own literal for discovery — so when §4A made
operating-notes.md part of the spec, three lists each had to be remembered and
none of them was.

The match is on the path, not the basename. The old test was
`Path(path).name in PROTECTED`, which blocked writing any file called
SYSTEM.md anywhere on the disk, including a throwaway fixture in a temp
directory — enforcement matching coarser than the rule it enforces, which is
the same shape as a check that reports every day: it gets worked around.

Exit 2 blocks the call and returns stderr to the model. PreToolUse hooks run
before any permission check, so this holds even under
--dangerously-skip-permissions: no session can reason its way past it.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    import _spec
except Exception as exc:  # noqa: BLE001 — any import failure, not just ImportError
    _spec, import_failure = None, exc

try:
    payload = json.load(sys.stdin)
except (json.JSONDecodeError, ValueError):
    sys.exit(0)  # Not our business; never break the session on a malformed payload.

path = payload.get("tool_input", {}).get("file_path", "")

if _spec is None:
    # The list of protected files lives in _spec.py and this hook does not get
    # to keep a second copy of it — a duplicate that goes stale under-blocks,
    # and under-blocking is the failure this whole hook exists to prevent. So
    # when the one definition cannot be read, the hook blocks and says why.
    #
    # Its own directory is exempt, because the fix is a file in it. Enforcement
    # that blocks its own remedy is the bug the Bash hook had on 2026-09-04,
    # where the only sanctioned way to install a new spec version was denied.
    hooks_dir = Path(__file__).resolve().parent
    try:
        editing_a_hook = Path(path).resolve().parent == hooks_dir if path else False
    except (OSError, ValueError):
        editing_a_hook = False
    if not editing_a_hook:
        sys.stderr.write(
            f"BLOCKED: {Path(__file__).name} could not import _spec.py, which is "
            f"where the protected-file list is defined.\n\n"
            f"    {type(import_failure).__name__}: {import_failure}\n\n"
            f"Without it this hook cannot tell a spec file from any other file, "
            f"and it will not guess. Guessing wrong in one direction lets a code "
            f"session edit SYSTEM.md (§13.6); guessing wrong in the other blocks "
            f"an ordinary edit. It blocks instead, everywhere except "
            f"{hooks_dir}, so that repairing _spec.py is still possible.\n\n"
            f"Fix _spec.py and this stops.\n"
        )
        sys.exit(2)
    sys.exit(0)

# Both halves are required: the right name, in a place where the rule applies.
if Path(path).name in _spec.PROTECTED and _spec.under_projects(path):
    name = Path(path).name
    others = " · ".join(sorted(_spec.PROTECTED - {name}))
    sys.stderr.write(
        f"BLOCKED by §13.6 (one writer to the spec files): this session may not "
        f"edit {name}.\n\n"
        f"Code sessions audit, object and report — they do not edit {name}, and "
        f"the same holds for {others}. Report the finding to the planning chat, "
        f"which is the only writer and copies the result out to every repo in "
        f"one pass.\n\n"
        f"The reason is on the record: a code chat edited SYSTEM.md and produced "
        f"the v2.1/v2.2 fork that file's header still has to reconcile.\n\n"
        f"This blocks the file, not the name. A file called {name} outside "
        f"~/Projects — a test fixture, a scratch copy — is not a spec file and "
        f"is not blocked.\n"
    )
    sys.exit(2)
sys.exit(0)
