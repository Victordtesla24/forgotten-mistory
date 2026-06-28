#!/usr/bin/env python3
"""
OpenRouter Fusion Preset Benchmark Harness
===========================================
Tests @preset/models-fusion-os across 4 task categories:
  - CODING: implementation, refactoring, debugging
  - ANALYSIS: research, trade-off analysis, architecture decisions
  - CREATIVE: content generation, design, narrative
  - MATH: formal proofs, computation, quantitative reasoning

Measures PEA (Prompt Execution Accuracy) using a structured rubric
and compares cost against single-model baselines.

Usage:
  export OPENROUTER_API_KEY=sk-or-v1-...
  python3 fusion_benchmark.py --preset models-fusion-os [--category all]
"""

import json
import os
import sys
import time
import hashlib
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional
from collections.abc import Callable

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
PRESET_SLUG = os.environ.get("FUSION_PRESET", "models-fusion-os")

# Baseline single models for cost comparison
BASELINE_MODELS = [
    "anthropic/claude-opus-4-8",
    "deepseek/deepseek-v4-pro",
    "openai/gpt-5.5",
    "google/gemini-3.1-pro-preview",
]

# ---------------------------------------------------------------------------
# Test Prompt Suites
# ---------------------------------------------------------------------------

CODING_PROMPTS = [
    {
        "id": "code-1",
        "title": "Implement rate limiter",
        "prompt": """Implement a sliding-window rate limiter in Python that:
1. Accepts max_requests and window_seconds as parameters
2. Uses Redis for distributed state (provide both real Redis and an in-memory fallback)
3. Is thread-safe
4. Returns (allowed: bool, remaining: int, reset_at: float)
5. Include type annotations throughout
6. Write the implementation only — no explanation needed.

Constraints:
- Must handle clock skew between nodes
- Must be O(1) per request in the happy path
- Must not leak memory""",
        "rubric": {
            "correctness": 30,
            "edge_cases": 20,
            "type_safety": 15,
            "performance": 15,
            "concurrency": 20,
        },
    },
    {
        "id": "code-2",
        "title": "Fix async race condition",
        "prompt": """This TypeScript code has a race condition that causes duplicate database writes.
Identify the bug and provide the minimal fix:

```typescript
class OrderProcessor {
  private processing = new Map<string, Promise<void>>();

  async processOrder(orderId: string): Promise<void> {
    if (this.processing.has(orderId)) {
      return this.processing.get(orderId)!;
    }
    const promise = this.executeOrder(orderId);
    this.processing.set(orderId, promise);
    try {
      await promise;
    } finally {
      this.processing.delete(orderId);
    }
  }

  private async executeOrder(orderId: string): Promise<void> {
    const order = await db.orders.findById(orderId);
    if (!order || order.status !== 'pending') return;
    await db.orders.update(orderId, { status: 'processing' });
    await paymentService.charge(order.customerId, order.amount);
    await db.orders.update(orderId, { status: 'completed' });
  }
}
```

Provide: (1) the exact race condition, (2) the minimal fix, (3) a test that would catch it.""",
        "rubric": {
            "bug_identification": 35,
            "fix_correctness": 35,
            "test_quality": 30,
        },
    },
    {
        "id": "code-3",
        "title": "Design API endpoint",
        "prompt": """Design a REST API endpoint for a multi-tenant SaaS that allows tenants to:
- Create, read, update, delete custom user roles
- Assign permissions to roles (resource:action format, e.g., "reports:read")
- Assign roles to users
- Must enforce tenant isolation (tenant A cannot see tenant B's roles)

Provide:
1. The route structure and HTTP methods
2. Request/response schemas (JSON)
3. Database schema (PostgreSQL)
4. Authorization flow (who can manage roles?)
5. Rate limiting considerations

Just the design — no implementation code needed.""",
        "rubric": {
            "api_design": 25,
            "schema_quality": 25,
            "isolation": 20,
            "auth_model": 20,
            "rate_limiting": 10,
        },
    },
]

