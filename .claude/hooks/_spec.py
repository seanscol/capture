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
# The three are copied out of ecosystem as a set and share one `**Version`
# line, so classify() can place any of them. DECISIONS.md was protected but
# unversioned until v3.0, which meant every difference in it could only ever
# come back `unknown` — guarded against editing, and unable to say whether the
# copy was stale. Being on this list is what makes a difference readable.
VERSIONED = ("SYSTEM.md", "DECISIONS.md", "operating-notes.md")
PROTECTED = frozenset(VERSIONED)

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


def version(path):
    """The `**Version 2.8 · …**` line as a comparable tuple, or None.

    None is a real answer and callers must treat it as one: a file whose
    version cannot be read is a file whose position in the sequence is
    unknown, and unknown is not "behind" (§2.1).
    """
    try:
        text = Path(path).read_text()
    except OSError:
        return None
    m = re.search(r"^\*\*Version\s+([0-9]+(?:\.[0-9]+)*)", text, re.M)
    if not m:
        return None
    return tuple(int(n) for n in m.group(1).split("."))


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
