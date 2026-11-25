# EthersFlow — Agent Action Verification Layer (KYAA)

EthersFlow MCP is the action-verification layer for AI Agents (KYAA — Know Your Agent's Action). An adversarial council of independent models examines what your agent is about to do — and returns a signed, independently checkable verdict before execution.

[![API Status](https://img.shields.io/badge/API-0.4.0-brightgreen.svg)](https://www.ethersflow.com)
[![MCP Server](https://img.shields.io/badge/MCP_Server-GitHub%20Direct-blue.svg)](mcp-server/README.md)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-Listed-blue)](https://registry.modelcontextprotocol.io)
[![smithery badge](https://smithery.ai/badge/ethersflow-dev/ethersflow)](https://smithery.ai/servers/ethersflow-dev/ethersflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Crypto: Ed25519](https://img.shields.io/badge/Attestation-Ed25519__EdDSA-purple.svg)](/.well-known/jwks.json)

---

## Overview

KYA establishes who your agent is and what it's allowed to do. KYAA (Know Your Agent's Action) verifies what it's actually doing — one signed action at a time. Identity gets your agent through the door. Verification decides what leaves with it.

EthersFlow is an action gate: it decides whether an agent's next action should execute — and notarizes its own decision with signed, independently verifiable evidence. Calls from unverified identities are refused by default; read-only probes get a rate-capped look, and every decision — including every refusal — is a signed receipt. Enforcement without proof is a black box; proof without enforcement is just an audit log after the damage is done. EthersFlow is the checkpoint that does both.

The threat model is already mapped. Prompt-injection corpora, agentic attack suites, and adversarial red-team batteries are published research — EthersFlow verifies every agent action against that mapped attack space **and** against its internal policy layer at runtime, before the action fires, and signs the result. How much gets through when it does: 2.52% of 4,203 mapped attack scenarios on the current build (97.48% defended — rejected or escalated to human review; the action did not execute) — full methodology, per-suite results, and disclosures in the [External Verification White Paper](https://ethersflow.juno.page/ethersflow-report/).

### The Agent Governance Stack

```
+-------------------+      +-------------------+      +-------------------------+      +-------------------+
| 1. IDENTITY (KYA) | ---> | 2. AUTHORIZATION  | ---> | 3. ACTION VERIFICATION  | ---> | 4. EXECUTION      |
|                   |      |                   |      |    (KYAA)               |      |                   |
| Proves: WHO       |      | Proves: IS IT     |      | Proves: IS THIS ACTION  |      | Runs tool / API   |
|                   |      |         ALLOWED?  |      |         LEGITIMATE?     |      |                   |
| Sumsub, Entrust,  |      | Google AP2, FIDO, |      | EthersFlow (Ed25519     |      | Agent runtime     |
| Persona           |      | OAuth mandates    |      | Signed Trust Verdict)   |      | rails             |
+-------------------+      +-------------------+      +-------------------------+      +-------------------+
```

Identity answers *who*. Authorization answers *is it allowed*. EthersFlow answers: *is this specific action legitimate?*

```
   +-------------------------------------------------------------+
   |             Agent Host / MCP Client Environment             |
   |      (Claude Desktop · Cursor · LangChain · Custom Agent)    |
   +------------------------------+------------------------------+
                                  | MCP Tool Call: verify_agent_action
                                  v
   +-------------------------------------------------------------+
   |            @ethersflow/mcp-server (stdio / SSE / HTTP)       |
   +------------------------------+------------------------------+
                                  | HTTPS /api/v1/verify
                                  v
+-------------------------------------------------------------------------------+
|                 EthersFlow Action-Verification Gateway (KYAA)                 |
|                                                                               |
|   +-----------------------+               +---------------------------------+ |
|   |  Deterministic Kernel | (fast-path)   | Adversarial Multi-Model Council | |
|   |  & Catalog Matcher    | ------------> |  (Heterogeneous LLM Panel)      | |
|   +-----------+-----------+               +----------------+----------------+ |
|               |                                           |                   |
|               +---------------------+---------------------+                   |
|                                     |                                         |
|                                     v                                         |
|                       +---------------------------+                           |
|                       |  Ed25519 Signature Engine |                           |
|                       +-------------+-------------+                           |
+-------------------------------------+-----------------------------------------+
                                      | Ed25519-Signed Verdict Receipt
                                      v
              +-----------------------------------------------+
              |   APPROVED / FLAGGED / REJECTED Decision Gate |
              |          (Agent halts or executes)            |
              +-----------------------------------------------+
```

---

## Latency Profile & Performance Benchmarks

EthersFlow operates a dual-lane execution engine balancing rapid determinism with multi-model adversarial deliberation:

| Execution Lane | Measured Latency (v0.4.0) | Mechanism | Guarantee & Finality |
| :--- | :--- | :--- | :--- |
| **Policy Fast Path (`FAST_PATH`)** | **4 – 11 ms** (kernel) / **~126 ms** (edge p50) | Deterministic safety kernel & catalog matcher (clean read-only observability or reconciled micro-expense <= $100 with approved vendor & operational ticket anchor). Returns `fast_path_ineligibility_reasons: []`. | `POLICY_FAST_PATH_APPROVAL` |
| **Idempotent Replay** | **3.2 – 4.5 ms** | Milliseconds-class deduplication on repeated `idempotency_key` and action hash. | `replayed: true` |
| **Adversarial Consensus (`CONSENSUS`) — 2-Agent Council** | **0.9 – 1.2 s** (v0.4.0 measured, 0 fallbacks) | Parallel cross-family deliberation across **Qwen 3.8 27B** + **GPT-OSS 120B** (`strict_cross_family_v1`) with Ed25519 node & root attestations (`models_digest` bound). | `POLICY_SUPERMAJORITY_APPROVAL` / `POLICY_FINAL_BLOCK` |
| **Adversarial Consensus (`CONSENSUS`) — 3-Agent Council** | **~8.0 s** (v0.4.0 measured, 0 fallbacks) | Parallel 3-family deliberation across **Qwen 3.8 27B** (`groq`) + **GPT-OSS 120B** (`groq`) + **Nemotron-3 Super 120B** (`openrouter`). | `POLICY_SUPERMAJORITY_APPROVAL` / `POLICY_FINAL_BLOCK` |

Measured on the R90 published campaign (4,203 gated actions; median 1.1 s per gated action); per-case latencies are in the [raw bundle](https://ethersflow.juno.page/qa-explorer/). Full methodology: [white paper](https://ethersflow.juno.page/ethersflow-report/).

> **Structuring Defense & Automatic Escalation**: To prevent autonomous agents from splitting large operations into multiple micro-transactions to bypass policy controls, requests that exceed safety thresholds or exhibit anomalous frequency automatically escalate from the deterministic `FAST_PATH` to the multi-model `CONSENSUS` lane.
>
> **Exact `FAST_PATH` Eligibility & Diagnostics (v0.4.0)**: Every `CONSENSUS` verdict includes `fast_path_ineligibility_reasons[]` explaining precisely why deterministic fast-path was bypassed (e.g. `MUTATION_OR_EXEC_VERB_DETECTED`, `AMOUNT_EXCEEDS_FAST_PATH_CEILING_100_USD`, `NO_RECONCILED_MICRO_AMOUNT_DETECTED`, `POLICY_DISALLOWS_FAST_PATH`, `UNMAPPED_POLICY_RULE_DETECTED`, `CUSTOM_INSTRUCTIONS_REQUIRE_COUNCIL`, `SCOPE_GRANT_REQUIRES_COUNCIL`). Fast-path activates only when `rules.fast_path_allowed !== false`, zero unmapped rules or `custom_instructions` are present, no mutation/egress hazards or scope-grant assertions exist, and the action is either a reconciled micro-purchase (`<= $100` with ticket anchor under `financial_compliance`) or a read-only allowlisted observability probe.

---

## Retention Architecture & Audit Logging

EthersFlow unifies audit compliance with strict data privacy through a **receipt-persist + payload-discard** model:

- **Default Behavior: Ephemeral Zero Retention (`zero_retention: true`)**:
  By default, EthersFlow operates in strict ephemeral zero-retention mode (`durability: "none_zero_retention"`, `storage_engine: "zero_retention_ephemeral"`, `receipt_only_payload_discarded: true`, `retention_receipt_url: null`). The prompt, reasoning chain, and raw action payload are discarded from memory immediately after cryptographic signing and receipt delivery. No action text is stored anywhere.

- **Opt-In Durable Audit Vault (`retention_mode: "durable"` or `zero_retention: false`)**:
  When durable audit logging is explicitly requested for enterprise compliance, callers pass `retention_mode: "durable"` or `zero_retention: false`:
  ```json
  {
    "agent_action": "Order $42 notebooks from Staples under ticket FAC-902",
    "zero_retention": false
  }
  ```
  This persists the cryptographic receipt to the durable audit vault (`durability: "durable_audit_log"`, `storage_engine: "firestore_durable"`, `retention_receipt_url: "/api/v1/receipts/{request_id}"`).

  What the durable vault stores: signed receipts and verdict metadata only — never action payloads, prompts, or reasoning chains. Default mode remains strict ephemeral zero-retention; durable mode exists for enterprise audit evidence. Council calls are processed by third-party model providers (Groq, OpenRouter); upstream retention is governed by each provider's terms and is disclosed here so buyers can complete their own sub-processor review.

- **Cryptographic Action Hash Binding (Zero Payload Leakage)**:
  **Strict Privacy Invariant**: In both ephemeral and durable modes, EthersFlow binds ONLY the SHA-256 action hash (`action_hash: sha256(agent_action)`). Raw prompt and action text are **never persisted to the database vault**. An auditor can verify the Ed25519 signature on the decision without exposing sensitive business prompts to storage breaches.
  Authorized audit teams can retrieve or delete receipts using `GET /api/v1/receipts/{verdict_id}` and `DELETE /api/v1/receipts/{verdict_id}`.
---

## Canonical Policies, Custom Policy CRUD & Provably Independent Council (v0.4.0)

Every EthersFlow decision receipt binds a canonical or caller-defined `policy_id` and SHA-256 `policy_hash` across both top-level metadata (`receipt.policy_id`, `receipt.policy_current`) and the signed configuration tuple (`receipt.receipt_v2.config_tuple.policy_id`).

### Built-in Canonical Policies
| Policy ID | Description | Default Rules & Thresholds |
|---|---|---|
| `finops_default_v1` | **Default Enterprise FinOps Safety Policy** | Dual-lane evaluation: Micro-expense fast-path (`<=$100`, approved catalog vendor, ticket anchor, 5 approvals/24hr window) and multi-model consensus fallback. |
| `tripwire_circuit_breaker_v1` | **High-Assurance Circuit Breaker Policy** | Immediate fail-closed tripping on anomalous wire transfers, credential exfiltration, prompt injection patterns, or authority bypasses. |

### Custom Policy CRUD, Auto-Match Compiler & Lifecycle Signals
- **Policy API (`POST / GET / PATCH / PUT / DELETE /api/v1/policies`)**: Caller-scoped custom policies with auth-before-schema `401` enforcement, deterministic SHA-256 `policy_hash`, and fail-closed validation rejecting any hostile fail-open toggle (`400 POLICY_VALIDATION_FAILED`).
- **Deterministic Auto-Match Compiler (`auto_match_v1.0.0`)**: Automatically compiles policy JSON rules into the appropriate adversarial reviewer council with zero LLM non-determinism; unmapped rules explicitly trigger fail-closed `UNMAPPED_POLICY_RULE_DETECTED`.
- **Silent-Defaults Guard**: `POST /api/v1/policies` echoes `effective_rules`, `has_active_rules`, and `warnings[]` (emitting `EMPTY_POLICY_RULES_SILENT_DEFAULTS` when all thresholds/filters are empty; pass `strict_rules: true` to reject empty policies with `400 EMPTY_POLICY_RULES`).
- **Stale Policy Binding Signals**: Deprecating or superseding a policy (`PATCH /api/v1/policies/:id` with `{ deprecated: true, superseded_by }`) marks subsequent verdicts with `policy_current: false`, `policy_deprecation_warning`, `superseded_by`, and cryptographically signed `STALE_POLICY_BINDING`. Deleting a policy (`DELETE /api/v1/policies/:id`) fails closed on subsequent verifications with HTTP `410 POLICY_DELETED`.

### Registered Scope Grants (`/api/v1/scope-grants`)
- Self-attested or unregistered `scope_grant` claims always fail closed (`REJECTED` / `FORGED_OR_UNREGISTERED_SCOPE_GRANT` / `CRITICAL_BLOCK`).
- Provision verifiable delegated grants via `POST /api/v1/scope-grants` (caller-scoped, Ed25519-signed `grant_signature`, TTL-bounded), inspect via `GET /api/v1/scope-grants/:id`, and immediately revoke via `DELETE /api/v1/scope-grants/:id`.

### Provably Independent Multi-Model Council (`strict_cross_family_v1`)
The council is multi-model by construction. A default campaign council runs two primary reviewer seats — `qwen/qwen3.8-27b` and `openai/gpt-oss-120b`, both served via Groq — with NVIDIA Nemotron models (via OpenRouter) on escalation lanes. The full rotation catalog (additional families held for fallback and degraded-mode diversity) is inspectable anytime via `GET /api/v1/council/models` (Gemini 2.5 Flash is excluded from production council rotation: `gemini_in_council_rotation: false`). This composition is not a claim: every seat, provider, and token count is published per case in the R90 raw bundle (linked from the [QA Explorer](https://ethersflow.juno.page/qa-explorer/)).

**Rotation catalog (fallback + degraded-mode seats — not the default campaign council):**

| # | Model ID | Family | Provider / Route | Profile |
|---|---|---|---|---|
| 1 | `qwen/qwen3.8-27b` | `qwen` | Qwen / Groq LPUs | Dense Analytical & Multilingual |
| 2 | `openai/gpt-oss-120b` | `gpt-oss` | Groq LPUs | Deep Reasoning |
| 3 | `nvidia/nemotron-3-super-120b` | `nemotron` | NVIDIA / OpenRouter Free | Game-Theoretic Debate |
| 4 | `meta-llama/llama-3.3-70b-instruct` | `llama` | Meta / Groq / OpenRouter | High-Performance Dialectical Reasoning |
| 5 | `groq/compound-mini` | `compound` | Groq LPUs | Compound Reasoning |
| 6 | `openai/gpt-4o-mini` | `openai-gpt4o` | OpenAI / OpenRouter | High Fidelity & Compact |
| 7 | `nvidia/nemotron-3-ultra-550b` | `nemotron` | NVIDIA / OpenRouter Free | Deep Consensus & Nuance |
| 8 | `nvidia/nemotron-3.5-lightning` | `nemotron` | NVIDIA / OpenRouter Free | Free Low-Latency Audit |
| 9 | `qwen/qwen3.6-27b` | `qwen` | Groq LPUs | Ultra-Fast |
| 10 | `openai/gpt-oss-20b` | `gpt-oss` | Groq LPUs | Low-Latency |

Models in this catalog appear in published campaigns only when seat attribution in the raw bundle shows them firing. In R90, the bundle proves Qwen 3.8 27B + GPT-OSS 120B (primary) and Nemotron-3 Super/Ultra (escalation lanes).

**Hard Diversity Kernel Rule**: Primary seats and fallback passes strictly prioritize unused model families first, then unused models. If upstream outages force the council onto a single live model, the verdict explicitly surfaces `provenance.diversity_degraded: true`, `provenance.degraded_to_single_model: true`, and cryptographically signs `DIVERSITY_DEGRADED` into `reason_codes` and `attestation.bound_fields.models_digest`.

### Single-Key Access Model & Account-Level Usage Metering (`/api/v1/usage`)
- **Single-Key Principle**: One EthersFlow API key (`ef_live_...`) is the **only credential a customer needs** — it grants REST `/api/v1/verify`, MCP tools (`verify_agent_action` + `get_account_usage`), policy/scope-grant management, and the full hosted multi-model council with **zero model-provider keys required**. Optional per-seat BYOK headers (`X-BYOK-Groq-Key`, `X-BYOK-OpenRouter-Key`, `X-BYOK-OpenAI-Key`, `X-BYOK-NVIDIA-Key`) are supported as an opt-in add-on (billed at `$0.00` token cost + gate attestation fee only) and are never required.
- **Usage Metering (`GET /api/v1/usage`)**: Authenticated, tenant-isolated, time-windowed (`window=24h|7d|30d|90d|all` or `from`/`to`, `scope=account|key`, optional `key_id`/`model`/`family`) report returning verdict counts, `FAST_PATH` vs `CONSENSUS` lane split, per-model & per-family token/USD attribution, per-key rollups, custom policy counts, and mathematically balanced `reconciliation` totals.
- **Finance Export (`GET /api/v1/usage/export`)**: Authenticated period export per day × key × lane × model × billing mode as formula-safe RFC-4180 CSV (`?format=csv`, default) or Ed25519-signed JSON (`?format=json`) for invoice reconciliation.
- **Transparent Rate Card (`GET /api/v1/usage/pricing`)**: Public per-model pricing schedule reflecting free-tier Nemotron seats, Groq LPU seats, GPT-4o Mini, `ethersflow_kernel` Fast Path, optional BYOK passthrough, and `$0.00` idempotent replays.

```bash
# Account-wide usage report across all your keys (one EF key, zero provider keys)
curl -s "https://www.ethersflow.com/api/v1/usage?scope=account&window=30d" \
  -H "Authorization: Bearer $ETHERSFLOW_API_KEY"

# Finance reconciliation CSV export (or ?format=json for Ed25519-signed JSON)
curl -s "https://www.ethersflow.com/api/v1/usage/export?format=csv&window=30d" \
  -H "Authorization: Bearer $ETHERSFLOW_API_KEY" -o ethersflow-usage.csv

# Public per-model rate card
curl -s "https://www.ethersflow.com/api/v1/usage/pricing"
```

---

## Enforcement vs. Advisory Positioning

EthersFlow provides a **hybrid enforcement and advisory architecture**:

1. **Deterministic Enforcement Gates (Fail-Closed by Default)**:
   - High-risk operations, prompt injections, and grounding contradictions receive an unconditional `REJECTED` or `FLAGGED_HUMAN_REVIEW` verdict with `approval_blocked: true`.
   - Gate wrappers like `cloudflareVerifyGate` in `@ethersflow/sdk` or execution bindings (`POST /api/v1/binding/confirm`) strictly halt agent execution unless an active, cryptographically signed approval receipt exists.
   - **Strict Fail-Closed Guarantee**: If an internal gateway error, network partition, or upstream timeout occurs, EthersFlow **always fails closed** (returning `verdict: "REJECTED"`, `approval_blocked: true`, status 502/503). The gateway never approves without cryptographic verification.

2. **Advisory Multi-Model Consensus**:
   - For subjective or borderline decisions, the gateway provides rich multidimensional telemetry: `consensus_score`, `risk_index`, and signed individual perspectives across heterogeneous models.
   - Flagged actions require human oversight, supported by the Human-in-the-Loop review API (`/api/v1/reviews/resolve`).

---

## What's Included

This repository contains the official client surfaces and developer tools for the EthersFlow ecosystem:

| Surface | Path | Description |
|---|---|---|
| MCP Server | [`/mcp-server`](mcp-server/README.md) | Model Context Protocol server for Claude Desktop, Cursor, and MCP clients |
| Python Demo & Verifier | [`efverify.py`](efverify.py) | Zero-dependency pure-Python client and Ed25519 signature validator |
| Python SDK | [`/sdk/python`](sdk/python) | Native Python package & LangChain tool wrapper |
| TypeScript SDK | [`/sdk/typescript`](sdk/typescript) | TypeScript SDK + Cloudflare Worker middleware helper |
| Postman Collection | [`/postman`](postman) | 11-request Postman collection + environment variables |

*Note: The core Federated Adversarial Consensus engine operates with default receipt-only persistence and payload discard (verdicts, reason codes, action hashes, and Ed25519 signatures retained; raw action payloads discarded immediately after signing). This repository currently hosts the gateway service alongside developer toolkits and SDKs ahead of the Phase C repository split.*

---

## 5-Minute Quickstart

### 1. cURL API Call (Fastest Proof)

```bash
curl -X POST "https://www.ethersflow.com/api/v1/verify" \
  -H "Authorization: Bearer $ETHERSFLOW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_action": "Transfer 5000 USDC to wallet 0x9f for smart contract audit",
    "persona_preset": "financial_compliance",
    "agent_count": 2
  }'
```

> `agent_count: 2` = the default campaign council (Qwen 3.8 27B + GPT-OSS 120B). Higher counts draw escalation lanes and cost more.

### 2. Python SDK & Zero-Dependency Verifier

Install via pip:
```bash
pip install ethersflow
```

Or run the included zero-dependency reference script:
```bash
python efverify.py verify "Transfer 5000 USDC to wallet 0x9f for smart contract audit"
```

### 3. Model Context Protocol (MCP) Server

#### Option A: Via NPX (With Account-Bound Key from [`ethersflow.com/api-keys.html`](https://www.ethersflow.com/api-keys.html))
Create a free EthersFlow account at [`https://www.ethersflow.com/api-keys.html`](https://www.ethersflow.com/api-keys.html) to mint your `ef_live_...` or 24h `ef_sandbox_...` API key, then run:
```bash
npx -y @ethersflow/mcp-server --api-key=YOUR_EF_API_KEY
```

#### Option B: Remote HTTP / SSE Gateway (Zero Local Dependencies)
Connect your MCP client directly to EthersFlow's production endpoint with connection-level authentication (mint a key at https://www.ethersflow.com/api-keys.html):
- **Endpoint**: `https://www.ethersflow.com/api/mcp`
- **Connection Header**: `Authorization: Bearer get_key_at_ethersflow.com/api-keys.html`
- **RFC 9728 / OAuth Resource Metadata**: In accordance with RFC 9728, unauthenticated requests return HTTP 401 with `WWW-Authenticate: Bearer realm="ethersflow-gateway", resource_metadata="/.well-known/oauth-protected-resource"`. Tool calls without authorization cleanly emit structured JSON-RPC `-32000` (`MISSING_AUTHORIZATION`) errors with preserved request IDs.
- **Claude / Cursor Client-Level Injection**: Inject the `Authorization` header at connection initialization so every tool call automatically inherits valid gateway authorization.

#### Option C: Claude Desktop Configuration
```json
{
  "mcpServers": {
    "ethersflow": {
      "command": "npx",
      "args": ["-y", "@ethersflow/mcp-server"],
      "env": {
        "ETHERSFLOW_TOKEN": "get_key_at_ethersflow.com/api-keys.html",
        "ETHERSFLOW_BASE_URL": "https://www.ethersflow.com"
      }
    }
  }
}
```

#### Option D: From source
```bash
git clone https://github.com/Ethersflow/EthersFlow.git
cd EthersFlow/mcp-server
npm install
npm start
```

When you launch the server from a terminal you'll see the EthersFlow boot splash — the vortex emblem with orbiting nodes — resolving to RUNNING · STDIO when the council is seated. It renders on stderr only and auto-disables when stderr isn't a terminal (or with EF_NO_SPLASH=1).

---

## Fast-Path Diagnostics & Anchor Remediation (Naive-Phrasing UX)

EthersFlow evaluates requests across two primary execution lanes:
1. **`FAST_PATH` (<200ms, ~126ms gateway, ~4ms kernel nodes)**: Deterministic, synchronous policy verification for low-risk micro-expenses (under $100) or read-only internal telemetry anchored by verified operational artifacts.
2. **`CONSENSUS` (median 1.1 s in R90)**: Multi-model adversarial cross-examination across independent live models (median 1.1 s per gated action in the R90 published campaign; see the [white paper](https://ethersflow.juno.page/ethersflow-report/)).

When an autonomous agent submits a benign action with naive or unstructured phrasing (e.g., omitting operational tickets or vendor anchors), EthersFlow routes the request to the `CONSENSUS` lane, issuing a `FLAGGED_HUMAN_REVIEW` verdict with a detailed `fast_path_ineligibility_reasons` diagnostic array.

### Worked Example: Diagnosing and Remediating a Naive Request

#### Step 1: The Naive Benign Request
A developer or agent submits an unanchored micro-expense:
```json
POST /api/v1/verify
{
  "agent_action": "Order pens and paper for the team"
}
```

#### Step 2: The Diagnostic Response
Because the request lacks structured anchors, it cannot be fast-pathed and is flagged for review:
```json
{
  "verdict": "FLAGGED_HUMAN_REVIEW",
  "policy_fast_path": false,
  "lane": "CONSENSUS",
  "fast_path_ineligibility_reasons": [
    "AMOUNT_UNDETERMINED: Action text does not specify a parseable dollar amount or amount_usd in context.",
    "TICKET_MISSING: Operational ticket anchor (e.g. FAC-*, OPS-*, JIRA-*) missing from context and action.",
    "COUNTERPARTY_UNVERIFIED: Counterparty missing or not verified against approved catalog allowlist.",
    "BUDGET_LINE_MISSING: Spend category, scope, or budget line allocation missing from context."
  ]
}
```

#### Step 3: Reading the Diagnostic Reasons & Supplying Missing Anchors
The developer or agent loop inspects `fast_path_ineligibility_reasons` and supplies the four missing operational anchors:
1. **Amount**: Provide dollar amount in action text (`"$10 of pens"`) or in `context.amount_usd: 10.00`.
2. **Ticket Anchor**: Attach an operational ticket identifier (`"under ticket FAC-911"` or `context.ticket: "FAC-911"`).
3. **Counterparty**: Specify an approved catalog vendor (`"from Staples"` or `context.vendor: "Staples"`).
4. **Scope / Budget Allocation**: Define the procurement scope (`context.scope: "routine_office_supplies"` or `context.budget_line: "office_supplies_q3"`).

#### Step 4: The Remediated Fast-Path Request
```json
POST /api/v1/verify
{
  "agent_action": "Order $10 of pens from Staples under ticket FAC-911",
  "context": {
    "ticket": "FAC-911",
    "vendor": "Staples",
    "scope": "routine_office_supplies"
  }
}
```

#### Step 5: Immediate Sub-Second Fast-Path Approval
```json
{
  "verdict": "APPROVED",
  "policy_fast_path": true,
  "lane": "FAST_PATH",
  "fast_path_ineligibility_reasons": [],
  "consensus_score": 96.8,
  "risk_index": 1.5,
  "latency_ms": 126,
  "attestation": {
    "status": "VERIFIED_ED25519_SIG",
    "key_id": "ef_attest_v5",
    "version": "4.0"
  }
}
```

---

## What You Get Back: Anatomy of a Verdict Receipt

Every EthersFlow verification call returns a cryptographically signed verdict receipt binding decision semantics, granular scores, and multi-model consensus telemetry to an immutable action hash:

### 1. Three Calibrated Scores & Derivation Math

EthersFlow derives three orthogonal dimensions of action integrity rather than a single opaque score:

1. **`consensus_score` (0.0 to 100.0)**:
   The supermajority-weighted approval confidence across active council nodes and deterministic safety rules:
   $$\text{consensus\_score} = \sum_{i=1}^{N} w_i \cdot s_i$$
   where $s_i$ is the individual score assigned by each node (0 to 100) and $w_i$ is the normalized node weight. In `FAST_PATH` mode, deterministic safety rule bands set this directly (e.g., 96.8 for verified read-only observability).

2. **`reviewer_agreement` (0.000 to 1.000)**:
   Inter-rater concordance across heterogeneous models. An agreement of `1.000` indicates unanimous consensus across all participating council models and deterministic rule screens. Values below `0.700` indicate divergence triggering human-in-the-loop review.

3. **`risk_index` (0.0 to 10.0)**:
   Composite threat metric reflecting action blast radius, mutation velocity, destination surface, and authority claims. Actions with `risk_index >= 7.0` trip high-assurance circuit breakers (`approval_blocked: true`).

```json
"score_attribution": {
  "score_type": "hybrid_kernel_and_live_council",
  "rule_band": "SAFE_EXECUTION",
  "rule_id": "READ_ONLY_OBSERVABILITY_VERIFIED",
  "calibrated_score": 96.8,
  "risk_index": 2.0,
  "node_level_scores": [
    {
      "role": "Zero-Trust Security Architect",
      "node_status": "APPROVED",
      "assigned_score": 97.0
    },
    {
      "role": "IAM & Privilege Escalation Auditor",
      "node_status": "APPROVED",
      "assigned_score": 96.5
    }
  ]
}
```

### 2. Transparent Provider Request IDs (Auditable on Inference Dashboards)

Every adversarial debate perspective includes raw upstream provider request IDs (`provider_request_id`), resolved model family (`model_family`), and cryptographically bound `models_digest`:
- `chatcmpl-...` for Groq LPUs (`qwen/qwen3.8-27b`, `qwen/qwen3.6-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound-mini`) and OpenAI (`gpt-4o-mini`)
- `gen-...` for OpenRouter (`nvidia/nemotron-3.5-super-vl:free`, `nvidia/nemotron-3-ultra-550b-a55b:free`, `nvidia/nemotron-3.5-lightning:free`, `meta-llama/llama-3.3-70b-instruct`)

Security and audit teams can take any `provider_request_id` directly to Groq, OpenRouter, NVIDIA, or OpenAI provider logs to verify the raw prompt, timestamp, and inference origin without trusting EthersFlow's intermediate gateway.

### 3. Dual Ed25519 Cryptographic Attestations (Canonical v4 Format)

Every receipt contains a root attestation and per-node signatures generated under the active key (`ef_attest_v5`). The signed payload binds all critical decision fields into an immutable, colon-delimited string (and `attestation.bound_fields` records `models_digest` and `actual_models`):

```text
v4:<request_id>:<action_hash>:<policy_id>:<verdict>:<action_eligible>:<consensus_score>:<reviewer_agreement>:<risk_index>:<evidence_status>:<grounding_status>:<reason_codes>:<approval_blocked>:<timestamp>:<version>
```

**Privacy Guarantee**: The canonical string binds `action_hash` (`sha256(agent_action)`), never the raw action text. An external auditor can verify cryptographic authenticity without exposing sensitive operational payloads.

### 4. Lane Honesty: Fast-Path vs. Consensus

| Property | FAST_PATH Lane | CONSENSUS Lane |
| :--- | :--- | :--- |
| **Measured Latency (v0.4.0)** | 4 – 11 ms kernel (~126 ms edge p50) | 0.9 – 1.2 s (2-agent Groq LPUs) / ~8.0 s (3-agent cross-provider) |
| **Inference Source** | Deterministic Safety Kernel (`policy-kernel-fast-path-v4` @ `ethersflow_kernel`) | Provably Independent Multi-Model Council (`strict_cross_family_v1`: Qwen 3.8 27B + GPT-OSS 120B primary seats; Nemotron escalation lanes) |
| **Model Invocations** | Zero live LLM calls. Deterministic catalog & rule matching. | Live multi-family parallel debate & adversarial cross-examination. |
| **Receipt Structure** | Dual kernel-attested signatures under `ef_attest_v5`; `fast_path_ineligibility_reasons: []`. | Independent per-model Ed25519 signatures with live provider request IDs, `models_digest`, `diversity_degraded`, and `fast_path_ineligibility_reasons[]`. |

### 5. Control Surface Reference

| Output Field | Type | Values | Meaning & Enforcement Directive |
| :--- | :--- | :--- | :--- |
| `verdict` | string | `APPROVED`, `FLAGGED_HUMAN_REVIEW`, `REJECTED` | High-level gateway decision. |
| `action_eligible` | boolean | `true`, `false` | Execution flag. Agent runners **must halt** immediately if `false`. |
| `approval_blocked` | boolean | `true`, `false` | Tripwire circuit-breaker flag. `true` on prompt injections, credential theft, and wire transfers exceeding bounds. |
| `lane` | string | `FAST_PATH`, `CONSENSUS` | Indicates whether decision was deterministic or council-deliberated. |
| `idempotency_key` | string / null | User UUID | Deduplication key reference. Milliseconds-class replay on repeat calls. |

### 6. Annotated Real Rejection Receipt (Credential Exfiltration Trap)

```json
{
  "verification_schema_version": 3,
  "request_id": "req_8f12a9c401be9d72",
  "verdict_id": "req_8f12a9c401be9d72",
  "trace_id": "trace_a992bc01ef",
  "verdict": "REJECTED",
  "status": "REJECTED",
  "verified": false,
  "action_eligible": false,
  "approval_blocked": true,
  "lane": "CONSENSUS",
  "consensus_score": 5.2,
  "risk_index": 9.8,
  "reviewer_agreement": 1.000,
  "policy_id": "cybersecurity_auditor_v1",
  "policy_fast_path": false,
  "reason_codes": [
    "CREDENTIAL_EXFILTRATION_ATTEMPT",
    "PRIVILEGE_ESCALATION_ATTEMPT",
    "CRITICAL_SECURITY_HAZARD",
    "EXECUTION_DENIED"
  ],
  "score_attribution": {
    "score_type": "hybrid_kernel_and_live_council",
    "rule_band": "CRITICAL_BLOCK",
    "rule_id": "CRITICAL_SECURITY_HAZARD",
    "calibrated_score": 5.2,
    "risk_index": 9.8,
    "node_level_scores": [
      {
        "role": "Zero-Trust Security Architect",
        "node_status": "REJECTED",
        "assigned_score": 5.0
      },
      {
        "role": "IAM & Privilege Escalation Auditor",
        "node_status": "REJECTED",
        "assigned_score": 5.4
      }
    ]
  },
  "adversarial_debate": [
    {
      "role": "Zero-Trust Security Architect",
      "model_id": "qwen/qwen3.8-27b",
      "model_family": "qwen",
      "provider": "groq",
      "provider_request_id": "chatcmpl-8a19c2ef4102b",
      "node_status": "REJECTED",
      "perspective": "REJECTED: Action attempts to read and transmit master IAM secrets to external endpoint. Unconditional block.",
      "latency_ms": 842,
      "attestation_status": "VERIFIED_ED25519_SIG"
    },
    {
      "role": "IAM & Privilege Escalation Auditor",
      "model_id": "openai/gpt-oss-120b",
      "model_family": "gpt-oss",
      "provider": "groq",
      "provider_request_id": "chatcmpl-9201fba41",
      "node_status": "REJECTED",
      "perspective": "REJECTED: Violation of least-privilege boundary. Exfiltration pattern detected in proposed action arguments.",
      "latency_ms": 914,
      "attestation_status": "VERIFIED_ED25519_SIG"
    }
  ],
  "provenance": {
    "diversity_enforced": true,
    "diversity_policy": "strict_cross_family_v1",
    "diversity_degraded": false,
    "degraded_to_single_model": false,
    "resolved_models": ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"],
    "resolved_model_families": ["qwen", "gpt-oss"],
    "distinct_model_count": 2,
    "distinct_family_count": 2,
    "gemini_excluded_from_rotation": true,
    "fallback_events": []
  },
  "attestation": {
    "status": "VERIFIED_ED25519_SIG",
    "key_id": "ef_attest_v5",
    "version": "4.0",
    "algorithm": "Ed25519-EdDSA",
    "canonical_payload": "v4:req_8f12a9c401be9d72:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855:cybersecurity_auditor_v1:REJECTED:false:5.2:1.000:9.8:VERIFIED:VERIFIED:CREDENTIAL_EXFILTRATION_ATTEMPT,PRIVILEGE_ESCALATION_ATTEMPT,CRITICAL_SECURITY_HAZARD,EXECUTION_DENIED:true:2026-10-24T00:41:54.000Z:ef_attest_v5",
    "signature": "38a1e94cf2...",
    "canonical_serialization_spec": "canonical_delimited_v4: v4:requestId:actionHash:policyId:verdict:actionEligible:consensusScore:reviewerAgreement:riskIndex:evidenceStatus:groundingStatus:reasonCodes:approvalBlocked:timestamp:version"
  },
  "retention": {
    "mode": "ephemeral",
    "policy": "receipt_only_payload_discarded",
    "durability": "none_zero_retention",
    "payload_retained": false,
    "action_hash_bound": true,
    "action_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "storage_engine": "zero_retention_ephemeral",
  "storage_durability": "none_zero_retention",
  "zero_data_retention": true,
  "latency_ms": 1845
}
```

---

## Idempotency & Replay Semantics (B3 Dedup Surface)

EthersFlow implements **opt-in deduplication** at the verification boundary to support both high-throughput distributed agent swarms and explicit, intentional re-verifications:

### 1. Default Behavior: Fresh Execution (Dedup is Opt-In)
When duplicate actions are submitted **without** an `idempotency_key`:
- EthersFlow evaluates each request freshly through the verification engine.
- Every invocation generates a new cryptographic signature and unique `request_id`.
- Response indicates `replayed: false` and `c2_replayed: false`.

### 2. Opt-In Deduplication (`idempotency_key`)
To prevent duplicate financial disbursements, API calls, or ticket mutations across retrying agents, include an `idempotency_key` (via JSON body `idempotency_key` or HTTP header `Idempotency-Key` / `X-Idempotency-Key`):
- **Initial Verification**: Evaluates the action, generates the Ed25519 attestation, commits the receipt, and caches the result (`replayed: false`, `replay_index: 0`).
- **Chained Replay (Subsequent Invocations)**: Instantly returns the cached decision receipt in **~12ms** (`replayed: true`, `c2_replayed: true`).
- **Chained Replay Index**: Each replayed call increments `replay_index` (`1, 2, ...`), creates a distinct audit transaction ID, while preserving the reference to `original_request_id` and the immutable `action_hash`.
```bash
# Get a key at https://www.ethersflow.com/api-keys.html
# First Call (Fresh Verification ~126ms Fast-Path or median 1.1 s Consensus in R90)
curl -X POST https://www.ethersflow.com/api/v1/verify \
  -H "Authorization: Bearer $ETHERSFLOW_API_KEY" \
  -H "Idempotency-Key: agent-step-uuid-101" \
  -d '{"agent_action": "Order $10 of pens from Staples under ticket FAC-911"}'
# Response: {"request_id": "req_a1b2...", "replayed": false, "replay_index": 0, ...}

# Second Call (Instant Replay ~12ms)
curl -X POST https://www.ethersflow.com/api/v1/verify \
  -H "Authorization: Bearer $ETHERSFLOW_API_KEY" \
  -H "Idempotency-Key: agent-step-uuid-101" \
  -d '{"agent_action": "Order $10 of pens from Staples under ticket FAC-911"}'
# Response: {"request_id": "req_c3d4...", "original_request_id": "req_a1b2...", "replayed": true, "replay_index": 1, ...}
```

---

## Retention Architecture & Derived Fields Policy (N2 & N4)

EthersFlow strictly distinguishes between raw unparsed action payloads and derived operational audit metadata:

### Derived Fields are Non-Payload Audit Metadata (N2)
- **Derived Fields**: Attributes deterministically extracted by policy rules (e.g. approved catalog vendor names, parsed currency amounts, operational ticket identifiers, normalized action hashes, and Ed25519 cryptographic signatures) are classified as **non-payload audit metadata**.
- **Raw Payloads**: The raw, unstructured action text is discarded immediately after attestation signing by default (`payload_retained: false`, `agent_action: "[PAYLOAD_DISCARDED]"`).
- **Audit Persistence**: Storing derived operational metadata enables independent verification and proof-of-decision without retaining potentially sensitive prompt text.

### Retention Honesty per Decision State (N4)
- **Fast-Path Approvals**: Default receipt-only persistence (`retention.policy: "receipt_only_payload_discarded"`, `perspectives_retained: false`).
- **Flagged Human Reviews**: For actions requiring operator adjudication, auditor debate perspectives are preserved solely for review resolution (`retention.policy: "flagged_audit_review_perspectives_retained"`, `perspectives_retained: true`, `raw_action_discarded: true`, `retention_scope: "submitter_audit_resolution"`). Neither path retains raw action payloads.

---

## Status & Known Limitations

- **Ed25519-Signed Audit Trail**: Every audit node output and overall verdict is signed using Ed25519-EdDSA (`ef_attest_v5`). Signatures can be verified independently offline against `/.well-known/jwks.json` with zero trust required in EthersFlow's servers.
- **Probabilistic, Not Deterministic**: Borderline or ambiguous actions (e.g., high-value wire transfers or missing compliance records) evaluate near decision thresholds (`APPROVED` <-> `FLAGGED_HUMAN_REVIEW`). We strongly recommend routing any `FLAGGED_HUMAN_REVIEW` verdict directly to human operators for sign-off.
- **Live Model Engine (v0.4.0 Provably Independent Multi-Model Council)**: Powered by a multi-model council governed by `strict_cross_family_v1`: two primary reviewer seats (Qwen 3.8 27B + GPT-OSS 120B via Groq) with NVIDIA Nemotron escalation lanes (OpenRouter), drawn from a wider rotation catalog across 6 model families. Every seat records live `provider_request_id`, `model_family`, and `models_digest` in the Ed25519 attestation; Gemini 2.5 Flash is excluded from production council rotation.
- **Gateway Architecture & Repository Evolution**: The core Federated Adversarial Consensus backend operates as a secure API service with default receipt-only persistence and payload discard (verdicts, reason codes, action hashes, and Ed25519 signatures retained; raw action payloads discarded immediately after signing). Currently, this repository hosts the gateway service alongside developer toolkits and SDKs; backend engine code will be segregated into a dedicated repository in Phase C.

---

## Key Features

- **Multi-Model Consensus**: Reduces single-model bias by forcing heterogeneous council models into adversarial cross-examination.
- **Ed25519 Attestation**: Every debate node output and decision receipt is signed with an Ed25519 cryptographic key (`ef_attest_v5`). Public key set available at `/.well-known/jwks.json`.
- **Retention Architecture & Payload Discard**: By default, EthersFlow operates in strict ephemeral mode, discarding raw action payloads immediately after signing while persisting only the cryptographic receipt artifact (verdict, normalized hashes, Ed25519 signature, reason codes, request ID). Full payload audit retention is strictly opt-in per call (`zero_retention: false`), and action payloads are never used for model training.
- **OpenAI & Anthropic Drop-In Proxies**: Use `/v1/chat/completions` or `/v1/messages` as a drop-in replacement for existing agent pipelines.
- **Specialized Personas**:
  - `financial_compliance` (FINRA/SEC, wire limits, KYC, sanctions)
  - `clinical_safety` (ISMP high-alert meds, dosage bounds, FDA)
  - `cybersecurity_auditor` (NIST SP 800-53, privilege escalation, SOC 2)
  - `legal_citation` (FCPA, evidentiary privilege, contract breach)
  - `general_adversarial` (Cross-domain safety & logic verification)

---

## Framework Integrations

### LangChain (Python)

```python
import os
from ethersflow import EthersFlowLangChainTool

# Get a free sandbox or live key at https://www.ethersflow.com/api-keys.html
verifier_tool = EthersFlowLangChainTool(api_key=os.getenv("ETHERSFLOW_API_KEY", "get_key_at_ethersflow.com/api-keys.html"))

# Add to your LangChain agent tools
tools = [verifier_tool]
```

### Cloudflare Workers / Agents SDK (TypeScript)

```typescript
import { cloudflareVerifyGate } from '@ethersflow/sdk';

export default {
  async fetch(request: Request, env: { ETHERSFLOW_API_KEY: string }) {
    const isSafe = await cloudflareVerifyGate(
      "Transfer 5000 USDC to wallet 0x9f",
      "Vendor audit payment",
      env.ETHERSFLOW_API_KEY
    );

    if (!isSafe) {
      return new Response("Action blocked by EthersFlow Consensus Gate", { status: 403 });
    }

    // Proceed with execution
  }
};
```

---

## Security & Ed25519 Attestation

EthersFlow publishes its public key set in standard JSON Web Key Set (JWKS) format:

- **JWKS Endpoint**: `GET /.well-known/jwks.json` (RFC 8037 OKP profile, `Cache-Control: public, max-age=3600`)
- **Attestation Manifest**: `GET /.well-known/attestation.json`
- **Public Key Endpoint**: `GET /api/v1/receipts/public-key`
- **Verification Endpoint**: `POST /api/v1/verify-attestation`

### Independent Offline Verification (Zero-Trust)
You can verify signatures completely offline without contacting EthersFlow servers:
```bash
# Run full local verification test suite
python efverify.py demo

# Verify a saved verdict receipt JSON locally offline
python efverify.py verify-file receipt.json

# Print the complete offline byte recipe for auditors
python efverify.py recipe
```

---

## Held-Out Adversarial Evaluation & Calibration Anti-Circularity

To ensure empirical rigor and prevent circular evaluation (testing against samples seen during development), EthersFlow maintains an independently developed held-out test battery:

- **Author**: Independent Red Team & AI Safety Consortium.
- **Developer Visibility**: Strictly held-out during development; zero exposure during prompt engineering and ruleset authoring.
- **Acceptance QA**: Completed and published — see the [External Verification White Paper](https://ethersflow.juno.page/ethersflow-report/) and [QA Explorer](https://ethersflow.juno.page/qa-explorer/) for the full battery, results, and disclosures. A methodology-reconciliation pass against published baselines is scheduled.

---

## Empirical Evidence — External Verification Report

Results below are from the published external verification battery (R79), re-verified on later builds by the same vendor, published in full (R86/R90) against production. Full methodology, acceptance history, and disclosure of every limitation: **[EthersFlow External Verification White Paper](https://ethersflow.juno.page/ethersflow-report/)** | **[QA Explorer (R90 Raw Bundle)](https://ethersflow.juno.page/qa-explorer/)**.

**Headline:** 4,203 mapped attack scenarios · **97.48% defended** (rejected or escalated to human review; the action did not execute) · 2.52% got through (95% confidence interval on the miss rate: 2.07%–3.04%). Re-verified on later builds by the same vendor, published in full (R86: 102 of 4,103 = 2.49%; R90: median 1.1 s per gated action across 4,203 gated actions), reproducing the result within that interval.

**Per-suite results (share of attacks that got through):**

| Suite | Cases | Got through |
|---|---|---|
| InjecAgent | 2,108 | 0% |
| AgentDojo | 123 | 0% |
| PyRIT | 400 | 0.25% |
| garak | 721 | 1.11% |
| HarmBench | 200 | 2–4% |
| PurpleLlama | 251 | 8.76% |
| Agent Security Bench | 400 | 17.25% |

**Decision ledger (3,512 R79 production trials):** 89 approved · 2,706 rejected · 717 flagged for human review · median verdict time 1.4 s in R79 (R90 published campaign: median 1.1 s across 4,203 gated actions).

**Trajectory:** early builds defended 75.8% of InjecAgent and 10.7% of Agent Security Bench attacks (rejected or escalated to human review; the action did not execute); the defense rate climbed round over round to today's ceiling. The full round-by-round history is in the white paper.

> **Comparability caveat:** published baseline figures describe *undefended* models; the deltas above are directional until the methodology-reconciliation pass (scheduled) aligns test conditions exactly.

> **Honest disclosures:** pre-registered benign cases approve at 58.8% (57 of 97); the rest are escalated to human review (34) or rejected (6) — fail-closed by design, and the dedicated benign control set is small (a larger innocent-case battery is an open work item, F7, disclosed in the white paper). The historical R79/R86 benchmark numbers above were measured against EthersFlow's built-in internal policy layer (e.g. `finops_default_v1`); caller-defined custom policies (`/api/v1/policies`, now live in v0.4.0) are **not** covered by those earlier R79/R86 figures.

---

## Postman Collection

Import [`postman/ethersflow.postman_collection.json`](postman/ethersflow.postman_collection.json) and [`postman/ethersflow.postman_environment.json`](postman/ethersflow.postman_environment.json) into Postman to test all 11 core endpoints instantly.

---

## Links & Community

### MCP Listings
- Official MCP Registry: https://registry.modelcontextprotocol.io (search "Ethersflow")
- Smithery: https://smithery.ai/servers/ethersflow-dev/ethersflow
- Glama: https://glama.ai/mcp/servers/Ethersflow/EthersFlow

---

## License

Code & SDK wrappers licensed under [MIT License](LICENSE). Hosted EthersFlow API services subject to Terms of Service.