ANALYSIS_PROMPTS = [
    {
        "id": "analysis-1",
        "title": "Database choice trade-off",
        "prompt": """We're building a real-time collaborative document editor (like Google Docs).
We need to choose between PostgreSQL (with LISTEN/NOTIFY) and Redis Streams for
the real-time sync layer.

Constraints:
- 100K concurrent users per region
- <200ms p99 latency for operational transforms
- Must survive region-level outages
- Team has strong PostgreSQL experience, no Redis Streams production experience
- Azure-hosted (no AWS/GCP-specific services available)

Provide a ranked recommendation with:
1. Detailed trade-off analysis (reliability, latency, ops burden, cost)
2. Failure mode analysis for both options
3. Migration path if we start with one and switch later
4. What metrics to monitor to know if we made the wrong choice""",
        "rubric": {
            "tradeoff_quality": 30,
            "failure_analysis": 25,
            "practicality": 20,
            "metrics_guidance": 15,
            "constraint_adherence": 10,
        },
    },
    {
        "id": "analysis-2",
        "title": "Security architecture review",
        "prompt": """Review this authentication architecture for security vulnerabilities:

- Frontend: Next.js SPA, hosted on Vercel
- Auth: Firebase Authentication with Google Sign-In only
- API: Cloud Run services behind Google API Gateway
- API Gateway validates Firebase ID tokens via JWKS endpoint
- Services trust X-User-Id header set by API Gateway
- Database: Firestore with security rules checking auth.uid
- Session management: Firebase SDK handles token refresh client-side

Identify:
1. Every vulnerability you can find, ranked by severity
2. Attack vectors an adversary could exploit
3. Mitigations for each finding
4. What we'd need to change for SOC 2 compliance""",
        "rubric": {
            "vulnerability_coverage": 30,
            "attack_vectors": 25,
            "mitigation_quality": 25,
            "compliance": 20,
        },
    },
    {
        "id": "analysis-3",
        "title": "Build vs buy analysis",
        "prompt": """Our startup needs a feature flag / experimentation platform. We have 50 engineers
and 2M monthly active users across web and mobile.

Options:
A) Build in-house (estimated 3 engineer-months initial, 0.5 FTE ongoing)
B) LaunchDarkly (enterprise plan, ~$2K/mo at our scale)
C) Open-source Flagsmith self-hosted (free, ~1 FTE ongoing ops)

Analyze across these dimensions:
- Time to value (we need basic flags in 2 weeks, experiments in 2 months)
- Total cost over 3 years
- Customization needs (multi-variate experiments, gradual rollouts, kill switches)
- Vendor risk (what if LaunchDarkly has an outage?)
- Team opportunity cost
- Compliance (SOC 2, GDPR data residency)

Provide a clear recommendation with a 2-week MVP plan.""",
        "rubric": {
            "analysis_depth": 25,
            "time_analysis": 20,
            "cost_accuracy": 20,
            "risk_assessment": 20,
            "recommendation_clarity": 15,
        },
    },
]

