#!/usr/bin/env python3
"""
Check every cross-reference in SYSTEM.md resolves to something that exists.

This document has broken its own references three times: the v1.0 renumbering
left §10 pointing at §2.6 for a rule that had become §2.2, and test and route
counts in prose went stale within days of being written. It is bug family (d)
— a constant surviving the change that invalidated it — occurring inside the
document that names bug family (d).

The dangerous stale reference is not the one pointing at a deleted section.
That is obvious on sight. It is the one pointing at a number that still exists
and now means something else, which reads perfectly and is wrong. A person
proofreading cannot catch those; this can, completely.

A second document, operating-notes.md, refers into this one: §2.6, §4, §9,
§10, §12 D3/Q2. Those references went unchecked because this script was only
ever run against SYSTEM.md — and checking that file against itself would have
been worse than not checking it. operating-notes.md has its own `## 4.` and
`## 9.` and `## 10.` headings, so three of its five references would resolve
against the wrong document, read perfectly, and pass. That is precisely the
failure described above. Hence --defs: references are checked against the
definitions of the document they point into, which for operating-notes.md is
always SYSTEM.md. It uses "item N" for its own sections and reserves § for
SYSTEM.md, and this makes that convention enforceable rather than merely
observed.

**Version 1.0 · 2026-09-08** — the copy every app repo carried on 09-07,
which is two versions ahead of the one ecosystem held from 09-05 to 09-06.
That gap was invisible: the old copy ignores --defs and checks
operating-notes.md against itself, which passes and means nothing.

Usage:  python3 check-refs.py [path/to/SYSTEM.md] [--defs path/to/SYSTEM.md]
Exit:   0 clean, 1 problems found.
"""
import re
import sys
from pathlib import Path


def parse(text):
    """Section headings, numbered rules, and D/Q items that the document defines."""
    sections, rules, dq = set(), set(), set()
    in_changelog = False

    for line in text.splitlines():
        if re.match(r"^##\s+\d*\.?\s*(Changelog|History)", line, re.I):
            in_changelog = True
        elif line.startswith("## "):
            in_changelog = False

        m = re.match(r"^#{2,3}\s+§?(\d+[A-Z]?)[.\s]", line)
        if m:
            sections.add(m.group(1))

        # Definitions only — inside the changelog these are references to past
        # versions, not definitions, and counting them hides real breakage.
        if not in_changelog:
            rules.update(re.findall(r"^\*\*(\d+[A-Z]?\.\d+)\s", line))
            dq.update(re.findall(r"^-?\s*\*\*(D\d+|Q\d+)\.", line))

    return sections, rules, dq


def check(path, defs_path=None):
    """Check every reference in `path` against what `defs_path` defines.

    Default: the document defines its own targets, which is right for
    SYSTEM.md and wrong for anything that refers into it.
    """
    text = Path(path).read_text()
    defs_path = defs_path or path
    sections, rules, dq = parse(Path(defs_path).read_text())
    problems = []

    def quoted(line, token):
        """Is this token being discussed rather than used?

        "a pointer to a deleted §2.9 is obvious" and 'v1.0's "99 tests" was 105'
        are both prose ABOUT a stale reference, not stale references. Flagging
        them trains the reader to ignore the output, which is how a check stops
        being run at all.
        """
        for m in re.finditer(r"[\"\u201c\u2018\'](.*?)[\"\u201d\u2019\']", line):
            if token in m.group(1):
                return True
        return bool(re.search(r"(deleted|stale|was|used to|former|v\d\.[\dx])[^.]{0,40}" + re.escape(token), line))

    for num, line in enumerate(text.splitlines(), 1):
        for ref in re.findall(r"§(\d+[A-Z]?(?:\.\d+)?)", line):
            if quoted(line, f"§{ref}"):
                continue
            known = rules if "." in ref else sections
            if ref not in known:
                problems.append((num, f"§{ref} referenced but never defined", line.strip()))
        for ref in re.findall(r"\b(D\d+|Q\d+)\b", line):
            if ref not in dq and not quoted(line, ref):
                problems.append((num, f"{ref} referenced but never defined", line.strip()))

    # Counts in prose describe last month's model within days of being written.
    for num, line in enumerate(text.splitlines(), 1):
        m = re.search(r"\b(\d{2,4})\s+(tests|routes|tasks|endpoints|files)\b", line)
        if m and "no test counts" not in line and "no route counts" not in line and not quoted(line, m.group(1)):
            problems.append((num, f"a count in prose ({m.group(0)}) — §5.8 says constants live in code", line.strip()))

    print(f"{path}")
    against = "" if Path(defs_path) == Path(path) else f"  (defined in {defs_path})"
    print(f"  sections {len(sections)}  rules {len(rules)}  "
          f"decisions/questions {len(dq)}{against}")
    if not problems:
        print("  OK — every reference resolves, no counts in prose.")
        return 0

    print(f"  {len(problems)} problem(s):")
    seen = set()
    for num, what, line in problems:
        if (num, what) in seen:
            continue
        seen.add((num, what))
        print(f"    line {num}: {what}")
        print(f"      {line[:100]}")
    return 1


if __name__ == "__main__":
    args = sys.argv[1:]
    defs = None
    if "--defs" in args:
        i = args.index("--defs")
        if i + 1 >= len(args):
            print("--defs needs a path", file=sys.stderr)
            sys.exit(2)
        defs = args[i + 1]
        args = args[:i] + args[i + 2:]

    target = args[0] if args else "SYSTEM.md"
    # A missing definitions file is not a clean run (§2.1): with no targets to
    # resolve against, every reference in the document would be reported
    # broken, which reads as the document being wrong rather than the check
    # being unable to run.
    for label, p in (("", target), ("--defs ", defs)):
        if p and not Path(p).exists():
            print(f"not found: {label}{p}", file=sys.stderr)
            sys.exit(2)
    sys.exit(check(target, defs))
