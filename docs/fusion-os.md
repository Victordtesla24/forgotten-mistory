# Building Production-Grade Agentic Coding Systems with OpenRouter Fusion

## Architecture Overview

Fusion is a **server-side multi-model deliberation pipeline** — not a model replacement, not a majority-vote oracle. The outer model (your agent) decides when to invoke it, and when it does, a panel of 1–8 models analyzes the prompt in parallel (each with optional web search), a judge model synthesizes their responses into structured JSON (`consensus`, `contradictions`, `partial_coverage`, `unique_insights`, `blind_spots`), and your outer model writes the final answer or triggers the next action.

The critical truth: **Fusion is a deliberation tool for your agent, not the agent itself.** The outer model still handles all coding decisions. Fusion handles the thinking on high-stakes questions.

---



## 1. Optimal API Call Patterns & System Prompt Design



### Choose the server tool, not the model alias

For agentic coding, always use `"type": "openrouter:fusion"` **in the** `tools` **array** rather than the `openrouter/fusion` model alias. The server tool gives you:

- Control over the outer model (the orchestrator that decides *when* to deliberate)
- Ability to mix Fusion with your own coding tools (file ops, shell, tests, VCS) in the same loop
- Independent configuration of the panel and judge models
- Selective invocation — the model calls Fusion only when the problem warrants it

```python
import requests
import json

response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={
        "model": "deepseek/deepseek-v4-pro",   # your primary coding model
        "messages": messages,
        "tools": [
            # Your coding tools
            {"type": "function", "function": {"name": "read_file", ...}},
            {"type": "function", "function": {"name": "write_file", ...}},
            {"type": "function", "function": {"name": "run_tests", ...}},
            # Fusion as a deliberation tool
            {
                "type": "openrouter:fusion",
                "parameters": {
                    "analysis_models": [
                        "z-ai/glm-5.2",               
                        "moonshotai/kimi-k2.7-code",
                        "qwen/qwen3.7-plus",
                        "minimax/minimax-m3",         
                    ],
                    "model": "deepseek/deepseek-v4-pro",  # judge
                    "max_tool_calls": 8,
                    "temperature": 0.2,
                    "max_completion_tokens": 1000000,
                },
            },
        ],
        "parallel_tool_calls": False,  # sequential for correctness in coding
    },
)
```



### Panel composition strategies

Different deliberation purposes warrant different panel configurations:

**Architecture/design decisions** — diverse frontier models for maximal perspective diversity:

```python
ARCHITECTURE_PANEL = {
    "analysis_models": [
        "deepseek/deepseek-v4-pro",     
        "z-ai/glm-5.2",               
        "moonshotai/kimi-k2.7-code",
        "qwen/qwen3.7-plus",
        "minimax/minimax-m3",         
    ],
    "model": "deepseek/deepseek-v4-pro",
    "temperature": 0.2,
}
```

**Code review / correctness verification** — include a model known for catching bugs:

```python
REVIEW_PANEL = {
    "analysis_models": [
        "z-ai/glm-5.2",               
        "moonshotai/kimi-k2.7-code",
        "qwen/qwen3.7-plus",
        "minimax/minimax-m3",      
    ],
    "model": "deepseek/deepseek-v4-pro",
    "temperature": 0.1,            # very low for review precision
}
```

**Budget panel for frequent/non-critical deliberation** — cheap panel + frontier judge. OpenRouter's own benchmark showed this achieves near-frontier performance at ~50% cost:

```python
BUDGET_PANEL = {
    "analysis_models": [
        "z-ai/glm-5.2",               
        "moonshotai/kimi-k2.7-code",
        "qwen/qwen3.7-plus",
        "minimax/minimax-m3", 
    ],
    "model": "deepseek/deepseek-v4-pro",  # frontier judge, cheap panel
    "temperature": 0.2,
}
```



### Temperature and reasoning configuration

- **Panel temperature**: 0.1–0.2 for convergent, focused answers on coding tasks
- **Judge temperature**: always 0 (server-enforced) — deterministic synthesis your agent can rely on
- `max_completion_tokens`: cap to prevent reasoning-heavy models from burning budget before producing visible text
- `reasoning.effort`: `"medium"` for standard deliberation, `"high"` only for the most complex architecture questions



