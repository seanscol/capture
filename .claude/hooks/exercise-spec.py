"""Exercise the spec-file logic against synthetic trees.

    python3 .claude/hooks/exercise-spec.py .

**Version 1.0 · 2026-09-08** — routine's copy, which tests the tooling
comparison, plus cases for the @import readers adhd-tasks added without any.

exercise-hooks.py drives the two PreToolUse hooks end to end. This drives the
decisions underneath them — discovery, versioning, placement, reference
resolution, and tooling consensus — against directories built for the
purpose.

Why synthetic: the four directories under ~/Projects are one arrangement, and
today it is an arrangement in which every check passes for reasons that have
nothing to do with the code being right. A repo missing a spec file, a copy
ahead of ecosystem, a version line that cannot be read, a spec-file name
outside ~/Projects — none of those exist here, and each is a branch that
decides whether a real problem is reported or silently passed. Testing against
the live tree is bug family (c): the verification sharing the situation's
assumptions.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
sys.path.insert(0, str(repo / ".claude" / "hooks"))
import _spec  # noqa: E402

CHECK_REFS = repo / "check-refs.py"
SPEC = "SYS" + "TEM.md"
NOTES = "operating-" + "notes.md"
DEC = "DECIS" + "IONS.md"

results = []


def case(label, got, want):
    results.append((label, got, want, got == want))


def write(path, text):
    """Build a fixture. Not through the shell, and not through Edit/Write —
    both are guarded, correctly, and a test that needs the guard turned off is
    testing something other than what ships."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return path


def doc(version=None, body=""):
    head = f"# Title\n\n**Version {version} · 2026-09-06**\n\n" if version else "# Title\n\n"
    return head + body


def names(paths):
    return sorted(p.parent.name for p in paths)


# ---------------------------------------------------------------------------
# A synthetic ~/Projects. Five directories, each a different arrangement.
# ---------------------------------------------------------------------------
tmp = Path(tempfile.mkdtemp(prefix="spec-fixtures-"))
root = tmp / "Projects"

# ecosystem: the source. Both files, v2.8.
write(root / "ecosystem" / SPEC, doc("2.8", "## 2. Rules\n\n**2.6 Nothing projects**\n"))
write(root / "ecosystem" / NOTES, doc("2.8", "refers to §2.6 and item 4\n"))

# up-to-date: byte-identical to ecosystem.
shutil.copy(root / "ecosystem" / SPEC, write(root / "up-to-date" / SPEC, ""))
shutil.copy(root / "ecosystem" / NOTES, write(root / "up-to-date" / NOTES, ""))

write(root / "ecosystem" / DEC, doc("2.8", "history\n"))
shutil.copy(root / "ecosystem" / DEC, write(root / "up-to-date" / DEC, ""))

# behind: both files at v2.3. The copy out has not run. Sanctioned direction.
write(root / "behind" / SPEC, doc("2.3", "## 2. Rules\n\n**2.6 Nothing projects**\n"))
write(root / "behind" / NOTES, doc("2.3", "older text\n"))

# edited: same version as ecosystem, different bytes. Somebody edited a copy.
write(root / "edited" / SPEC, doc("2.8", "## 2. Rules\n\n**2.6 Nothing projects**\n\nextra\n"))
write(root / "edited" / NOTES, doc("2.8", "refers to §2.6 and item 4\n\nextra\n"))

# unversioned: differs, and carries no Version line. Cannot be placed.
write(root / "unversioned" / SPEC, "# Title\n\nno version line here\n")

# never-copied: a repo in the set (it has SYSTEM.md) with no notes at all.
shutil.copy(root / "ecosystem" / SPEC, write(root / "never-copied" / SPEC, ""))

# not-a-repo: a directory under Projects that is not one of the apps.
write(root / "not-a-repo" / "README.md", "unrelated\n")

# ---------------------------------------------------------------------------
# 1. Discovery — one name per call, and every directory that has it
# ---------------------------------------------------------------------------
case("spec_copies finds every SYSTEM.md",
     names(_spec.spec_copies(SPEC, root)),
     ["behind", "ecosystem", "edited", "never-copied", "unversioned", "up-to-date"])
