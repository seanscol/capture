"""Re-slice a repo's CLAUDE.md §2 and §3 from that repo's own SYSTEM.md.

§13.3 puts the rules inline because a pointer alone gets skipped, and §13.8
injects them live from SYSTEM.md — so a session reads both, and a stale inline
copy means the two disagree about the rules themselves. That is bug family (b)
in the place it can do most damage.

Mechanical on purpose. The blocks come from _spec.blocks(), the same function
the Stop hook checks them with, so there is one definition of "where does §2
end" and this cannot drift from the thing that verifies it.

Everything outside the two blocks is untouched — the app-specific section at
the bottom of each CLAUDE.md is per-repo and must survive.

Usage:  python3 reslice-claude-md.py [path/to/repo]     (default: .)
Exit:   0 if it re-sliced or had nothing to do, non-zero if it refused.

It refuses rather than guesses. A missing heading, a missing stop heading, or
a block that is not present verbatim afterwards all revert the file and stop —
a CLAUDE.md half re-sliced is worse than one that is stale, because the stale
one is at least internally consistent.

Lives beside check-refs.py at each repo root and in ~/Projects/ecosystem, on
the rule check-refs.py established: a tool flows up from the repo that
improved it, then out to the rest. The ecosystem copy runs against any repo —
it imports _spec from the repo it is pointed at, not from beside itself.
"""
import sys
from pathlib import Path

repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".").expanduser().resolve()
sys.path.insert(0, str(repo / ".claude" / "hooks"))
import _spec  # noqa: E402

system_md = repo / "SYSTEM.md"
claude_md = repo / "CLAUDE.md"
for p in (system_md, claude_md):
    if not p.is_file():
        sys.exit(f"missing: {p}")

want = dict(zip(("§2", "§3"), _spec.blocks(system_md.read_text())))
text = claude_md.read_text()
original = text

# Where each block starts and stops INSIDE CLAUDE.md. The stop heading differs
# from SYSTEM.md's: CLAUDE.md omits §2A, and its §3 is followed by the
# app-specific section rather than by §4.
BOUNDS = [
    ("§2", "## 2. Inviolable rules", "## 3. Do not rebuild"),
    ("§3", "## 3. Do not rebuild", None),
]

changed = []
for name, start, stop in BOUNDS:
    body = want[name]
    if body in text:
        print(f"  {name}: already current")
        continue
    i = text.find(start)
    if i < 0:
        sys.exit(f"  {name}: heading {start!r} not found in CLAUDE.md — not re-slicing blind")
    # Up to the separator before the next heading, so the `---` and everything
    # after it stay exactly where they were.
    j = text.find(stop, i) if stop else len(text)
    if stop and j < 0:
        sys.exit(f"  {name}: stop heading {stop!r} not found — not re-slicing blind")
    tail = text[j:] if stop else ""
    # Whatever separated the block from what follows it, kept as it was.
    # _spec.section() strips the trailing horizontal rule off the block, so it
    # is not in `body` and has to be put back -- a first version kept only the
    # trailing whitespace and silently deleted the `---` between §2 and §3.
    between = text[i:j]
    stripped = between.rstrip()
    sep = "\n\n---\n\n" if stripped.endswith("---") else between[len(stripped) :]
    text = text[:i] + body + (sep if stop else "\n") + tail
    changed.append(name)

if not changed:
    print("  nothing to do")
    sys.exit(0)

claude_md.write_text(text)

# The blocks must now be present verbatim, and nothing else may have moved.
after = claude_md.read_text()
for name, body in want.items():
    if body not in after:
        claude_md.write_text(original)
        sys.exit(f"  FAILED: {name} not present after the rewrite — reverted, nothing changed")
for marker in ("## This app", "# Ecosystem rules"):
    if original.count(marker) != after.count(marker):
        claude_md.write_text(original)
        sys.exit(f"  FAILED: {marker!r} count changed — reverted, nothing changed")

print(f"  re-sliced: {', '.join(changed)}")
print(f"  {len(original.splitlines())} lines -> {len(after.splitlines())}")