### System prompt design for agentic coding

```python
The system prompt must teach the agent **a decision framework** for when to call Fusion vs. act directly:

You are an expert software engineer working in an agentic coding loop.

## Decision Framework for Tool Selection

### Use your coding tools DIRECTLY when:

- Implementing a specific, well-defined change
- Reading or modifying existing code
- Running tests to verify behavior
- Navigating the codebase to understand structure

### Invoke openrouter:fusion when:

- Making ARCHITECTURE decisions (which pattern, library, abstraction)
- Researching BEST PRACTICES for an unfamiliar domain or API
- The task involves TRADE-OFFS where being wrong is expensive
- You need to COMPARE approaches ("use X or Y?")
- Debugging a subtle issue where multiple hypotheses exist
- The cost of being wrong exceeds ~5× the cost of a single completion

### Do NOT invoke fusion when:

- The task is mechanical (rename a variable, add an import)
- You already know the answer with high confidence
- Speed matters more than thoroughness
- The question is purely about local code you can read directly

## Fusion Result Protocol

When you receive fusion analysis:

- CONSENSUS items: Treat as high-confidence. Implement these directly.
- CONTRADICTIONS: You MUST resolve these before implementing.
  Read docs, check the codebase, or run experiments.
- BLIND_SPOTS: These are risks. Address them explicitly or document why they're acceptable.
- UNIQUE_INSIGHTS: Evaluate each one — some are valuable, some are wrong.

## Critical Rules

- NEVER invent APIs, functions, or imports that don't exist in the codebase
- NEVER skip reading a file before modifying it
- ALWAYS run tests after making changes
- If you're uncertain about something, use fusion to deliberate — don't guess
- One fusion call per turn — the system enforces this

### Self-contained Fusion prompts

The panel models see only what you pass in the tool call — not the full conversation history. Always compose a self-contained sub-prompt:

**Bad:** "What do you think about the approach I mentioned?"

**Good:** "We need to choose between Redis Streams and RabbitMQ for an event-sourcing backbone in a Node 20 service. Constraints: exactly-once processing required, max 50ms p99 end-to-end latency, team has no RabbitMQ ops experience. Return a ranked recommendation with failure-mode analysis focused on production reliability."
```

---



## 2. Orchestration Layer: When to Call Fusion vs. Regular Models vs. Tools



### Three-tier task classification

Rather than relying solely on the model's judgment, implement an explicit classification layer:


| Tier       | Task Type                | Route To                        | Example                                                  |
| ---------- | ------------------------ | ------------------------------- | -------------------------------------------------------- |
| **Tier-0** | Trivial/mechanical       | No LLM, deterministic tools     | Syntax fixes, file renames, test scaffolding             |
| **Tier-1** | Standard implementation  | Single strong model (no Fusion) | Feature implementation, refactoring, routine debugging   |
| **Tier-2** | High-stakes deliberation | Fusion escalation               | Architecture decisions, security review, ambiguous specs |




### Decision rules for escalation to Fusion

```python
def should_escalate_to_fusion(step: AgentStep) -> bool:
    """Gate Fusion behind explicit conditions, not model whim."""
    if step.intent in HIGH_STAKES_TAGS:         # schema, auth, payments
        return True
    if step.touches_files_globally("**/auth/**", "**/migrations/**"):
        return True
    if step.has_unresolved_disagreement():       # reviewer vs author split
        return True
    if step.consecutive_test_failures >= 2:      # stuck on a bug
        return True
    if step.requires_external_knowledge() and not step.has_recent_research():
        return True
    if step.is_first_pass_of_large_feature():    # upfront architecture
        return True
    return False
```



### Two strategies for enforcing routing

**Strategy A: Dynamic tool availability (recommended for strict control)**

Don't expose `openrouter:fusion` in the tools array until your orchestrator wants it. Add/remove the tool between turns based on your state machine. This is cleaner than relying on the model to self-discipline.

**Strategy B: Permanent tool + system prompt discipline**