case("spec_copies finds every notes copy",
     names(_spec.spec_copies(NOTES, root)),
     ["behind", "ecosystem", "edited", "up-to-date"])
case("spec_copies skips dirs without it",
     "not-a-repo" in names(_spec.spec_copies(SPEC, root)), False)
case("spec_copies on a missing root",
     _spec.spec_copies(SPEC, tmp / "nope"), [])

# ---------------------------------------------------------------------------
# 2. Absence — the finding that could not exist before, because a copy that
#    was never made is not in any list of copies
# ---------------------------------------------------------------------------
case("missing_copies names every repo with no notes",
     names(_spec.missing_copies(NOTES, root)), ["never-copied", "unversioned"])
case("missing_copies ignores ecosystem itself",
     "ecosystem" in names(_spec.missing_copies(NOTES, root)), False)
case("missing_copies ignores non-repos",
     "not-a-repo" in names(_spec.missing_copies(NOTES, root)), False)
# SYSTEM.md is what marks a directory as a repo in the set, so it cannot be
# the thing that is missing from one — that would report every directory.
case("missing_copies of SYSTEM.md is empty",
     _spec.missing_copies(SPEC, root), [])

# One list, no second class. DECISIONS.md was protected but not versioned,
# so it was guarded against editing and unable to say whether a copy was
# stale — the two lists disagreeing is what allowed that.
case("protected and versioned are the same set",
     sorted(_spec.PROTECTED), sorted(_spec.VERSIONED))
case("all three names are on it",
     sorted(_spec.VERSIONED), sorted([SPEC, DEC, NOTES]))
case("missing_copies works for DECISIONS.md too",
     names(_spec.missing_copies(DEC, root)),
     ["behind", "edited", "never-copied", "unversioned"])

# ---------------------------------------------------------------------------
# 3. Version and placement
# ---------------------------------------------------------------------------
case("version reads the line", _spec.version(root / "ecosystem" / SPEC), (2, 8))
case("version of an unversioned file", _spec.version(root / "unversioned" / SPEC), None)
case("version of a file that is not there", _spec.version(root / "nope" / SPEC), None)
case("notes version is the set's version", _spec.version(root / "ecosystem" / NOTES), (2, 8))

pending, drifted, unknown = _spec.classify((2, 8), [
    (root / "behind" / SPEC, (2, 3)),
    (root / "edited" / SPEC, (2, 8)),
    (root / "unversioned" / SPEC, None),
    (root / "ahead" / SPEC, (2, 9)),
])
case("behind is pending, not drift", names(pending), ["behind"])
case("same version + different bytes is drift", names(drifted), ["ahead", "edited"])
case("no version line is unknown, not behind", names(unknown), ["unversioned"])
# §2.1: if the source cannot be placed either, nothing is behind it.
p2, d2, u2 = _spec.classify(None, [(root / "behind" / SPEC, (2, 3))])
case("unreadable source makes everything unknown", (names(p2), names(u2)), ([], ["behind"]))

# ---------------------------------------------------------------------------
# 4. Placement of a path — the fix for a guard that matched on basename
# ---------------------------------------------------------------------------
fixture_dir = tmp / "scratch"
write(fixture_dir / SPEC, "a throwaway fixture, not a spec file\n")

link_dir = tmp / "via-symlink"
link_dir.mkdir()
os.symlink(root / "up-to-date" / SPEC, link_dir / SPEC)

outside = tmp / "outside" / "repo"
write(outside / SPEC, doc("2.8"))
os.symlink(outside, root / "linked-repo")

case("a real spec file is inside", _spec.under_projects(root / "up-to-date" / SPEC, root), True)
case("a fixture elsewhere is not", _spec.under_projects(fixture_dir / SPEC, root), False)
case("a symlink pointing in is inside", _spec.under_projects(link_dir / SPEC, root), True)
case("a symlinked repo is still inside", _spec.under_projects(root / "linked-repo" / SPEC, root), True)
case("no path at all", _spec.under_projects("", root), False)
case("a path that does not exist yet",
     _spec.under_projects(root / "new-repo" / SPEC, root), True)
