#!/usr/bin/env python3
"""PM Pipeline Health Monitor — checks all running processes and kanban cards."""

import subprocess, json, os, sys
from datetime import datetime

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)

def check_claude_processes():
    """Check all claude -p background processes."""
    processes = {
        "gap-closure": "/tmp/gap-closure.log",
        "manual-verify": "/tmp/manual-verify.log",
        "animation-vfx": "/tmp/animation-vfx-overhaul.log",
        "reviewer-pass1": "/tmp/reviewer-pass1.log",
    }
    results = {}
    for name, logfile in processes.items():
        if not os.path.exists(logfile):
            results[name] = "MISSING"
            continue
        with open(logfile) as f:
            content = f.read()
        lines = content.count('\n')
        has_result = '"type":"result"' in content
        if has_result:
            # Extract result subtype
            import re
            match = re.search(r'"subtype":"(\w+)"', content[content.rfind('"type":"result"'):])
            subtype = match.group(1) if match else "unknown"
            results[name] = f"DONE ({subtype})"
        else:
            # Check last activity
            last_line = content.strip().split('\n')[-1] if content.strip() else ""
            if "thinking_tokens" in last_line:
                results[name] = f"THINKING ({lines} lines)"
            elif "tool_use" in last_line:
                results[name] = f"WORKING ({lines} lines)"
            else:
                results[name] = f"RUNNING ({lines} lines)"
    return results

def check_kanban_board():
    """Check kanban card status."""
    r = run("hermes kanban list 2>&1")
    cards = {"done": 0, "running": 0, "blocked": [], "todo": 0, "ready": 0}
    for line in r.stdout.split('\n'):
        if line.startswith('✓'): cards["done"] += 1
        elif line.startswith('●'): cards["running"] += 1
        elif line.startswith('⊘'):
            cards["blocked"].append(line.strip()[:80])
        elif line.startswith('◻'): cards["todo"] += 1
        elif line.startswith('▶'): cards["ready"] += 1
    return cards

def check_git_state():
    """Check git working tree."""
    r = run("cd /Users/vic/claude/forgotten-mistory && git status --short 2>&1 | wc -l")
    changed = int(r.stdout.strip() or 0)
    r2 = run("cd /Users/vic/claude/forgotten-mistory && npx tsc --noEmit 2>&1 | tail -1")
    tsc_clean = "error" not in r2.stdout.lower() and "found" not in r2.stdout.lower()
    return {"changed_files": changed, "tsc_clean": tsc_clean}

def check_reviewer_output():
    """Extract reviewer failures if available."""
    logfile = "/tmp/reviewer-pass1.log"
    if not os.path.exists(logfile):
        return "NO_LOG"
    with open(logfile) as f:
        content = f.read()
    if '"type":"result"' not in content:
        return "STILL_RUNNING"
    # Try to extract JSON result
    import re
    match = re.search(r'"type":"result".*?"content":\[{"type":"text","text":"([^"]*)"', content[content.rfind('"type":"result"'):])
    if match:
        return match.group(1)[:500]
    return "RESULT_PRESENT"

# Main
print(f"=== PM PIPELINE HEALTH @ {datetime.now().strftime('%H:%M:%S')} ===\n")

print("CLAUDE-CODE PROCESSES:")
for name, status in check_claude_processes().items():
    icon = "✓" if "DONE" in status else "●" if "RUNNING" in status or "THINKING" in status or "WORKING" in status else "✗"
    print(f"  {icon} {name}: {status}")

print("\nKANBAN BOARD:")
board = check_kanban_board()
print(f"  ✓ Done: {board['done']}  ● Running: {board['running']}  ◻ Todo: {board['todo']}  ▶ Ready: {board['ready']}")
if board['blocked']:
    print(f"  ⊘ BLOCKED ({len(board['blocked'])}):")
    for b in board['blocked']:
        print(f"    {b}")

print("\nGIT STATE:")
git = check_git_state()
print(f"  Changed files: {git['changed_files']}  tsc clean: {git['tsc_clean']}")

print(f"\nREVIEWER: {check_reviewer_output()}")
print("\n=== END ===")