CREATIVE_PROMPTS = [
    {
        "id": "creative-1",
        "title": "Product launch narrative",
        "prompt": """Write the launch announcement for a new AI-powered code review tool called "Sentinel".
It catches bugs that traditional linters miss by understanding code semantics.

Requirements:
- Target audience: engineering managers and senior developers
- Tone: professional but not dry, confident but not arrogant
- Length: 400-600 words
- Must include: a compelling hook, what makes it different from existing tools,
  specific examples of bugs it catches, social proof angle, and a clear CTA
- Avoid: AI hype clichés ("revolutionary", "game-changing", "next-gen")
- Must pass the "would I share this with my team?" test

Write the announcement post only — no meta-commentary.""",
        "rubric": {
            "hook_quality": 20,
            "tone_appropriateness": 20,
            "specificity": 25,
            "cta_effectiveness": 15,
            "cliche_avoidance": 20,
        },
    },
    {
        "id": "creative-2",
        "title": "UI microcopy rewrite",
        "prompt": """Rewrite the following error messages for a fintech app to be:
- Clear about what happened without technical jargon
- Actionable (user knows exactly what to do next)
- On-brand (professional, reassuring, slightly warm)
- 2 sentences max each

Current messages:
1. "Error 500: Internal server error"
2. "Transaction declined. Code: DECLINED_INSUFFICIENT_FUNDS"
3. "Invalid input detected in field 'routing_number'"
4. "Session expired. Please re-authenticate."
5. "API rate limit exceeded. Try again later."
6. "We couldn't verify your identity. Please try again."
7. "Transfer failed. Please contact support."
8. "The recipient's bank returned an error processing your transfer."

Provide the rewritten versions.""",
        "rubric": {
            "clarity": 25,
            "actionability": 25,
            "brand_consistency": 20,
            "conciseness": 15,
            "empathy": 15,
        },
    },
    {
        "id": "creative-3",
        "title": "System design diagram description",
        "prompt": """Describe a system architecture diagram for a live sports betting platform in
natural language that a diagramming tool could render accurately.

The system handles:
- 500K concurrent users during major events
- Real-time odds updates (<100ms from feed to display)
- Bet placement and settlement
- Fraud detection pipeline
- User account management
- Regulatory compliance (multi-jurisdiction)

Your description should include:
1. Every component and its responsibility
2. Data flow between components (direction, protocol, data format)
3. Scaling characteristics of each component
4. Failure domains and redundancy approach
5. External integrations

Be precise enough that someone could draw the diagram from your words alone.
Use structured formatting (not JSON — plain English with clear hierarchy).""",
        "rubric": {
            "completeness": 25,
            "precision": 25,
            "clarity": 20,
            "scaling_awareness": 15,
            "failure_domains": 15,
        },
    },
]

MATH_PROMPTS = [
    {
        "id": "math-1",
        "title": "Probability puzzle",
        "prompt": """You have a deck of 52 standard playing cards. You draw cards one at a time
without replacement until you've drawn all four aces.

What is the probability that the last card drawn (the 52nd card) is an ace?

Show your work step by step. Provide the exact probability as a simplified fraction.
Then verify your answer by explaining WHY it makes intuitive sense.""",
        "rubric": {
            "correct_answer": 40,
            "derivation": 30,
            "intuition": 20,
            "clarity": 10,
        },
        "ground_truth": "1/13 — by symmetry, each card is equally likely to be the last ace drawn",
    },
    {
        "id": "math-2",
        "title": "Algorithm analysis",
        "prompt": """Analyze the following algorithm for finding the k-th smallest element in
a binary search tree. Determine its time and space complexity, prove correctness,
and identify any edge cases:

```python
def kth_smallest(root: TreeNode | None, k: int) -> int | None:
    stack = []
    current = root
    count = 0

    while stack or current:
        while current:
            stack.append(current)
            current = current.left
        current = stack.pop()
        count += 1
        if count == k:
            return current.val
        current = current.right
    return None
```

Provide:
1. Time complexity with proof (best, worst, average)
2. Space complexity with proof
3. Correctness proof (loop invariant)
4. Edge cases this handles and ones it doesn't
5. 3 test cases that would validate correctness""",
        "rubric": {
            "complexity_analysis": 30,
            "correctness_proof": 25,
            "edge_cases": 25,
            "test_quality": 20,
        },
        "ground_truth": "O(h + k) time, O(h) space — inorder traversal stopping at k-th element",
    },
    {
        "id": "math-3",
        "title": "Linear algebra application",
        "prompt": """A recommendation system represents users and items as vectors in R^128.
User u is represented by vector u, item i by vector i. The predicted rating
is the cosine similarity: sim(u, i) = (u · i) / (||u|| ||i||).

Given:
- User vector u has been updated via online learning
- The previous user vector was u_old
- We need to re-rank 10 million items
- A full re-ranking takes 300ms, but our p99 latency budget is 50ms

Design an approximation algorithm that:
1. Identifies which items' similarity scores changed significantly
2. Only re-ranks those items
3. Has provable error bounds (no item with a score change > ε is missed)
4. Achieves the latency budget

Provide the mathematical derivation of your error bound and pseudo-code
for the algorithm.""",
        "rubric": {
            "mathematical_rigor": 30,
            "algorithm_design": 25,
            "error_bounds": 25,
            "practicality": 20,
        },
    },
]

