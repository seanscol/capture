#!/usr/bin/env python3
"""Stop — §13.6 run check-refs.py, plus the drift checks §13.6 implies.

Three findings, one message:

  1. check-refs.py against every spec file in this repo.
  2. Every copy of them under ~/Projects agrees with the ecosystem copy.
  3. This repo's CLAUDE.md still carries §2 and §3 verbatim.

(1) and (2) used to mean SYSTEM.md alone. operating-notes.md is part of the
spec under §4A, refers into SYSTEM.md five times, and no guard knew it
existed — its references were unchecked and a repo missing it entirely looked
identical to a repo in agreement. The file list is now _spec.VERSIONED, and
both checks loop over it.

(2) and (3) exist because §13.7 step 1 created copies. §13.6 calls multiple
writers to multiple copies "not a risk, it is a schedule", and named the
weekly audit as the detector — which is [PROPOSED] and unbuilt. Until it is,
this is the only thing that would notice drift.

(3) is bug family (b) specifically: §13.3 puts the rules inline in CLAUDE.md,
§13.8 injects them live from SYSTEM.md, and a session reads both. If they ever
disagree, nothing else in the system would say so.

Reports; never blocks. Exit is always 0. A blocking Stop hook running a check
that can fail is a session you have to force-quit: check fails, session cannot
stop, session continues, check fails.

Silent when everything matches, per §13.8's own test — a checker that reports
every day gets ignored, and §4 says what happens to anything needing upkeep.
"""
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import _spec  # noqa: E402

root = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
findings = []


def digest(path):
    return hashlib.md5(path.read_bytes()).hexdigest()


def rel(path):
    """Shorten for display, without pretending a path outside ~ is inside it."""
    try:
        return "~/" + str(path.relative_to(Path.home()))
    except ValueError:
        return str(path)


# --- 1. references resolve -------------------------------------------------
script, target = root / "check-refs.py", root / "SYSTEM.md"

# References in operating-notes.md point into SYSTEM.md, so they are checked
# against SYSTEM.md's definitions. Not a convenience: operating-notes.md has
# its own §4, §9 and §10 headings, and checked against itself three of its
# five references resolve to the wrong document and report clean.
for name in _spec.VERSIONED:
    doc = root / name
    defs = target if name != "SYSTEM.md" else None

    # Absence of data is never good news (§2.1). A missing checker is not a
    # pass, and neither is a missing document.
    missing = [p.name for p in ([script, doc] + ([defs] if defs else []))
               if not p.exists()]
    if missing:
        findings.append(
            f"check-refs did not run against {name}: "
            f"{' and '.join(sorted(set(missing)))} missing from this repo "
            f"(§13.7 step 1)."
        )
        continue
    cmd = [sys.executable, str(script), str(doc)]
    if defs:
        cmd += ["--defs", str(defs)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30,
                           cwd=root)
        if r.returncode != 0:
            findings.append("check-refs.py found broken references in "
                            f"{name}:\n\n{(r.stdout + r.stderr).strip()}")
    except (subprocess.SubprocessError, OSError) as e:
        findings.append(f"check-refs could not be run against {name}: {e}")

