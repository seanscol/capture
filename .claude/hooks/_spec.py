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


def spec_copies():
    """Every SYSTEM.md under ~/Projects, one per directory.

    Discovered rather than listed. A hardcoded set of three paths is bug
    family (d) the moment a fourth repo exists, and this check is the only
    thing that would notice.
    """
    if not PROJECTS.is_dir():
        return []
    found = [p / "SYSTEM.md" for p in sorted(PROJECTS.iterdir()) if p.is_dir()]
    return [p for p in found if p.is_file()]