# Documented over-block: one reading of this path is inside, so it is blocked.
case("dot-dot out of the tree still blocks",
     _spec.under_projects(str(root) + "/../scratch/" + SPEC, root), True)

# ---------------------------------------------------------------------------
# 5. References resolve against the document they point into
# ---------------------------------------------------------------------------
refs = tmp / "refs"
write(refs / SPEC, "## 2. Rules\n\n**2.6 Nothing projects**\n\n## 9. The global app\n")
# The operating-notes shape: its own §4 heading, and a §2.6 that only the
# other document defines. Checked against itself, §4 resolves to the wrong
# section and reads clean; §2.6 is correctly reported. Checked against
# SYSTEM.md, §4 is the real finding and §2.6 is fine.
write(refs / NOTES, "## 4. An item\n\nsee §4 and §2.6\n")


def refcheck(target, defs=None):
    cmd = [sys.executable, str(CHECK_REFS), str(refs / target)]
    if defs:
        cmd += ["--defs", str(refs / defs)]
    return subprocess.run(cmd, capture_output=True, text=True).returncode


case("SYSTEM.md against itself is clean", refcheck(SPEC), 0)
case("notes against itself: hides the wrong ref", refcheck(NOTES), 1)
case("notes against SYSTEM.md: finds it", refcheck(NOTES, SPEC), 1)
# And the same file with only resolvable references passes, so the check above
# is failing on the reference and not on the arrangement.
write(refs / NOTES, "## 4. An item\n\nsee §9 and §2.6\n")
case("notes with only real refs passes", refcheck(NOTES, SPEC), 0)
case("a --defs file that is not there", refcheck(NOTES, "absent.md"), 2)
case("--defs with nothing after it",
     subprocess.run([sys.executable, str(CHECK_REFS), str(refs / NOTES), "--defs"],
                    capture_output=True, text=True).returncode, 2)


# ---------------------------------------------------------------------------
# 6. Tooling on the canonical list: consensus, not direction
# ---------------------------------------------------------------------------
#
# Added 2026-09-06 with the check itself. The live tree is one arrangement in
# which the tools happen to agree, so testing against it would prove only that
# comparing identical files returns one group — bug family (c) again. These are
# the arrangements that decide whether a real disagreement gets reported.
tool = tmp / "tools"

# Two app repos (SYSTEM.md + package.json), one spec source (SYSTEM.md only,
# no package.json — this is ecosystem's shape), and one directory that is
# neither and must be ignored entirely.
for name in ("app-one", "app-two"):
    write(tool / name / SPEC, doc("3.0"))
    write(tool / name / "package.json", "{}")
    write(tool / name / "check-refs.py", "same\n")
    write(tool / name / ".claude" / "settings.json", "{}\n")
    write(tool / name / ".claude" / "hooks" / "a.py", "hook a\n")
write(tool / "spec-source" / SPEC, doc("3.0"))
write(tool / "spec-source" / "check-refs.py", "same\n")
write(tool / "not-a-repo" / "README.md", "nothing to do with this")

repos = _spec.app_repos(tool)
case("app repos are the ones with a package.json", names([p / "x" for p in repos]),
     ["app-one", "app-two"])
case("the spec source is not an app repo",
     "spec-source" in [p.name for p in repos], False)

case("hook names are the union across repos", _spec.hook_names(repos), ["a.py"])

groups, absent = _spec.compare_tooling("check-refs.py", repos,
                                       extra=[tool / "spec-source"])
case("agreeing copies are one group", len(groups), 1)
case("the spec source is included where it has a copy",
     sorted(p.name for p in list(groups.values())[0]),
     ["app-one", "app-two", "spec-source"])
case("nothing is missing when everything agrees", absent, [])

# The spec source has no .claude at all, which is ecosystem's real shape. It
# must not be reported missing for a file it is not required to hold.
groups, absent = _spec.compare_tooling(".claude/settings.json", repos,
                                       extra=[tool / "spec-source"])
