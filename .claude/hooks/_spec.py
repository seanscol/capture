"""Shared helpers for the spec hooks.

One definition, imported (§7(b): a value one part respects and another
assumes — export ONE definition). The section slicing lives here because both
inject-rules.py and check-refs-stop.py need it, and two copies of "where does
§2 end" is the bug family that rule names.
"""
import re
from pathlib import Path

PROJECTS = Path.home() / "Projects"
ECOSYSTEM = PROJECTS / "ecosystem"

# The spec files, defined once and imported (§7(b)). SYSTEM.md was named in
# three separate places -- a set here, a set in block-spec-edits.py, a regex in
# block-prod-writes.py -- and operating-notes.md, which §4A makes part of the
# same spec, was named in none of them. Three lists is three chances to update
# two of them.
#
# VERSIONED are the files copied out of ecosystem as a set and checked for
# drift. They share one `**Version` line, so classify() can place them.
# DECISIONS.md is protected but not versioned: it carries no Version line, so
# every differing copy of it would come back `unknown` and the report would be
# noise. That is a finding for the planning chat, not something a code session
# fixes by adding a line to the file it may not write.
VERSIONED = ("SYSTEM.md", "operating-notes.md")
PROTECTED = frozenset(VERSIONED) | {"DECISIONS.md"}

# (start heading, stop heading) for each block CLAUDE.md must carry inline.
BLOCKS = [
    ("## 2. Inviolable rules", "## 2A. Structural decisions"),
    ("## 3. Do not rebuild", "## 4. The person"),
]


def section(text, start, stop):
    """Text from heading `start` up to heading `stop`, minus the trailing rule.

    Raises ValueError if either heading is absent — the caller must treat that
    as a finding, never as a pass (§2.1).
    """
    s = text.index(start)
    return re.sub(r"\n+---\n*\Z", "", text[s:text.index(stop, s)]).rstrip()


def blocks(text):
    """The §2 and §3 bodies, in order."""
    return [section(text, start, stop) for start, stop in BLOCKS]


def spec_copies(name="SYSTEM.md", root=None):
    """Every copy of `name` under ~/Projects, one per directory.

    Discovered rather than listed. A hardcoded set of three paths is bug
    family (d) the moment a fourth repo exists, and this check is the only
    thing that would notice.

    One name per call, because the caller compares each copy against its own
    original: returning SYSTEM.md and operating-notes.md together would leave
    the caller digesting one file against the other's source and reporting
    every repo as drifted.

    `root` exists so the branches can be exercised against a synthetic tree
    rather than only against the four directories that happen to be here.
    """
    base = Path(root) if root is not None else PROJECTS
    if not base.is_dir():
        return []
    found = [p / name for p in sorted(base.iterdir()) if p.is_dir()]
    return [p for p in found if p.is_file()]


def missing_copies(name, root=None):
    """Repos that carry SYSTEM.md but not `name`.

    A copy that was never made is absent, and spec_copies() cannot see it —
    absence would read as agreement, which is §2.1 exactly. SYSTEM.md is what
    marks a directory as one of the repos in the set; a repo with SYSTEM.md
    and no operating-notes.md has not had the copy run, and nothing else in
    the system would say so.
    """
    base = Path(root) if root is not None else PROJECTS
    if not base.is_dir() or name == "SYSTEM.md":
        return []
    source_dir = base / ECOSYSTEM.name  # relative to base, so a synthetic tree
    return [p / name for p in sorted(base.iterdir())  # excludes its own source
            if p.is_dir() and p != source_dir
            and (p / "SYSTEM.md").is_file() and not (p / name).is_file()]


def under_projects(path, root=None):
    """Is `path` inside ~/Projects?

    Both the literal path and its symlink-resolved form count, and either one
    landing inside is enough. A guard testing only one form can be stepped
    around from either side: a symlink in /tmp pointing at the real file, or a
    repo directory that is itself a symlink to somewhere else. The same
    breadth means `~/Projects/../tmp/SYSTEM.md` is treated as inside, because
    one reading of it is. For a guard, blocking a file it needn't have is the
    safe error and waving one through is not.
    """
    if not path:
        return False
    base = Path(root) if root is not None else PROJECTS
    try:
        p = Path(path).expanduser()
        if not p.is_absolute():
            p = Path.cwd() / p
        forms = {p, p.resolve()}
        roots = {base, base.resolve()}
    except (OSError, RuntimeError, ValueError):
        return True  # Cannot tell. A spec-file name we cannot place is blocked.
    return any(f == r or r in f.parents for f in forms for r in roots)


VERSION = re.compile(r"\*\*Version\s+(\d+)\.(\d+)")


def version(text):
    """(major, minor) from the header, or None if it cannot be read.

    None is a real answer and must not be treated as zero: a copy whose
    version cannot be parsed is one this check knows nothing about, and
    guessing would make it assert the thing it cannot tell (§2.1).

    NOTE: this repo's check-refs-stop.py passes the file's text; fnd-tracker's
    _spec.version() takes a path and does its own read. Same name, different
    argument, two implementations of the same fix written independently. Not
    reconciled here -- reported to the planning chat.
    """
    m = VERSION.search(text)
    return (int(m.group(1)), int(m.group(2))) if m else None


def classify(source_version, copies):
    """Split differing copies into (pending, drifted, unknown).

    `copies` is an iterable of (path, version) for copies whose bytes differ
    from the ecosystem original. Pure — no filesystem, no digests — so the
    decision that matters can be exercised directly.

    Three outcomes, because a digest comparison alone cannot tell them apart:

      pending  the copy is BEHIND ecosystem. The copy out has not run yet.
               Sanctioned direction; the remedy is to run it.
      drifted  the copy is at the same version with different bytes, or is
               ahead. Somebody edited a copy in place. Report, never reconcile
               — copying either way destroys one side unread.
      unknown  a version could not be read. Unknown is not "behind" (§2.1).

    The old message asserted `drifted` for every case and then forbade
    reconciling, which in the pending case forbade the only thing that
    resolves it — the same shape as the Bash hook blocking its own remedy.
    """
    pending, drifted, unknown = [], [], []
    for path, v in copies:
        if v is None or source_version is None:
            unknown.append(path)
        elif v < source_version:
            pending.append(path)
        else:
            drifted.append(path)
    return pending, drifted, unknown
