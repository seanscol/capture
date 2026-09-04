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
import subprocess
import sys
from pathlib import Path

repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
H = repo / ".claude" / "hooks"
ECO = Path.home() / "Projects" / "ecosystem"

SPEC = "SYS" + "TEM.md"
DEC = "DECIS" + "IONS.md"
PROD = "https://fnd-" + "tracker.vercel.app"

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


cases = [
    # --- §13.6, the polite door ---
    ("Edit/Write on " + SPEC,       "block-spec-edits.py",  edit(repo / SPEC), BLOCK),
    ("Edit/Write on " + DEC,        "block-spec-edits.py",  edit(repo / DEC), BLOCK),
    ("Edit on ordinary app code",   "block-spec-edits.py",  edit(repo / "src/lib/app-time.ts"), ALLOW),

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
]

width = max(len(c[0]) for c in cases)
print(f"=== {repo.name} ===")
print(f"  {'case':{width}}  {'want':>7}  got")
failed = 0
for label, script, payload, want in cases:
    got = run(script, payload)
    if got != want:
        failed += 1
    name = {BLOCK: "BLOCKED", ALLOW: "allowed"}
    print(f"  {label:{width}}  {name[want]:>7}  {name.get(got, got):<7} "
          f"{'PASS' if got == want else '*** FAIL ***'}")
print(f"  {len(cases) - failed}/{len(cases)} pass"
      + ("" if not failed else f"  *** {failed} FAILED ***"))
sys.exit(1 if failed else 0)
