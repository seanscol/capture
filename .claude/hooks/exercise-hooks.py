"""Exercise the PreToolUse hooks in a given repo.

    python3 .claude/hooks/exercise-hooks.py .

Every trigger string is assembled from fragments. Written that way because the
straightforward version was blocked twice by the hook under test: the payload
contained the pattern, and the hook cannot tell a rehearsal from the real
thing. That is correct behaviour and is worth recording as evidence.

The cases that must be ALLOWED matter as much as the ones that must be
blocked. A hook that denies everything passes no test worth having, and the
first version of this one blocked a commit message and the §13.6 copy itself.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
H = repo / ".claude" / "hooks"
ECO = Path.home() / "Projects" / "ecosystem"

SPEC = "SYS" + "TEM.md"
DEC = "DECIS" + "IONS.md"
NOTES = "operating-" + "notes.md"
PROD = "https://fnd-" + "tracker.vercel.app"

# A directory outside ~/Projects holding files with spec-file names. They are
# not spec files — the name is not the thing — and until 2026-09-06 the
# Edit/Write hook blocked them anyway, which meant the guards for this rule
# could not be tested with fixtures named after the files they guard.
OUTSIDE = Path(tempfile.mkdtemp(prefix="not-the-spec-"))
(OUTSIDE / SPEC).write_text("a fixture that happens to share a name\n")
(OUTSIDE / NOTES).write_text("also a fixture\n")
(OUTSIDE / "link").mkdir()
os.symlink(repo / SPEC, OUTSIDE / "link" / SPEC)

BLOCK, ALLOW = 2, 0


def run(script, payload):
    r = subprocess.run(
        ["python3", str(H / script)], input=json.dumps(payload),
        capture_output=True, text=True,
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(repo)},
    )
    return r.returncode


def edit(path):
    return {"tool_input": {"file_path": str(path)}}


def bash(command, cwd=None):
    return {"tool_input": {"command": command}, "cwd": str(cwd or repo)}


# --- a hooks directory whose _spec.py cannot be imported -------------------
# The one definition of what is protected lives in _spec.py. If that import
# fails the hook cannot tell a spec file from any other file, and the branch
# that decides what it does then is the difference between a guard and a
# formality. It blocks — except inside its own directory, so the repair is
# still possible. Both halves are cases below.
BROKEN = Path(tempfile.mkdtemp(prefix="broken-spec-")) / "hooks"
BROKEN.mkdir(parents=True)
shutil.copy(H / "block-spec-edits.py", BROKEN)
(BROKEN / "_spec.py").write_text("this is not python(\n")


def run_broken(payload):
    r = subprocess.run(
        ["python3", str(BROKEN / "block-spec-edits.py")],
        input=json.dumps(payload), capture_output=True, text=True,
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(repo)},
    )
    return r.returncode


cases = [
    # --- §13.6, the polite door ---
    ("Edit/Write on " + SPEC,       "block-spec-edits.py",  edit(repo / SPEC), BLOCK),
    ("Edit/Write on " + DEC,        "block-spec-edits.py",  edit(repo / DEC), BLOCK),
    # Part of the spec under §4A, and guarded by nothing at all until now.
    ("Edit/Write on " + NOTES,      "block-spec-edits.py",  edit(repo / NOTES), BLOCK),
    ("Edit on ordinary app code",   "block-spec-edits.py",  edit(repo / "src/lib/app-time.ts"), ALLOW),

    # The name is not the thing. A file called SYSTEM.md in a temp directory
    # is a fixture, and blocking it was enforcement matching coarser than the
    # rule — the third time that has come up.
    ("Edit a " + SPEC + " outside ~/Projects",  "block-spec-edits.py", edit(OUTSIDE / SPEC), ALLOW),
    ("Edit a " + NOTES + " outside ~/Projects", "block-spec-edits.py", edit(OUTSIDE / NOTES), ALLOW),
    # ...but a symlink from outside, pointing at the real one, is the real one.
    ("Edit a symlink to the real " + SPEC, "block-spec-edits.py",
     edit(OUTSIDE / "link" / SPEC), BLOCK),

    # --- §7, production writes ---
    ("Bash POST to production",     "block-prod-writes.py", bash("curl -X " + "POST " + PROD + "/api/quick"), BLOCK),
    ("Bash DELETE to production",   "block-prod-writes.py", bash("curl -X " + "DELETE " + PROD + "/api/logs?id=1"), BLOCK),
    ("Bash GET from production",    "block-prod-writes.py", bash("curl -s " + PROD + "/api/widget"), ALLOW),
    ("Bash POST to localhost",      "block-prod-writes.py", bash("curl -X " + "POST " + "http://localhost:3000/api/quick"), ALLOW),

    # --- §13.6, the side door ---
    ("Bash redirect into spec",     "block-prod-writes.py", bash("echo x " + "> " + SPEC), BLOCK),
    ("Bash sed -" + "i on spec",    "block-prod-writes.py", bash("sed " + "-i '' s/a/b/ " + SPEC), BLOCK),
    ("Bash rm of spec",             "block-prod-writes.py", bash("rm -f " + SPEC), BLOCK),
    ("Bash grep of spec (read)",    "block-prod-writes.py", bash("grep -n rule " + SPEC), ALLOW),

    # The side door on the third spec file. This hook built its pattern from
    # its own list of two names, so every one of these was allowed through.
    ("Bash redirect into notes",    "block-prod-writes.py", bash("echo x " + "> " + NOTES), BLOCK),
    ("Bash sed -" + "i on notes",   "block-prod-writes.py", bash("sed " + "-i '' s/a/b/ " + NOTES), BLOCK),
    ("Bash rm of notes",            "block-prod-writes.py", bash("rm -f " + NOTES), BLOCK),
    ("Bash cat of notes (read)",    "block-prod-writes.py", bash("cat " + NOTES), ALLOW),

    # On 2026-09-04 the commit message introducing these hooks was itself
    # blocked. It described the hook -- a copy verb on one line, the spec file
    # twenty lines later -- and the gap between them was [^|;&]*, which matches
    # newlines even though `.` does not. The whole heredoc read as one command.
    ("Bash multi-line prose",       "block-prod-writes.py",
     bash("git commit -m 'mentions cp and mv here\n\nand " + SPEC + " twenty lines later'"), ALLOW),

    # --- §13.6's own copy, which the first version of the hook blocked ---
    # Without these, §13.7 step 1 is un-repeatable: v2.4 cannot be installed
    # the way v2.3 was, because the planning chat cannot write to disk and the
    # code session that must run the copy is denied.
    ("Copy OUT of ecosystem",       "block-prod-writes.py", bash(f"cp {ECO}/{SPEC} {repo}/"), ALLOW),
    ("Copy OUT, relative + cwd",    "block-prod-writes.py", bash(f"cp {SPEC} {DEC} {repo}/", cwd=ECO), ALLOW),
    ("Copy OUT, tilde path",        "block-prod-writes.py", bash(f"cp ~/Projects/ecosystem/{SPEC} {repo}/"), ALLOW),
    # The form the copy is actually written in. The first version of the
    # allowance passed its unit test and was still blocked live: the test
    # handed the hook cwd=ecosystem, while the real command carries the `cd`
    # inside itself and the payload's cwd is the repo. The cwd below is
    # deliberately the repo, because that is what the payload really says.
    ("Copy OUT after cd",           "block-prod-writes.py",
     bash(f"cd ~/Projects/ecosystem && cp {SPEC} {DEC} {repo}/ && echo done", cwd=repo), ALLOW),
    ("cd elsewhere then copy in",   "block-prod-writes.py",
     bash(f"cd /tmp && cp {SPEC} {repo}/", cwd=repo), BLOCK),
    # The direction is the authority. These are the ones that fork the spec.
    ("Copy INTO ecosystem",         "block-prod-writes.py", bash(f"cp {repo}/{SPEC} {ECO}/"), BLOCK),
    ("Copy INTO eco, relative",     "block-prod-writes.py", bash(f"cp {SPEC} {ECO}/", cwd=repo), BLOCK),
    ("Copy repo to repo",           "block-prod-writes.py", bash(f"cp {repo}/{SPEC} /tmp/other/"), BLOCK),
    ("mv OUT of ecosystem",         "block-prod-writes.py", bash(f"mv {ECO}/{SPEC} {repo}/"), BLOCK),
    ("Copy over spec from /tmp",    "block-prod-writes.py", bash(f"cp /tmp/x {SPEC}", cwd=repo), BLOCK),

    # The copy this session has to run: all three files, one pass, out of
    # ecosystem. If this were blocked, §13.7 step 1 would be un-repeatable for
    # the third file the same way it was for the first two.
    ("Copy all three OUT",          "block-prod-writes.py",
     bash(f"cd ~/Projects/ecosystem && cp {SPEC} {DEC} {NOTES} {repo}/", cwd=repo), ALLOW),
    ("Copy notes INTO ecosystem",   "block-prod-writes.py", bash(f"cp {repo}/{NOTES} {ECO}/"), BLOCK),
]

# Run with the hook's one definition unreadable. A guard that fails open is
# not a guard, and a guard that fails closed over its own repair is the bug
# the Bash hook had on 2026-09-04 — so both directions are asserted.
broken_cases = [
    ("_spec.py broken: ordinary edit", edit(repo / "src/lib/app-time.ts"), BLOCK),
    ("_spec.py broken: fixing a hook", edit(BROKEN / "_spec.py"), ALLOW),
]

width = max(len(c[0]) for c in cases + broken_cases)
print(f"=== {repo.name} ===")
print(f"  {'case':{width}}  {'want':>7}  got")
failed = 0
name = {BLOCK: "BLOCKED", ALLOW: "allowed"}
for label, script, payload, want in cases:
    got = run(script, payload)
    if got != want:
        failed += 1
    print(f"  {label:{width}}  {name[want]:>7}  {name.get(got, got):<7} "
          f"{'PASS' if got == want else '*** FAIL ***'}")
for label, payload, want in broken_cases:
    got = run_broken(payload)
    if got != want:
        failed += 1
    print(f"  {label:{width}}  {name[want]:>7}  {name.get(got, got):<7} "
          f"{'PASS' if got == want else '*** FAIL ***'}")
cases = cases + broken_cases
shutil.rmtree(OUTSIDE, ignore_errors=True)
shutil.rmtree(BROKEN.parent, ignore_errors=True)
print(f"  {len(cases) - failed}/{len(cases)} pass"
      + ("" if not failed else f"  *** {failed} FAILED ***"))
sys.exit(1 if failed else 0)