Keep Fusion in the tools array alongside coding tools. Use the system prompt to teach routing discipline and optionally `tool_choice: "required"` with the Fusion tool name to force it on specific turns (e.g., mandatory pre-commit review).

### Forcing Fusion on critical decision points

```python
# Phase 1: Architecture — force Fusion
architecture_response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {KEY}"},
    json={
        "model": "deepseek/deepseek-v4-pro",
        "messages": [{"role": "user", "content": task_description}],
        "tools": [{"type": "openrouter:fusion", "parameters": ARCHITECTURE_PANEL}],
        "tool_choice": {"type": "tool", "name": "openrouter:fusion"},  # force fusion
        "stopWhen": [stepCountIs(5), maxCost(2.00)],
    },
)

# Phase 2: Implementation — model decides
implementation_response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {KEY}"},
    json={
        "model": "deepseek/deepseek-v4-pro",
        "messages": [{"role": "user", "content": implementation_prompt}],
        "tools": [read_file_tool, write_file_tool, run_tests_tool,
                  {"type": "openrouter:fusion", "parameters": BUDGET_PANEL}],
        # tool_choice omitted → model decides per-step
    },
)
```



### Cost discipline

Fusion is roughly 5× the cost of a single completion at the default 3-model panel. For production:

- Use `preset: "general-budget"` for non-critical escalations — a budget panel with frontier judge achieves near-frontier performance at half cost
- Reserve `general-max` (or your own frontier panel) for the highest-stakes decisions only
- Track cost per escalation in agent telemetry — know which triggers are worth the multiplier
- Set hard caps: `maxCost($)`, `stepCountIs(N)`, and per-task Fusion call limits

---



## 3. Maximizing Instruction-Following Accuracy Across Multi-Turn Tasks



### The problem: instruction drift

The biggest failure mode in multi-turn agentic coding is **instruction drift** — the model forgets or misinterprets original requirements after several tool calls and context turns. Fusion doesn't solve this directly; it can even exacerbate it by injecting large analysis payloads into the context window.

### Pattern 1: Instruction tracking with periodic reminders

```python
class InstructionTracker:
    """Extracts requirements from original task, tracks completion, re-injects reminders."""
    
    def __init__(self, original_task: str):
        self.original_task = original_task
        self.requirements = self._extract_requirements(original_task)
        self.completed = set()
        self.failed = set()
    
    def get_reminder(self, turn: int) -> str | None:
        """Inject a structured reminder every 3 turns."""
        if turn % 3 != 0:
            return None
        pending = [r for r in self.requirements if r not in self.completed]
        return f"""## INSTRUCTION REMINDER (Turn {turn})
Original task: {self.original_task}
Requirements completed: {list(self.completed)}
Requirements pending: {pending}
Before proceeding, verify your next action advances a pending requirement.
Do NOT deviate from the original task scope."""
    
    def mark_completed(self, requirement: str):
        self.completed.add(requirement)
    
    def mark_failed(self, requirement: str, reason: str):
        self.failed.add((requirement, reason))
```



### Pattern 2: Task invariant in every system message

Every system prompt should include a one-sentence summary of the original task, the current subtask from the planner, and explicit acceptance criteria:

```
Original task: <one-sentence summary>
Current subtask: <from planner>
Acceptance criteria: <list of specific, verifiable conditions>
You may only deviate if you report the deviation and get user confirmation.
```



### Pattern 3: Structured planning with explicit Fusion gates

Before acting, force the agent to produce a structured plan:

```python
PLANNING_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "task_plan",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "understood_requirements": {"type": "array", "items": {"type": "string"}},
                "ambiguities": {"type": "array", "items": {"type": "string"}},
                "steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step": {"type": "string"},
                            "needs_fusion": {"type": "boolean"},
                            "fusion_query": {"type": "string"},
                        },
                        "required": ["step", "needs_fusion"],
                    },
                },
                "success_criteria": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["understood_requirements", "steps", "success_criteria"],
        },
    },
}
```



### Pattern 4: Constraint enumeration

Listing constraints explicitly in the user message outperforms prose:

```bash
Constraints:
1. Must not break the existing auth middleware
2. Must use the project's existing logging framework (winston)
3. Must handle rate limiting at the API gateway level, not per-service
4. Log all authentication failures with user ID and IP
```

This is particularly effective when coupled with Fusion — the structured analysis is most useful when the constraints are enumerated up front.

### Pattern 5: Mitigate fusion-induced context drift

Fusion responses are large (consensus + contradictions + partial_coverage + unique_insights + blind_spots + N full panel responses). This can distract weaker outer models or cause them to latch onto a single contrarian panel view while ignoring consensus.

Mitigations:

- **Summarize before storing**: Ask the outer model to extract only actionable points from the analysis, keeping the full result in metadata for debugging
- **Strong outer model**: Don't put a mid-tier model in the outer slot and expect the panel to save you — OpenRouter's own data shows the synthesis step matters as much as model diversity
- **Reset the role**: Inject fusion analysis results as read-only context in a system or user message, not as tool results that might be interpreted as new instructions

---



## 4. Handling Tool Calling Alongside Fusion



### Server tools vs. function tools: the critical distinction

Fusion is a **server tool** — OpenRouter executes it and returns the result inline. Your coding tools (file ops, shell, tests) are **client-side function tools** — the model returns a tool call, you execute it, you feed the result back. They coexist in the same `tools` array, but their execution models differ.

### Tool dispatch loop

```python
def handle_tool_calls(self, assistant_message: dict) -> list:
    """Process tool calls. Server tools are already executed by OpenRouter."""
    tool_results = []
    
    for tool_call in assistant_message.get("tool_calls", []):
        tool_id = tool_call["id"]
        
        # SERVER TOOLS (fusion, web_search, web_fetch): already executed.
        # Their results come back in the response. Do NOT execute them yourself.
        if tool_call.get("type") == "openrouter:fusion" or \
           tool_call["function"]["name"] == "openrouter:fusion":
            continue
        
        # FUNCTION TOOLS: execute client-side
        fn_name = tool_call["function"]["name"]
        fn_args = json.loads(tool_call["function"]["arguments"])
        result = self.dispatch_function(fn_name, fn_args)
        
        tool_results.append({
            "tool_call_id": tool_id,
            "role": "tool",
            "content": json.dumps(result),
        })
    
    return tool_results
```



### Tool ordering for correctness

Your agent should follow this implicit ordering within each turn:

1. **Local research tools first** (read_file, grep, search_codebase) — collect evidence
2. **Fusion second** — deliberate on the collected evidence with a self-contained prompt
3. **Action tools last** (write_file, run_tests, execute_command) — implement based on analysis

You can enforce this by suppressing the Fusion tool until enough local context is gathered.

### Parallel vs. sequential execution

For coding correctness, disable parallel tool calls:

```json
{ "parallel_tool_calls": fals }
```

Enable it only for truly independent batch operations (e.g., reading 5 unrelated files simultaneously, or running linters on multiple independent directories).

### One Fusion call per turn — design around the recursion cap

Fusion has built-in recursion protection (`fusion_invocation_capped`). The panel and judge models cannot invoke Fusion again, and your outer model can only call it once per turn. If you need deeper deliberation, do it in your orchestrator: call Fusion once, and based on its analysis issue a second Fusion call from the outer model on the *next* turn with a refined prompt.

### Pass structured context into Fusion calls

The outer model can compose a Fusion-specific sub-prompt when calling the tool:

```python
fusion_prompt = f"""Architectural choice between X and Y for this codebase.

Constraints: must integrate with Z, must not break the W invariant
(see attached diff). Compare tradeoffs, surface failure modes.

Relevant code context:
- File: src/auth/handlers.ts (12 endpoints, JWT-based)
- Current dependency: express-rate-limit v6.7.0
- Performance budget: 50ms p99 for auth middleware"""
```

Many frontend models handle this well; budget models may just dump the user prompt verbatim. Test in your domain.

---



## 5. Self-Verification & Error Recovery Patterns



### Pattern A: The Verify-Act-Verify loop

