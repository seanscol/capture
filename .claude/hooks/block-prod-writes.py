#!/usr/bin/env python3
"""PreToolUse on Bash — §7 practices, and §13.6 through the side door.

Two things:

1. No production-write diagnostics against FND. A one-step walking bout was
   once written into the live record to prove writes were open; it counted in
   daily load and everything reading the API for about ninety seconds, and FND
   has no actor field, so there was no way to mark it as system work worth
   zero. A read-only proof existed and had already been run. The fix is a
   constraint, not more care.

2. Shell writes to the spec files. The Edit/Write hook guards the polite door.
   `cat >`, `sed -i`, `cp`, `tee` and `mv` all walk straight past it, and a
   rule enforced against one door only is a suggestion.

   With one exception, and the exception is the point. §13.6 says the planning
   chat "copies the result out to every repo in one pass" — but a chat cannot
   write to disk, so a code session runs that copy, and the first version of
   this hook blocked it. §13.7 step 1 became un-repeatable: v2.4 could not be
   installed the way v2.3 was. So a copy OUT of ~/Projects/ecosystem is
   allowed and a copy INTO it is not. The direction is the authority.

This does not stop an interpreter. python3 and node can still write these
files, and nothing short of filesystem permissions would change that. It
raises the cost of the accidental path; it does not make the file unwritable.
"""
import json
import re
import shlex
import sys
from pathlib import Path

FND_HOST = "fnd-tracker.vercel.app"

# Every app's own live host, read from the "**Live:**" line each repo's CLAUDE.md
# already carries, rather than listed here.
#
# [SEAN 2026-09-12] "The guard exists" was true of one repo in six. adhd-tasks
# made real production writes on 12 September — POST /api/review changing six
# tasks' areas, POST /api/nudge changing three cadences — with nothing stopping
# them, because this gated on FND's host alone. Reading the hosts from where
# each repo declares them means a new app is covered the moment it says it is
# live, and a repo that names no host yet (global, until it deploys) is visibly
# ungoverned in its own CLAUDE.md rather than invisibly ungoverned in here.
LIVE_LINE = re.compile(r"\*\*Live:\*\*\s*`([^`]+)`")


def live_hosts():
    """host -> the app it belongs to. FND is always in, whatever its file says."""
    hosts = {FND_HOST: "fnd-tracker"}
    for claude_md in sorted(_spec.PROJECTS.glob("*/CLAUDE.md")):
        found = LIVE_LINE.search(claude_md.read_text(encoding="utf-8", errors="ignore"))
        if not found:
            continue
        host = found.group(1).strip()
        # A repo with nothing deployed says so in that line, in the same place
        # a host would go. "none" is a declaration, not a hostname: treating it
        # as one would block every command containing the word.
        if host.lower() in ("none", "not deployed", "n/a"):
            continue
        hosts[host] = claude_md.parent.name
    return hosts

# Which files are spec files is defined once, in _spec.py. This hook used to
# spell them out in a regex of its own, so operating-notes.md — part of the
# spec under §4A — walked through the side door this hook exists to shut.
sys.path.insert(0, str(Path(__file__).parent))
try:
    import _spec
    SPECS = "(?:" + "|".join(re.escape(n) for n in sorted(_spec.PROTECTED)) + ")"
    ECOSYSTEM = _spec.ECOSYSTEM
except Exception:  # noqa: BLE001 — any import failure, not just ImportError
    # Degraded: guard a deliberately broader shape — any markdown file — rather
    # than keep a second copy of the list. A stale duplicate under-blocks and a
    # broad pattern over-blocks, and only one of those two errors is safe. The
    # §13.6 copy out of ecosystem stays allowed, so the remedy is still open.
    SPECS = r"[^\s/]*\.md"
    ECOSYSTEM = Path.home() / "Projects" / "ecosystem"

WRITE_METHOD = re.compile(
    r"-X\s*(?:POST|PUT|PATCH|DELETE)\b"
    r"|--request\s*(?:POST|PUT|PATCH|DELETE)\b"
    r"|\bmethod\s*[:=]\s*[\"']?(?:POST|PUT|PATCH|DELETE)\b",
    re.I,
)

# The gap between verb and filename must not cross a newline. It did once, and
# the first thing it blocked was a commit message describing the hook: prose
# mentioning `cp` on one line and the spec file twenty lines later matched as
# though it were a single command. A negated character class matches newlines
# even though `.` does not — bug family (c), the instrument sharing the bug's
# assumption, in the check meant to catch it.
GAP = r"[^|;&\n]*"

