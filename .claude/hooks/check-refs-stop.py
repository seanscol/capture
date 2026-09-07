#!/usr/bin/env python3
"""Stop — §13.6 run check-refs.py, plus the drift checks §13.6 implies.

**Version 1.0 · 2026-09-08** — the merge of three copies. fnd-tracker held
checks 1 and 2, routine generalised check 3 to every repo and added the
tooling comparison, adhd-tasks added the @import check. Checks 1 and 2 were
byte-identical in all four repos, so only the additions had to be chosen
between, and none of them conflicted.

Five findings, one message:

  1. check-refs.py against every spec file in this repo.
  2. Every copy of them under ~/Projects agrees with the ecosystem copy.
  3. Every repo's CLAUDE.md still carries §2 and §3 verbatim.
  4. The TOOLING on the same canonical list agrees across every app repo —
     check-refs.py, .claude/settings.json, and every hook script.
  5. Every @import in every repo's CLAUDE.md resolves to a file that exists.

Checks 3, 4 and 5 all look at every repo rather than only the one the session
is standing in, and that is the through-line rather than a coincidence. Nearly
everything found in the week to 2026-09-08 was invisible for the same reason:
ecosystem's check-refs.py two versions behind since 09-05, three versions of
_spec.py, capture left on v2.3, a dangling @AGENTS.md. None of it was in
anybody's way. `[SEAN 2026-09-08]`

(4) was added 2026-09-06 because (2) watched the documents and nothing watched
the tools. NEXT-STEPS.md's canonical list names six things a repo holds; two of
them were unguarded, and one of those had already drifted: ecosystem's
check-refs.py was two versions behind all three app repos, so the --defs call
this very hook makes was being silently ignored, and operating-notes.md was
being checked against itself and passing. Found by accident. The rule it broke
is the one the check exists to serve: a check that cannot run is not a check
that passed.

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

# --- 3. CLAUDE.md still carries the rules, in EVERY repo -------------------
#
# This used to check only the repo the session was running in, which meant a
# repo nobody had opened for a month could carry a stale §2 and nothing would
# say so. That is the same shape as the gap that let check-refs.py drift:
# a check that exists but only runs where somebody happens to be standing.
#
# CLAUDE.md is per-repo — §13.3 puts §2 and §3 inline and the app-specific half
# is the repo's own — so the copies are NOT compared with each other. Each is
# compared against its own SYSTEM.md, which check (2) has already established
# is the same file everywhere.
stale_here = False
for repo in ([root] + [r for r in _spec.app_repos() if r.resolve() != root.resolve()]):
    spec, claude_md = repo / "SYSTEM.md", repo / "CLAUDE.md"
    where = "this repo" if repo.resolve() == root.resolve() else rel(repo)

    if not spec.exists():
        continue  # check (2) already reports a repo missing its spec.
    if not claude_md.is_file():
        findings.append(f"CLAUDE.md is missing from {where} (§13.3).")
        continue
    try:
        want_blocks = _spec.blocks(spec.read_text())
    except ValueError:
        findings.append(f"§2 or §3 could not be located in {where}'s "
                        "SYSTEM.md, so CLAUDE.md could not be checked "
                        "against it. Absence is not agreement (§2.1).")
        continue

    have = claude_md.read_text()
    stale = [name for name, body in zip(("§2", "§3"), want_blocks)
             if body not in have]
    if stale:
        stale_here = stale_here or repo.resolve() == root.resolve()
        findings.append(
            f"CLAUDE.md in {where} no longer carries "
            f"{' and '.join(stale)} verbatim from its SYSTEM.md.\n\n"
            "  §13.3 requires them inline; the SessionStart hook injects "
            "them live from SYSTEM.md. A session reads both, so a "
            "disagreement means one of the two is wrong and nothing else "
            "would say which (bug family (b)). Regenerate the block from "
            "that repo's SYSTEM.md rather than editing it by hand."
        )


# --- 4. the tooling agrees too ---------------------------------------------
#
# Documents have a source of truth and a sanctioned direction; tools do not.
# Ecosystem is downstream for tooling — a session improves a hook in the repo
# it is working in, and the improvement flows outward from there. So this
# reports disagreement and never infers which side is right.
#
# From 2026-09-08 every tool carries a **Version line, read here with the same
# _spec.version() that reads a spec file. It does NOT settle direction, and
# nothing below treats a higher number as the winner: a tool can be ahead in
# version and behind in content, which is exactly what three divergent copies
# of _spec.py were. What it settles is order. "Three versions, unknown order"
# is the hard case; "three versions, known order" is a diff you can read.
# `[SEAN 2026-09-08]`
#
# A tool with no version line is reported as such rather than as version zero —
# unknown is not "oldest" (§2.1).
repos = _spec.app_repos()
if not repos:
    findings.append(
        "no app repos were found under ~/Projects, so the tooling could not be "
        "compared. Absence is not agreement (§2.1)."
    )
else:
    # Every hook present in ANY repo, plus the two files named outright. If the
    # names came from one repo, that repo could lose a hook and take the check
    # for it away in the same move.
    watched = list(_spec.TOOLING) + [
        f".claude/hooks/{name}" for name in _spec.hook_names(repos)
    ]

    for relpath in watched:
        # ecosystem holds check-refs.py and no .claude at all. It is included
        # where it has a copy and never counted as missing where it does not —
        # it is not an app repo and is not required to hold the hooks.
        groups, absent = _spec.compare_tooling(
            relpath, repos, extra=[_spec.ECOSYSTEM]
        )

        if absent:
            findings.append(
                f"{relpath} is on the canonical list and these app repos do "
                "not have it:\n\n"
                + "\n".join(f"    {rel(p)}" for p in sorted(absent))
                + "\n\n  A missing copy is not an agreeing copy (§2.1)."
            )

        if len(groups) > 1:
            lines = []
            for key, holders in sorted(groups.items(), key=lambda kv: -len(kv[1])):
                for holder in sorted(holders):
                    v = _spec.version(holder / relpath)
                    label = f"v{'.'.join(map(str, v))}" if v else "unversioned"
                    lines.append(f"    {label:<12} {key[:12]}  {rel(holder)}")
            findings.append(
                f"{relpath} differs between repos — {len(groups)} versions "
                "exist:\n\n"
                + "\n".join(lines)
                + "\n\n  Tooling has no sanctioned direction: ecosystem is "
                "authoritative for the documents and downstream for the tools, "
                "so which copy is right cannot be read off the paths. Diff them "
                "and decide, then apply the result to every copy deliberately. "
                "Do not copy one over the rest to make this quiet."
            )

# --- 5. every @import resolves ---------------------------------------------
#
# CLAUDE.md is the first thing a session reads, and an @import naming a file
# that does not exist resolves to nothing, silently — the session simply never
# sees what it was supposed to. Found on 2026-09-06: ~/Projects/ecosystem
# imported @AGENTS.md and has never had that file, the line having been copied
# from a repo where it meant something.
#
# Across every repo rather than only this one, because that is where the
# broken one was and a check that only looks at its own house would not have
# found it.
broken = []
for cm in _spec.claude_files():
    for spec, target in _spec.imports(cm):
        if not target.exists():
            broken.append((cm, spec))
if broken:
    findings.append(
        "these @imports point at files that do not exist:\n\n"
        + "\n".join(f"    {rel(cm)}  imports  {spec}" for cm, spec in broken)
        + "\n\n  CLAUDE.md is the first thing a session reads and a missing "
        "import resolves to nothing without saying so, which means a session "
        "never sees what it was meant to."
    )

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