```
Agent Main Loop:
  PLAN (maybe fusion) → ACT (tools) → VERIFY (tests + fusion review)
    ↑                                                      |
    └──────── RECOVER (fusion debug) ←──── FAIL ──────────┘
```



### Pattern B: Multi-stage verification pipeline

```python
class VerificationPipeline:
    def verify_implementation(self, task, files_modified, test_results) -> dict:
        
        # Stage 1: Tests must pass
        if test_results.get("failed", 0) > 0:
            return {"can_proceed": False, "issue": "tests_failed"}
        
        # Stage 2: Fusion code review
        fusion_result = self.call_fusion(
            prompt=f"Review this implementation for correctness, security, "
                   f"and completeness against: {task}",
            panel_config=REVIEW_PANEL,
            force=True,
        )
        
        analysis = fusion_result["analysis"]
        issues = []
        
        # Parse consensus for bug/error/problem flags
        for consensus_point in analysis.get("consensus", []):
            if any(w in consensus_point.lower() 
                   for w in ["bug", "error", "issue", "problem", "incorrect"]):
                issues.append({"severity": "high", "detail": consensus_point})
        
        # Blind spots = risks to address
        for blind_spot in analysis.get("blind_spots", []):
            issues.append({"severity": "medium", "detail": blind_spot})
        
        can_proceed = not any(i["severity"] in ("critical",) for i in issues)
        return {"can_proceed": can_proceed, "issues": issues, "analysis": analysis}
```



### Pattern C: Escalating error recovery with Fusion as debugger

```python
class ErrorRecovery:
    def handle_test_failure(self, task, failing_tests, current_code, error_output) -> dict:
        self.consecutive_failures += 1
        
        # Strategy 1: Simple retry
        if self.consecutive_failures == 1:
            return {"strategy": "simple_retry", 
                    "instruction": f"Tests failed. Fix them: {error_output}"}
        
        # Strategy 2: Fusion-assisted debugging
        if self.consecutive_failures == 2:
            fusion_result = self.call_fusion(
                prompt=f"""Agent is stuck on a bug after one fix attempt failed.
                Task: {task}
                Failing tests: {json.dumps(failing_tests)}
                Error output: {error_output}
                Current code: {current_code[:8000]}
                Diagnose the most likely root cause and recommend the minimal fix.""",
                panel_config=BUDGET_PANEL,
            )
            analysis = fusion_result["analysis"]
            return {
                "strategy": "fusion_debug",
                "instruction": f"""Multi-model analysis:
                Consensus: {analysis['consensus']}
                Blind spots to check: {analysis['blind_spots']}
                Fix the root cause based on this diagnosis.""",
            }
        
        # Strategy 3: Escalation (3+ failures)
        if self.consecutive_failures >= 3:
            return {
                "strategy": "escalate",
                "instruction": f"""After {self.consecutive_failures} failed attempts, 
                the task cannot be completed automatically. Summarize what you tried,
                why it's failing, and what a human should investigate first."""
            }
```



### Pattern D: Adversarial self-review with sentinel

```python
MAX_REVIEW_ITERATIONS = 5
REVIEW_PROMPT = """Review your implementation adversarially:
1. Re-read every file you modified. Does each change match the original task?
2. Run the tests again. Do they all pass?
3. Are there edge cases you didn't handle?
4. Did you introduce any regressions in code you didn't modify?
5. Is the code style consistent with the rest of the codebase?

If everything is correct and complete, reply with exactly: [DONE]
Otherwise, list specific issues and fix them."""

for iteration in range(MAX_REVIEW_ITERATIONS):
    result = agent.run(REVIEW_PROMPT)
    if "[DONE]" in result.text:
        break
```



### Pattern E: Use different model families for implementer vs. reviewer

```python
# Implementer: Claude Opus with Fusion access
implementer = run_agent(model="deepseek/deepseek-v4-pro",
                        tools=[coding_tools, fusion_tool])

# Reviewer: Different model family, adversarial stance, Fusion for cross-checking  
reviewer = run_agent(model="minimax/minimax-m3",  # different provider
                     prompt="Review this implementation ADVERSARIALLY. "
                            "Check for: correctness, edge cases, security, "
                            "performance, consistency.",
                     tools=[read_file_tool, fusion_tool])

# Treating model diversity as a verification asset, not just a deliberation input
```