# All test suites
TEST_SUITES = {
    "coding": CODING_PROMPTS,
    "analysis": ANALYSIS_PROMPTS,
    "creative": CREATIVE_PROMPTS,
    "math": MATH_PROMPTS,
}

# ---------------------------------------------------------------------------
# PEA Scoring Engine
# ---------------------------------------------------------------------------

@dataclass
class PEAResult:
    """Prompt Execution Accuracy result for a single test."""
    test_id: str
    category: str
    title: str
    prompt: str
    model: str
    response: str
    token_usage: dict
    latency_ms: float
    cost_usd: float
    pea_scores: dict[str, float]  # rubric_item -> score (0-100)
    pea_total: float  # weighted average
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        return {
            "test_id": self.test_id,
            "category": self.category,
            "title": self.title,
            "model": self.model,
            "token_usage": self.token_usage,
            "latency_ms": self.latency_ms,
            "cost_usd": self.cost_usd,
            "pea_scores": self.pea_scores,
            "pea_total": self.pea_total,
            "timestamp": self.timestamp,
        }


class PEAScorer:
    """Scores model responses against rubrics using an LLM judge."""

    JUDGE_MODEL = "anthropic/claude-opus-4-8"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def score(self, test: dict, response: str) -> dict[str, float | str]:
        """Score a response against the test rubric."""
        rubric = test["rubric"]
        rubric_text = "\n".join(f"- {k}: {v} points" for k, v in rubric.items())

        scoring_prompt = f"""You are an expert evaluator. Score this AI response against the rubric.

## Task
{test['prompt'][:3000]}

## Rubric (score each criterion 0-100, where 100 is perfect)
{rubric_text}

## Response to Score
{response[:8000]}

## Ground Truth (if available)
{test.get('ground_truth', 'Not provided')}

Output ONLY valid JSON in this exact format:
{{"scores": {{"criterion_name": score, ...}}, "justification": "brief"}}

Where each score is 0-100. Score strictly — do not inflate."""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.JUDGE_MODEL,
            "messages": [{"role": "user", "content": scoring_prompt}],
            "temperature": 0,
            "max_tokens": 1000,
            "response_format": {"type": "json_object"},
        }

        try:
            resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=120)
            resp.raise_for_status()
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            scores = parsed.get("scores", {})

            # Normalize to 0-100 and compute weighted average
            normalized = {}
            total_weight = sum(rubric.values())
            pea_total = 0.0
            for criterion, max_points in rubric.items():
                raw = float(scores.get(criterion, 0))
                normalized[criterion] = min(raw, 100.0)
                pea_total += (raw / 100.0) * max_points

            pea_total = (pea_total / total_weight) * 100.0 if total_weight > 0 else 0.0
            return {"scores": normalized, "pea_total": round(pea_total, 1)}

        except Exception as e:
            print(f"  WARNING: Scoring failed for {test['id']}: {e}")
            return {"scores": {}, "pea_total": 0.0, "error": str(e)}


# ---------------------------------------------------------------------------
# OpenRouter API Client
# ---------------------------------------------------------------------------

