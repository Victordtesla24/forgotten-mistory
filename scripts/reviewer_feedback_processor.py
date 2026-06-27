#!/usr/bin/env python3
"""Reviewer Feedback Processor — extract failures and generate fix prompts."""
import json, os, sys, re, subprocess

def parse_reviewer_output(logfile):
    """Extract reviewer PASS/FAIL results from stream-json log."""
    if not os.path.exists(logfile):
        return {"status": "NO_LOG"}

    with open(logfile) as f:
        content = f.read()

    if '"type":"result"' not in content:
        return {"status": "STILL_RUNNING"}

    # Find the last assistant text before result
    lines = content.split('\n')
    assistant_texts = []
    for line in lines:
        if '"type":"assistant"' not in line:
            continue
        try:
            d = json.loads(line)
            for c in d.get('message', {}).get('content', []):
                if c.get('type') == 'text':
                    assistant_texts.append(c['text'])
        except:
            pass

    if not assistant_texts:
        return {"status": "NO_TEXT"}

    full_text = '\n'.join(assistant_texts[-3:])  # Last 3 assistant messages

    # Extract failures
    failures = []
    # Look for FAIL patterns
    fail_patterns = re.findall(r'(t_\w+).*?(?:FAIL|fail|Fail).*?(?:file|path).*?([^\s,]+:\d+)', full_text, re.IGNORECASE)
    for card_id, file_loc in fail_patterns:
        failures.append({"card": card_id, "file": file_loc, "raw": ""})

    # Also try to parse JSON blocks
    json_blocks = re.findall(r'\{[^}]+\}', full_text)
    for block in json_blocks:
        try:
            d = json.loads(block)
            if 'failures' in d:
                return {"status": "PARSED", "failures": d['failures'], "overall_pass": d.get('overall_pass', False)}
            if 'cards' in d:
                for card_id, result in d['cards'].items():
                    if not result.get('pass', False):
                        for issue in result.get('issues', []):
                            failures.append({"card": card_id, "issue": str(issue)[:200]})
        except:
            pass

    return {"status": "EXTRACTED", "failures": failures, "full_text": full_text[:1000]}

def generate_fix_prompt(failure):
    """Generate a fix orchestrator task prompt for a single failure."""
    card_id = failure.get('card', 'unknown')
    file_loc = failure.get('file', 'unknown')
    issue = failure.get('issue', failure.get('raw', 'Reviewer flagged this card as FAIL'))

    return f"""# FIX ORCHESTRATOR — Reviewer Feedback Remediation

## YOUR ROLE
Fix orchestrator (claude-opus-4-8, Max billing). Fix the specific issue flagged by the independent reviewer. Minimum scope — fix ONLY this issue.

## PROJECT ROOT
/Users/vic/claude/forgotten-mistory

## REVIEWER FEEDBACK
- Card: {card_id}
- File: {file_loc}
- Issue: {issue}

## PROCEDURE
1. Read the flagged file(s)
2. Fix the specific issue
3. Verify: npx tsc --noEmit && npm run lint
4. Write the fixed file
5. Update kanban card {card_id} with comment "PM: Fixed per reviewer feedback — {issue[:80]}"

## RULES
- Fix ONLY what the reviewer flagged — no scope creep
- Preserve all existing working behavior (C2)
- Do not create new files if extending existing works (C3)
- TDD: if the fix requires new behavior, write a test first
"""

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--logfile', default='/tmp/reviewer-pass1.log')
    parser.add_argument('--generate-prompts', action='store_true', help='Generate fix prompt files')
    args = parser.parse_args()

    print("=== REVIEWER FEEDBACK PROCESSOR ===\n")

    result = parse_reviewer_output(args.logfile)
    print(f"Status: {result['status']}")

    if result['status'] in ('NO_LOG', 'STILL_RUNNING', 'NO_TEXT'):
        return

    failures = result.get('failures', [])
    if not failures:
        print("\n✓ No failures found — all cards PASS reviewer inspection")
        return

    print(f"\n⊘ FAILURES FOUND: {len(failures)}")
    for i, f in enumerate(failures):
        print(f"  {i+1}. Card: {f.get('card','?')} | File: {f.get('file','?')}")
        print(f"     Issue: {f.get('issue', f.get('raw','?'))[:200]}")

    if args.generate_prompts:
        for i, f in enumerate(failures):
            prompt = generate_fix_prompt(f)
            path = f"/tmp/fix-{f.get('card','unknown')}.md"
            with open(path, 'w') as fh:
                fh.write(prompt)
            print(f"\n  Fix prompt written: {path}")

        print(f"\nTo dispatch all fixes:")
        for i, f in enumerate(failures):
            card = f.get('card', 'unknown')
            print(f"  cat /tmp/fix-{card}.md | claude -p --model claude-opus-4-8 --effort max --max-turns 30 --output-format stream-json --verbose 2>&1 | tee /tmp/fix-{card}.log &")

    print(f"\nPM ACTION REQUIRED: Review failures, spawn fix orchestrators, re-run reviewer.")

if __name__ == '__main__':
    main()