# --- 2. the copies agree ---------------------------------------------------
pending_copy = False
for name in _spec.VERSIONED:
    source = _spec.ECOSYSTEM / name
    if not source.is_file():
        findings.append(
            f"the ecosystem copy of {name} is missing ({rel(source)}), so the "
            f"copies could not be compared. Absence is not agreement (§2.1)."
        )
        continue

    want = digest(source)
    source_v = _spec.version(source)
    differing = [p for p in _spec.spec_copies(name)
                 if p != source and digest(p) != want]

    # A copy that was never made is not in that list at all. Before this, a
    # repo with no operating-notes.md and a repo whose copy matched were the
    # same answer — absence read as agreement, §2.1 exactly.
    absent = _spec.missing_copies(name)
    if absent:
        findings.append(
            f"{name} is part of the spec (§4A) and these repos do not have it "
            "at all:\n\n"
            + "\n".join(f"    {rel(p.parent)}" for p in absent)
            + f"\n\n  A missing copy is not an agreeing copy (§2.1). Copy from "
            f"{rel(source)} out to each — the Bash hook allows that copy."
        )

    # Two different situations look identical to a digest comparison, and only
    # one of them is a problem.
    #
    #   PENDING   — ecosystem is ahead and the copy out has not run yet. This
    #               is the sanctioned direction (the Bash hook allows exactly
    #               this copy) and the remedy is to run it.
    #   DRIFT     — a repo carries the same version as ecosystem with different
    #               bytes, or is somehow ahead of it. That is an edit that
    #               should not have happened, and §13.6 says report it.
    #
    # The old message asserted DRIFT for both and then told the session not to
    # reconcile — which, in the pending case, forbade the one action that
    # resolves it. Same shape as the bug the Bash hook had on 09-04, where
    # enforcement blocked its own remedy.
    pending, drifted, unknown = _spec.classify(
        source_v, [(p, _spec.version(p)) for p in differing]
    )

    if pending:
        pending_copy = True
        findings.append(
            f"{name} v{'.'.join(map(str, source_v))} in ecosystem is ahead of "
            "these copies, which have not been updated yet:\n\n"
            + "\n".join(f"    {rel(p)}  (v{'.'.join(map(str, _spec.version(p) or ()))})"
                         for p in pending)
            + "\n\n  This is the sanctioned direction, not drift. Copy from "
            f"{rel(source)} out to each repo — the Bash hook allows that copy. "
            "CLAUDE.md is per-repo and is not part of it."
        )
    if drifted:
        findings.append(
            f"{name} copies differ from ecosystem at the SAME version, so a "
            "copy was edited in place:\n\n"
            + "\n".join(f"    {rel(p)}" for p in drifted)
            + f"\n\n  original: {rel(source)}\n\n"
            "  §13.6: the planning chat is the only writer. Report this; do "
            "not reconcile it — copying either way would destroy one side's "
            "edit without anyone reading it."
        )
    if unknown:
        findings.append(
            f"{name} copies differ from ecosystem and the version line could "
            "not be read, so which is ahead is unknown:\n\n"
            + "\n".join(f"    {rel(p)}" for p in unknown)
            + "\n\n  Unknown is not 'behind' (§2.1). Read both before copying "
            "anything in either direction."
        )

# --- 3. CLAUDE.md still carries the rules ----------------------------------
claude_md = root / "CLAUDE.md"
if target.exists() and claude_md.is_file():
    try:
        want_blocks = _spec.blocks(target.read_text())
    except ValueError:
        findings.append("§2 or §3 could not be located in this repo's "
                        "SYSTEM.md, so CLAUDE.md could not be checked "
                        "against it.")
    else:
        have = claude_md.read_text()
        stale = [name for name, body in zip(("§2", "§3"), want_blocks)
                 if body not in have]
        if stale:
            findings.append(
                f"CLAUDE.md no longer carries {' and '.join(stale)} verbatim "
                "from SYSTEM.md.\n\n"
                "  §13.3 requires them inline; the SessionStart hook injects "
                "them live from SYSTEM.md. A session reads both, so a "
                "disagreement means one of the two is wrong and nothing else "
                "would say which (bug family (b))."
            )
elif target.exists() and not claude_md.is_file():
    findings.append("CLAUDE.md is missing from this repo (§13.3).")

# --- report ----------------------------------------------------------------
if findings:
    body = "\n\n".join(f"  {i}. {f}" for i, f in enumerate(findings, 1))
    # The footer used to say "this session does not fix these" unconditionally,
    # which contradicted the pending-copy finding printed directly above it —
    # that one names an action this session is allowed and expected to take.
    # A blanket instruction attached to a mixed list is wrong for whichever
    # entries it does not describe, and the reader cannot tell which.
    footer = (
        "  Each finding says what to do with it. Where none does, §13.6 "
        "applies: report it to the planning chat rather than fixing it here."
        if pending_copy else
        "  This session does not fix these (§13.6) — report to the planning "
        "chat."
    )
    print(json.dumps({"systemMessage":
        f"Spec check found {len(findings)} thing(s) to look at:\n\n{body}\n\n{footer}"}))

sys.exit(0)