SPEC_WRITE = re.compile(
    rf">>?[ \t]*\S*{SPECS}"                   # > SYSTEM.md   >> SYSTEM.md
    rf"|\bsed\b{GAP}-i{GAP}{SPECS}"           # sed -i ... SYSTEM.md
    rf"|\b(?:cp|mv|rm|tee|truncate)\b{GAP}{SPECS}",
    re.I,
)

SEGMENT = re.compile(r"\|\||&&|[|;&\n]")


def resolve(token, cwd):
    """Absolute path for a shell token, expanding ~ and $HOME against cwd."""
    token = token.replace("$HOME", str(Path.home()))
    return (cwd / Path(token).expanduser()).resolve()


def under(path, directory):
    return path == directory or directory in path.parents


def sanctioned_copy(segment, cwd):
    """Is this the §13.6 copy — spec files OUT of ecosystem, into a repo?

    `cp` only. `mv` would remove the original and `rm` needs no argument about
    it. The destination is cp's last argument; everything before it is a
    source. Every source naming a spec file must come from ecosystem, and the
    destination must not be inside it — a copy back into ecosystem is a code
    session writing to the source of truth, which is the thing §13.6 forbids.
    """
    try:
        parts = shlex.split(segment)
    except ValueError:
        return False  # Unbalanced quotes: cannot reason about it, so don't.

    parts = [p for p in parts if p != "sudo"]
    if len(parts) < 3 or Path(parts[0]).name != "cp":
        return False

    args = [p for p in parts[1:] if not p.startswith("-")]
    if len(args) < 2:
        return False

    *sources, dest = args
    spec_sources = [s for s in sources if re.search(SPECS, Path(s).name, re.I)]
    if not spec_sources:
        return False

    if not all(under(resolve(s, cwd).parent, ECOSYSTEM) for s in spec_sources):
        return False
    return not under(resolve(dest, cwd), ECOSYSTEM)


try:
    payload = json.load(sys.stdin)
except (json.JSONDecodeError, ValueError):
    sys.exit(0)  # Never break the session on a malformed payload.

cmd = payload.get("tool_input", {}).get("command", "")
cwd = Path(payload.get("cwd") or ".")

hit = next(((host, app) for host, app in live_hosts().items() if host in cmd), None)
if hit and WRITE_METHOD.search(cmd):
    host, app = hit
    what = (
        f"a write against {host}, which is a live medical record"
        if host == FND_HOST
        else f"a write against {host}, which is {app}'s live app"
    )
    sys.stderr.write(
        "BLOCKED by §7 (no production-write diagnostics): this command looks like "
        f"{what}.\n\n"
        "Before any diagnostic that writes to production, establish that no "
        "read-only proof exists — a search obligation, not a preference. For "
        "'are the write endpoints open', the read-only proof is an "
        "unauthenticated DELETE against a nonexistent id: 404 means the request "
        "passed the gate, 401 means it did not. For 'is it set in production', "
        "read `vercel env ls` — a status code is an inference about "
        "configuration, the environment list is the configuration.\n\n"
        "If a write genuinely is the only way, say so first and get a yes.\n"
    )
    sys.exit(2)

# `cd ecosystem && cp SYSTEM.md ...` is how the copy is actually written, so
# the cwd a segment runs under is not always the cwd the payload reports. The
# first version missed this: its unit test passed the target directory in
# directly and passed, while the real command was blocked. Bug family (c), the
# verification sharing the assumption, twice in the same hook.
CD = re.compile(r"^\s*cd\s+(?:-{1,2}\s+)?(\S+)\s*$")

for segment in SEGMENT.split(cmd):
    moved = CD.match(segment)
    if moved:
        try:
            cwd = resolve(shlex.split(moved.group(1))[0], cwd)
        except (ValueError, IndexError):
            pass
        continue
    if SPEC_WRITE.search(segment) and not sanctioned_copy(segment, cwd):
        sys.stderr.write(
            "BLOCKED by §13.6 (one writer to the spec files): this command writes "
            "to a spec file through the shell.\n\n"
            "The Edit/Write hook guards those files; this one guards the same rule "
            "against redirects, sed -i, cp, mv, tee and rm, because a rule "
            "enforced against one door only is a suggestion.\n\n"
            "The one allowed write is the §13.6 copy itself: `cp` whose sources "
            "are in ~/Projects/ecosystem and whose destination is not. That is the "
            "planning chat's result being copied out to a repo. Every other "
            "direction, and every other verb, is blocked — a copy back into "
            "ecosystem is a code session writing to the source of truth.\n\n"
            "Report the finding to the planning chat. It is the only writer.\n"
        )
        sys.exit(2)

sys.exit(0)