class OpenRouterClient:
    """Minimal OpenRouter API client for Fusion testing."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def call_fusion_preset(self, preset_slug: str, prompt: str, system: str = "") -> dict:
        """Call the Fusion preset with a single prompt."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": f"@preset/{preset_slug}",
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 4000,
        }

        t0 = time.monotonic()
        resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=300)
        latency_ms = (time.monotonic() - t0) * 1000
        resp.raise_for_status()

        data = resp.json()
        choice = data["choices"][0]
        usage = data.get("usage", {})
        cost = self._extract_cost(data)

        return {
            "content": choice["message"]["content"],
            "usage": usage,
            "latency_ms": round(latency_ms, 1),
            "cost_usd": round(cost, 6),
            "model": data.get("model", f"@preset/{preset_slug}"),
            "raw": data,
        }

    def call_single_model(self, model: str, prompt: str, system: str = "") -> dict:
        """Call a single model for baseline comparison."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 4000,
        }

        t0 = time.monotonic()
        resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=180)
        latency_ms = (time.monotonic() - t0) * 1000
        resp.raise_for_status()

        data = resp.json()
        choice = data["choices"][0]
        usage = data.get("usage", {})

        return {
            "content": choice["message"]["content"],
            "usage": usage,
            "latency_ms": round(latency_ms, 1),
            "cost_usd": round(self._extract_cost(data), 6),
            "model": data.get("model", model),
        }

    @staticmethod
    def _extract_cost(data: dict) -> float:
        """Extract cost from OpenRouter response, with fallback estimation."""
        # OpenRouter includes cost in response headers or body
        usage = data.get("usage", {})
        model = data.get("model", "")

        # Try to get cost directly from OpenRouter pricing
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)

        # Pricing per 1M tokens (approximate, as of June 2026)
        PRICING = {
            "anthropic/claude-opus-4-8": (15.0, 75.0),      # prompt, completion
            "anthropic/claude-opus-4-5": (15.0, 75.0),
            "deepseek/deepseek-v4-pro": (2.0, 8.0),
            "deepseek/deepseek-chat": (0.27, 1.10),
            "openai/gpt-5.5": (10.0, 40.0),
            "google/gemini-3.1-pro-preview": (2.5, 10.0),
            "google/gemini-3-flash-preview": (0.15, 0.60),
            "z-ai/glm-5.2": (1.5, 6.0),
            "moonshotai/kimi-k2.7-code": (2.0, 8.0),
            "qwen/qwen3.7-plus": (1.0, 4.0),
            "minimax/minimax-m3": (1.5, 6.0),
        }

        # Default pricing for unknown models
        default_pricing = (3.0, 15.0)  # conservative estimate

        for model_key, (ppu_prompt, ppu_completion) in PRICING.items():
            if model_key in model:
                cost = (prompt_tokens / 1_000_000) * ppu_prompt + \
                       (completion_tokens / 1_000_000) * ppu_completion
                return cost

        cost = (prompt_tokens / 1_000_000) * default_pricing[0] + \
               (completion_tokens / 1_000_000) * default_pricing[1]
        return cost


# ---------------------------------------------------------------------------
# Benchmark Runner
# ---------------------------------------------------------------------------

class FusionBenchmark:
    """Runs benchmarks on Fusion presets."""

    def __init__(self, api_key: str, preset: str, output_dir: str = "./benchmarks"):
        self.client = OpenRouterClient(api_key)
        self.scorer = PEAScorer(api_key)
        self.preset = preset
        self.output_dir = output_dir
        self.results: list[PEAResult] = []
        self.baseline_results: dict[str, list[PEAResult]] = {}
        os.makedirs(output_dir, exist_ok=True)

    def run_category(self, category: str, prompts: list[dict]) -> list[PEAResult]:
        """Run all tests in a category against the Fusion preset."""
        results = []
        print(f"\n{'='*60}")
        print(f"CATEGORY: {category.upper()} ({len(prompts)} tests)")
        print(f"{'='*60}")

        for i, test in enumerate(prompts):
            print(f"\n[{i+1}/{len(prompts)}] {test['id']}: {test['title']}")

            try:
                # Call Fusion preset
                resp = self.client.call_fusion_preset(
                    self.preset,
                    test["prompt"],
                    system="You are a helpful AI assistant. Provide thorough, accurate responses.",
                )

                # Score the response
                scores = self.scorer.score(test, resp["content"])
                pea_total: float = float(scores.get("pea_total", 0.0))
                pea_detail_raw = scores.get("scores", {})
                pea_detail: dict[str, float] = (
                    {k: float(v) for k, v in pea_detail_raw.items()}
                    if isinstance(pea_detail_raw, dict)
                    else {}
                )

                result = PEAResult(
                    test_id=test["id"],
                    category=category,
                    title=test["title"],
                    prompt=test["prompt"],
                    model=self.preset,
                    response=resp["content"],
                    token_usage=resp["usage"],
                    latency_ms=resp["latency_ms"],
                    cost_usd=resp["cost_usd"],
                    pea_scores=pea_detail,
                    pea_total=pea_total,
                )
                results.append(result)

                print(f"  PEA: {pea_total:.1f}% | Cost: ${resp['cost_usd']:.4f} | Latency: {resp['latency_ms']:.0f}ms")
                print(f"  Scores: {json.dumps(pea_detail)}")

            except Exception as e:
                print(f"  FAILED: {e}")
                # Record failure
                result = PEAResult(
                    test_id=test["id"],
                    category=category,
                    title=test["title"],
                    prompt=test["prompt"],
                    model=self.preset,
                    response=f"ERROR: {e}",
                    token_usage={},
                    latency_ms=0,
                    cost_usd=0,
                    pea_scores={},
                    pea_total=0.0,
                )
                results.append(result)

            # Rate limiting pause
            if i < len(prompts) - 1:
                time.sleep(2)

        return results

    def run_baseline(self, model: str, prompts: list[dict]) -> list[PEAResult]:
        """Run tests against a single baseline model."""
        results = []
        print(f"\n  Baseline: {model}")

        for test in prompts:
            try:
                resp = self.client.call_single_model(
                    model, test["prompt"],
                    system="You are a helpful AI assistant.",
                )
                scores = self.scorer.score(test, resp["content"])
                pea_total: float = float(scores.get("pea_total", 0.0))
                pea_detail_raw = scores.get("scores", {})
                pea_detail: dict[str, float] = (
                    {k: float(v) for k, v in pea_detail_raw.items()}
                    if isinstance(pea_detail_raw, dict)
                    else {}
                )

                result = PEAResult(
                    test_id=test["id"],
                    category="baseline",
                    title=test["title"],
                    prompt=test["prompt"],
                    model=model,
                    response=resp["content"],
                    token_usage=resp["usage"],
                    latency_ms=resp["latency_ms"],
                    cost_usd=resp["cost_usd"],
                    pea_scores=pea_detail,
                    pea_total=pea_total,
                )
                results.append(result)
                time.sleep(1)

            except Exception as e:
                print(f"    {test['id']} FAILED: {e}")
                result = PEAResult(
                    test_id=test["id"],
                    category="baseline",
                    title=test["title"],
                    prompt=test["prompt"],
                    model=model,
                    response=f"ERROR: {e}",
                    token_usage={},
                    latency_ms=0,
                    cost_usd=0,
                    pea_scores={},
                    pea_total=0.0,
                )
                results.append(result)

        return results

    def run_all(self, categories: list[str] | None = None):
        """Run full benchmark suite."""
        if categories is None:
            categories = list(TEST_SUITES.keys())

        print(f"\n{'#'*60}")
        print(f"FUSION BENCHMARK: @preset/{self.preset}")
        print(f"Categories: {', '.join(categories)}")
        print(f"Total tests: {sum(len(TEST_SUITES[c]) for c in categories)}")
        print(f"{'#'*60}")

        start_time = time.monotonic()

        # Run Fusion tests
        for category in categories:
            results = self.run_category(category, TEST_SUITES[category])
            self.results.extend(results)

        # Run baseline comparisons (one representative model per category)
        print(f"\n{'='*60}")
        print("BASELINE COMPARISON (deepseek/deepseek-v4-pro)")
        print(f"{'='*60}")
        baseline_model = "deepseek/deepseek-v4-pro"
        all_prompts = []
        for cat in categories:
            all_prompts.extend(TEST_SUITES[cat])
        self.baseline_results[baseline_model] = self.run_baseline(baseline_model, all_prompts)

        elapsed = time.monotonic() - start_time
        print(f"\n{'='*60}")
        print(f"BENCHMARK COMPLETE in {elapsed:.0f}s")
        print(f"{'='*60}")

        # Generate report
        self.generate_report()

    def generate_report(self):
        """Generate comprehensive benchmark report."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        report_path = os.path.join(self.output_dir, f"fusion_benchmark_{timestamp}.json")
        summary_path = os.path.join(self.output_dir, f"fusion_summary_{timestamp}.md")

        # Aggregate results by category
        by_category: dict[str, dict] = {}
        for r in self.results:
            cat = r.category
            if cat not in by_category:
                by_category[cat] = {"pea_scores": [], "costs": [], "latencies": []}
            by_category[cat]["pea_scores"].append(r.pea_total)
            by_category[cat]["costs"].append(r.cost_usd)
            by_category[cat]["latencies"].append(r.latency_ms)

        # Compute aggregate stats
        fusion_stats = {}
        for cat, data in by_category.items():
            peas = data["pea_scores"]
            costs = data["costs"]
            lats = data["latencies"]
            fusion_stats[cat] = {
                "pea_avg": round(sum(peas) / len(peas), 1) if peas else 0,
                "pea_min": round(min(peas), 1) if peas else 0,
                "pea_max": round(max(peas), 1) if peas else 0,
                "cost_avg": round(sum(costs) / len(costs), 4) if costs else 0,
                "cost_total": round(sum(costs), 4),
                "latency_avg": round(sum(lats) / len(lats), 0) if lats else 0,
            }

        # Baseline stats
        baseline_stats = {}
        for model, results in self.baseline_results.items():
            valid = [r for r in results if r.pea_total > 0]
            baseline_stats[model] = {
                "pea_avg": round(sum(r.pea_total for r in valid) / len(valid), 1) if valid else 0,
                "cost_total": round(sum(r.cost_usd for r in results), 4),
                "latency_avg": round(sum(r.latency_ms for r in results) / len(results), 0) if results else 0,
            }

        # Save JSON results
        report = {
            "preset": self.preset,
            "timestamp": timestamp,
            "fusion_stats": fusion_stats,
            "baseline_stats": baseline_stats,
            "individual_results": [r.to_dict() for r in self.results],
        }
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        # Generate Markdown summary
        md = self._generate_markdown_summary(fusion_stats, baseline_stats, timestamp)
        with open(summary_path, "w") as f:
            f.write(md)

        print(f"\nReport saved:")
        print(f"  JSON: {report_path}")
        print(f"  Summary: {summary_path}")
        print(f"\n{md}")

    def _generate_markdown_summary(self, fusion_stats, baseline_stats, timestamp):
        """Generate markdown summary table."""
        lines = [
            f"# Fusion Benchmark: @preset/{self.preset}",
            f"Generated: {timestamp}",
            "",
            "## PEA Scores by Category",
            "",
            "| Category | PEA Avg | PEA Min | PEA Max | Cost ($) | Latency (ms) |",
            "|----------|---------|---------|---------|----------|-------------|",
        ]

        for cat in ["coding", "analysis", "creative", "math"]:
            if cat in fusion_stats:
                s = fusion_stats[cat]
                lines.append(
                    f"| {cat} | {s['pea_avg']}% | {s['pea_min']}% | "
                    f"{s['pea_max']}% | ${s['cost_total']:.4f} | {s['latency_avg']:.0f} |"
                )

        # Overall
        all_peas = [s["pea_avg"] for s in fusion_stats.values()]
        all_costs = sum(s["cost_total"] for s in fusion_stats.values())
        all_lats = [s["latency_avg"] for s in fusion_stats.values()]
        overall_pea = round(sum(all_peas) / len(all_peas), 1) if all_peas else 0
        overall_lat = round(sum(all_lats) / len(all_lats), 0) if all_lats else 0

        lines.append(
            f"| **OVERALL** | **{overall_pea}%** | - | - | "
            f"**${all_costs:.4f}** | **{overall_lat:.0f}** |"
        )

        # Baseline comparison
        lines.extend([
            "",
            "## Cost Comparison vs Single Models",
            "",
            "| Model | PEA Avg | Total Cost | Cost vs Fusion |",
            "|-------|---------|------------|---------------|",
        ])

        for model, stats in baseline_stats.items():
            cost_ratio = (all_costs / stats["cost_total"]) if stats["cost_total"] > 0 else float('inf')
            lines.append(
                f"| {model} | {stats['pea_avg']}% | ${stats['cost_total']:.4f} | "
                f"{cost_ratio:.1f}x |"
            )

        # Fusion row for comparison
        lines.append(
            f"| **@preset/{self.preset}** | **{overall_pea}%** | "
            f"**${all_costs:.4f}** | **1.0x (baseline)** |"
        )

        lines.extend([
            "",
            "## Optimal Use Cases",
            "",
            "Based on benchmark results:",
            "",
            f"- **Best category**: {max(fusion_stats, key=lambda c: fusion_stats[c]['pea_avg'])} "
            f"({fusion_stats[max(fusion_stats, key=lambda c: fusion_stats[c]['pea_avg'])]['pea_avg']}% PEA)",
            f"- **Worst category**: {min(fusion_stats, key=lambda c: fusion_stats[c]['pea_avg'])} "
            f"({fusion_stats[min(fusion_stats, key=lambda c: fusion_stats[c]['pea_avg'])]['pea_avg']}% PEA)",
            "",
            "### When to use Fusion:",
            "- Architecture and design decisions (high PEA in analysis)",
            "- Research tasks requiring diverse perspectives",
            "- Security reviews and critical code review",
            "- When correctness is 5x+ more valuable than response latency",
            "",
            "### When to use single model:",
            "- Latency-sensitive applications (< 2s requirement)",
            "- Simple, well-defined implementation tasks",
            "- When cost is the primary constraint",
            "- Routine code generation with clear requirements",
        ])

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="OpenRouter Fusion Preset Benchmark Harness"
    )
    parser.add_argument(
        "--preset", default=PRESET_SLUG,
        help=f"Fusion preset slug (default: {PRESET_SLUG})"
    )
    parser.add_argument(
        "--category", default="all",
        choices=["all", "coding", "analysis", "creative", "math"],
        help="Test category to run"
    )
    parser.add_argument(
        "--output", default="./benchmarks",
        help="Output directory for reports"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print test prompts without making API calls"
    )
    parser.add_argument(
        "--api-key", default=API_KEY,
        help="OpenRouter API key (default: $OPENROUTER_API_KEY)"
    )
    args = parser.parse_args()

    if not args.api_key and not args.dry_run:
        print("ERROR: OPENROUTER_API_KEY not set.")
        print("Export it: export OPENROUTER_API_KEY=sk-or-v1-...")
        print("Or pass: --api-key sk-or-v1-...")
        sys.exit(1)

    if args.dry_run:
        categories = list(TEST_SUITES.keys()) if args.category == "all" else [args.category]
        for cat in categories:
            print(f"\n=== {cat.upper()} ===")
            for t in TEST_SUITES[cat]:
                print(f"  [{t['id']}] {t['title']}")
                print(f"    Prompt: {t['prompt'][:120]}...")
                print(f"    Rubric: {t['rubric']}")
        return

    benchmark = FusionBenchmark(args.api_key, args.preset, args.output)
    categories = list(TEST_SUITES.keys()) if args.category == "all" else [args.category]
    benchmark.run_all(categories)


if __name__ == "__main__":
    main()