---



## 6. Graceful Degradation & Failure Handling

Fusion can fail. The API returns typed failure reasons — handle each one:

```python
def call_fusion_with_fallback(prompt: str, panel_config: dict, force: bool = False) -> dict:
    response = requests.post(...)
    message = response.json()["choices"][0]["message"]
    
    for tc in message.get("tool_calls", []):
        if tc["function"]["name"] == "openrouter:fusion":
            result = tc.get("result", {})
            
            if result.get("status") == "error":
                reason = result["failure_reason"]
                
                if reason == "all_panels_failed":
                    # All panel models failed — fall back to single strong model
                    return fallback_single_model(prompt, "anthropic/claude-opus-latest")
                
                elif reason == "rate_limited":
                    # Exponential backoff, then retry with budget preset
                    time.sleep(2 ** retry_count)
                    return call_fusion(prompt, BUDGET_PANEL)
                
                elif reason == "insufficient_credits":
                    # Log, alert, fall back to single model
                    return fallback_single_model(prompt, "anthropic/claude-sonnet-latest")
                
                elif reason == "fusion_invocation_capped":
                    # Already called Fusion this turn — proceed without it
                    return {"analysis": {"consensus": [], "blind_spots": [
                        "Fusion was capped this turn — manual review recommended"
                    ]}}
                
                elif reason == "unexpected_error":
                    # Log and degrade gracefully
                    return fallback_single_model(prompt, "anthropic/claude-opus-latest")
            
            # Judge degradation: panel succeeded, judge failed
            if result.get("status") == "ok" and "analysis" not in result:
                # Raw panel responses available but no structured analysis
                return synthesize_from_raw_responses(result["responses"])
            
            return result
    
    # Model didn't call Fusion (edge case, even with tool_choice: required)
    return fallback_single_model(prompt, "anthropic/claude-opus-latest")
```

---



## 7. Production Blind Spots & Mitigations

The panel analysis surfaced several blind spots that matter for production systems. Here's how to address them:

### Latency budgets

Fusion adds significant latency — N parallel model calls (with up to `max_tool_calls` web search iterations each) plus a judge call. For interactive agents requiring sub-second responsiveness, **never call Fusion synchronously in the user-facing path**. Use it asynchronously: queue the deliberation, show the user a progress indicator ("Analyzing options with multiple experts..."), and deliver the result when ready.

### Data exfiltration risks

Sending proprietary source code to multiple third-party model providers expands the attack surface. Mitigations:

- Sanitize code before sending to panel models (redact internal paths, company names, secrets)
- Use `excluded_domains` on `web_search` and `blocked_domains` on `web_fetch` to prevent panel models from accessing internal docs
- For maximum security, consider running local models as panel members via OpenRouter's custom provider support



### Caching and memoization

Fusion calls are expensive (~5× single completion), and identical deliberation queries recur across agent runs. Implement:

- Semantic deduplication: hash normalized deliberation prompts, cache results with TTL
- Warm cache for common architectural questions ("PostgreSQL vs MongoDB for X")
- Track hit rates to optimize panel configurations



### Beta API stability

Fusion is currently beta. For production:

- Version-lock your panel configurations and test them in CI before upgrading
- Maintain a fallback path that uses a single strong model without Fusion
- Monitor the OpenRouter changelog for breaking changes
- Build your orchestrator to handle the `unexpected_error` failure reason gracefully



### Deterministic reproducibility

Fusion introduces non-determinism. For audit trails, debugging, and CI/CD:

- Log every Fusion invocation: prompt, panel composition, temperature, judge model, raw responses, and structured analysis
- For CI/CD testing, record Fusion responses in a test fixture and replay them; test that your agent *consumes* the structured analysis correctly, not that Fusion produces the same answer
- Use fixed `seed` parameters if/when OpenRouter supports them



### Knowledge retention

If an agent uses Fusion to make an architecture decision, capture that decision for future runs to avoid re-deliberating:

