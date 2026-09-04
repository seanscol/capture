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

Usage:  python3 check-refs.py [path/to/SYSTEM.md]
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


def check(path):
    text = Path(path).read_text()
    sections, rules, dq = parse(text)
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
    print(f"  sections {len(sections)}  rules {len(rules)}  decisions/questions {len(dq)}")
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
    target = sys.argv[1] if len(sys.argv) > 1 else "SYSTEM.md"
    if not Path(target).exists():
        print(f"not found: {target}", file=sys.stderr)
        sys.exit(2)
    sys.exit(check(target))