case("the spec source is not missing hooks it never holds", absent, [])
case("only the app repos are compared for hooks", len(list(groups.values())[0]), 2)

# Now break it. One repo's hook differs.
write(tool / "app-two" / ".claude" / "hooks" / "a.py", "hook a, edited\n")
groups, absent = _spec.compare_tooling(".claude/hooks/a.py", repos)
case("a differing copy makes a second group", len(groups), 2)
case("each version names who holds it",
     sorted(len(v) for v in groups.values()), [1, 1])

# And remove it. Missing is reported separately from disagreement, never
# folded into it (§2.1).
(tool / "app-two" / ".claude" / "hooks" / "a.py").unlink()
groups, absent = _spec.compare_tooling(".claude/hooks/a.py", repos)
case("a missing copy is reported, not counted as agreement",
     [p.name for p in absent], ["app-two"])
case("the copies that do exist still group", len(groups), 1)

# A hook only one repo has is still watched everywhere — the union, not one
# repo's listing, so a repo cannot lose a hook and its check together.
write(tool / "app-one" / ".claude" / "hooks" / "b.py", "hook b\n")
case("a hook present in one repo is watched in all",
     _spec.hook_names(_spec.app_repos(tool)), ["a.py", "b.py"])
groups, absent = _spec.compare_tooling(".claude/hooks/b.py", _spec.app_repos(tool))
case("the repo without it is named", [p.name for p in absent], ["app-two"])

case("no app repos at all is not agreement", _spec.app_repos(tmp / "nothing-here"), [])

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# 7. CLAUDE.md's @imports
# ---------------------------------------------------------------------------
#
# These readers arrived with the check that found ~/Projects/ecosystem
# importing @AGENTS.md, a file it has never had. They arrived without tests,
# which is how the next change to them would go unnoticed.
imports_root = tmp / "imports"
write(imports_root / "app" / "CLAUDE.md", "@AGENTS.md\n@~/Projects/shared.md\n@./nope.md\n")
write(imports_root / "app" / "AGENTS.md", "here\n")
write(imports_root / "plain" / "CLAUDE.md", "no imports at all\n")

case("claude_files finds one per directory",
     sorted(p.parent.name for p in _spec.claude_files(imports_root)), ["app", "plain"])
case("claude_files skips directories without one",
     _spec.claude_files(tmp / "nope"), [])

found = _spec.imports(imports_root / "app" / "CLAUDE.md")
case("every @import on its own line is read", [spec for spec, _ in found],
     ["AGENTS.md", "~/Projects/shared.md", "./nope.md"])
case("a relative import resolves beside the file",
     dict(found)["AGENTS.md"].resolve(), (imports_root / "app" / "AGENTS.md").resolve())
case("a ~ import resolves against home",
     str(dict(found)["~/Projects/shared.md"]).startswith(str(Path.home())), True)
case("which of them exist is the caller's question",
     [spec for spec, target in found if not target.exists()],
     ["~/Projects/shared.md", "./nope.md"])
case("a file with no imports yields none",
     _spec.imports(imports_root / "plain" / "CLAUDE.md"), [])

# Deliberately not matched: an inline @ inside prose. Claude Code supports
# those, but every @ in these files that is not alone on a line is an npm
# scope or an address, and a false finding trains him to ignore the whole
# message -- which costs the other four checks too.
write(imports_root / "prose" / "CLAUDE.md", "see @nextjs/whatever and mail a@b.com\n")
case("an inline @ in prose is not an import",
     _spec.imports(imports_root / "prose" / "CLAUDE.md"), [])

shutil.rmtree(tmp, ignore_errors=True)

width = max(len(r[0]) for r in results)
print(f"=== spec logic, synthetic trees ({repo.name}) ===")
failed = 0
for label, got, want, ok in results:
    if ok:
        print(f"  {label:{width}}  PASS")
    else:
        failed += 1
        print(f"  {label:{width}}  *** FAIL ***  want {want!r}  got {got!r}")
print(f"  {len(results) - failed}/{len(results)} pass"
      + ("" if not failed else f"  *** {failed} FAILED ***"))
sys.exit(1 if failed else 0)