```python
class DecisionRegistry:
    def record_decision(self, task_hash: str, fusion_analysis: dict, action_taken: str):
        """Persist the deliberation and resulting decision."""
        db.upsert(
            "agent_decisions",
            task_hash=task_hash,
            values={
                "consensus": fusion_analysis["consensus"],
                "action_taken": action_taken,
                "timestamp": now(),
            }
        )
    
    def lookup_prior_decision(self, task_hash: str) -> dict | None:
        """Check if we've already deliberated on an equivalent question."""
        return db.query("SELECT * FROM agent_decisions WHERE task_hash = $1", task_hash)
```



### Rate limiting for concurrent agents

Multiple agent instances can exhaust Fusion rate limits. Implement:

- A central queue with priority levels (critical pre-commit review > architecture research)
- Fair scheduling across instances
- Graceful degradation: if rate-limited, fall back to a single strong model or delay the deliberation
- Per-organization rate limit monitoring and alerting



### Knowledge cutoff coordination

Different panel models have different training cutoffs. For rapidly-evolving frameworks:

- Include version constraints in Fusion prompts ("React 19, released Dec 2024")
- Enable `web_search` in the panel with `max_tool_calls` ≥ 2 so models can check current docs
- Track model-specific answer quality for framework-specific questions in your telemetry



### CI/CD testing integration

How to test that your Fusion integration doesn't regress:

- Record Fusion responses in test fixtures for known prompts
- Replay those fixtures in integration tests to verify your orchestrator's consumption logic
- Test that graceful degradation paths work by simulating each `failure_reason`
- Use deterministic assertions on the *structure* of your agent's output, not the exact content of Fusion analysis



### Human-in-the-loop surface

Fusion's structured analysis is uniquely suited for developer review:

- Surface `contradictions` and `blind_spots` prominently in your review UI — these are exactly what a human reviewer wants to see
- For pre-commit Fusion reviews, present the structured analysis alongside the diff in your PR review tool
- When the agent escalates to human, include the full Fusion analysis (all fields) in the escalation payload

---



## Production Architecture Checklist


| Concern                      | Solution                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| **Entry point**              | Server tool (`"type": "openrouter:fusion"`) in tools array — maximum control                 |
| **Outer model strength**     | Frontier-tier (deepseek-v4-pro, mininaxx-m3) — don't skimp on the synthesizer                |
| **Panel composition**        | 3 diverse frontier models for quality; budget panel + frontier judge for cost                |
| **When to force Fusion**     | Architecture decisions, pre-commit review, after 2+ test failures                            |
| **When to let model decide** | Routine implementation, debugging, standard refactoring                                      |
| **Temperature**              | 0.1–0.3 for panel (focused); judge is always 0                                               |
| **Parallel tool calls**      | `false` for coding correctness; `true` only for independent batch reads                      |
| **Instruction drift**        | InstructionTracker with periodic reminders; task invariant in system prompt                  |
| **Constraint adherence**     | Enumerate constraints explicitly; structured planning with `needs_fusion` gates              |
| **Verification**             | Multi-stage: tests → Fusion review → adversarial reviewer → sentinel `[DONE]`                |
| **Error recovery**           | Escalating: simple retry → Fusion debug → human escalation (never loop >3×)                  |
| **Fusion failures**          | Typed `failure_reason` handling; fallback to single strong model                             |
| **Judge degradation**        | Use raw panel responses when judge fails (status "ok" without "analysis")                    |
| **Cost control**             | `maxCost`, `stepCountIs`, per-task Fusion caps, budget presets for non-critical              |
| **Recursion**                | Server-enforced depth-1 bounded; design orchestrator for multi-step deliberation             |
| **Context bloat**            | Summarize Fusion results; use diffs not full files; checkpoint summaries every N turns       |
| **State persistence**        | Atomic upserts for crash recovery; resume with empty input                                   |
| **Observability**            | Log every turn: model, tools, Fusion analysis, verifier results, cost, latency               |
| **CI/CD testing**            | Record/replay Fusion fixtures; test degradation paths; deterministic assertions on structure |
| **Security**                 | Sanitize code for panel; `excluded_domains`/`blocked_domains`; consider local models         |


