# EthersFlow — Agent Action Verification Layer (KYAA)

EthersFlow MCP is the action-verification layer for AI Agents (KYAA — Know Your Agent's Action). An adversarial council of independent models examines what your agent is about to do — and returns a signed, independently checkable verdict before execution.

[![API Status](https://img.shields.io/badge/API-0.2.15-brightgreen.svg)](https://www.ethersflow.com)
[![MCP Server](https://img.shields.io/badge/MCP_Server-GitHub%20Direct-blue.svg)](mcp-server/README.md)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-Listed-blue)](https://registry.modelcontextprotocol.io)
[![smithery badge](https://smithery.ai/badge/ethersflow-dev/ethersflow)](https://smithery.ai/servers/ethersflow-dev/ethersflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Crypto: Ed25519](https://img.shields.io/badge/Attestation-Ed25519__EdDSA-purple.svg)](/.well-known/jwks.json)

---

## Overview

KYA establishes who your agent is and what it's allowed to do. KYAA (Know Your Agent's Action) verifies what it's actually doing — one signed action at a time. Identity gets your agent through the door. Verification decides what leaves with it.

EthersFlow is an action gate: it decides whether an agent's next action should execute — and notarizes its own decision with signed, independently verifiable evidence. Enforcement without proof is a black box; proof without enforcement is just an audit log after the damage is done. EthersFlow is the checkpoint that does both.

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
|   +-----------------------+               +-------------------------------+   |
|   |  Deterministic Kernel | (fast-path)   |  Adversarial Frontier Council |   |
|   |  & Catalog Matcher    | ------------> |  (Heterogeneous LLM Panel)    |   |
|   +-----------+-----------+               +---------------+---------------+   |
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

| Execution Lane | p50 Latency | p95 Latency | Mechanism | Guarantee & Finality |
| :--- | :--- | :--- | :--- | :--- |
| **Policy Fast Path** | **126 ms** | **210 ms** | Deterministic safety kernel & catalog matcher (<$100, allowlisted vendor, operational ticket, pre-fast-path intent screen). Kernel nodes evaluate in ~4 ms. | `POLICY_FAST_PATH_APPROVAL` |
| **Idempotent Replay** | **3.2 ms** | **4.5 ms** | Sub-millisecond deduplication on repeated `idempotency_key` and action hash. | `replayed: true` |
| **Adversarial Consensus** | **1.7 s** | **2.0 s** | Live multi-model debate across heterogeneous frontier models (Gemini 3.7 Flash + GPT-OSS-120B) with cryptographic node attestations (R74 measured, provider-timestamped). | `POLICY_SUPERMAJORITY_APPROVAL` / `POLICY_FINAL_BLOCK` |

> **Structuring Defense & Automatic Escalation**: To prevent autonomous agents from splitting large operations into multiple micro-transactions to bypass policy controls, requests that exceed safety thresholds or exhibit anomalous frequency automatically escalate from the deterministic Fast Path to the multi-model Consensus lane for thorough deliberation.
>
> **Policy-Driven Thresholds**: Fast-path ceilings (e.g. low-risk micro-expenses <$100), approved vendors, and ticket anchor requirements (e.g. Jira, ServiceNow, Ops tickets) are enforced via policy profiles (such as `finops_default_v1`), ensuring deterministic speed for routine actions and multi-model defense for high-stakes edge cases.

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

- **Cryptographic Action Hash Binding (Zero Payload Leakage)**:
  **Strict Privacy Invariant**: In both ephemeral and durable modes, EthersFlow binds ONLY the SHA-256 action hash (`action_hash: sha256(agent_action)`). Raw prompt and action text are **never persisted to the database vault**. An auditor can verify the Ed25519 signature on the decision without exposing sensitive business prompts to storage breaches.
  Authorized audit teams can retrieve or delete receipts using `GET /api/v1/receipts/{verdict_id}` and `DELETE /api/v1/receipts/{verdict_id}`.
---

## Canonical Policy IDs

Every EthersFlow decision receipt binds a canonical `policy_id` across both top-level metadata (`receipt.policy_id`) and the signed configuration tuple (`receipt.receipt_v2.config_tuple.policy_id`):

| Policy ID | Description | Default Rules & Thresholds |
|---|---|---|
| `finops_default_v1` | **Default Enterprise FinOps Safety Policy** | Dual-lane evaluation: Micro-expense fast-path (<$100, approved catalog vendor, ticket anchor, 5 approvals/24hr window) and multi-model consensus fallback. |
| `tripwire_circuit_breaker_v1` | **High-Assurance Circuit Breaker Policy** | Immediate fail-closed tripping on anomalous wire transfers, credential exfiltration, prompt injection patterns, or authority bypasses. |

---

## Enforcement vs. Advisory Positioning

EthersFlow provides a **hybrid enforcement and advisory architecture**:

1. **Deterministic Enforcement Gates (Fail-Closed by Default)**:
   - High-risk operations, prompt injections, and grounding contradictions receive an unconditional `REJECTED` or `FLAGGED_HUMAN_REVIEW` verdict with `approval_blocked: true`.
   - Gate wrappers like `cloudflareVerifyGate` in `@ethersflow/sdk` or execution bindings (`POST /api/v1/binding/confirm`) strictly halt agent execution unless an active, cryptographically signed approval receipt exists.
   - If an internal gateway error occurs, EthersFlow **fails closed** by default (`verdict: REJECTED`, `status: 500/503`) unless `fail_mode: "fail-open"` is explicitly opted into by the caller.

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
    "agent_count": 3
  }'
```

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

#### Option A: Via NPX (Recommended)
```bash
npx -y @ethersflow/mcp-server --api-key=YOUR_API_KEY
```

#### Option B: Remote HTTP / SSE Gateway (Zero Local Dependencies)
Connect your MCP client directly to EthersFlow's production endpoint with connection-level authentication:
- **Endpoint**: `https://www.ethersflow.com/api/mcp`
- **Connection Header**: `Authorization: Bearer YOUR_API_KEY`
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
        "ETHERSFLOW_TOKEN": "YOUR_API_KEY",
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

---

## Fast-Path Diagnostics & Anchor Remediation (Naive-Phrasing UX)

EthersFlow evaluates requests across two primary execution lanes:
1. **`FAST_PATH` (<200ms, ~126ms gateway, ~4ms kernel nodes)**: Deterministic, synchronous policy verification for low-risk micro-expenses (under $100) or read-only internal telemetry anchored by verified operational artifacts.
2. **`CONSENSUS` (~1.7–2.0s)**: Multi-model adversarial cross-examination across independent live frontier models.

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
   Inter-rater concordance across heterogeneous models. An agreement of `1.000` indicates unanimous consensus across all participating frontier models and deterministic rule screens. Values below `0.700` indicate divergence triggering human-in-the-loop review.

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

Every adversarial debate perspective includes raw upstream provider request IDs (`provider_request_id`):
- `gen-...` for Google Gemini 3.7 Flash
- `chatcmpl-...` for OpenAI/Groq GPT-OSS-120B

Security and audit teams can take any `provider_request_id` directly to Google Cloud Console or Groq/OpenRouter logs to verify the raw prompt, timestamp, and inference origin without trusting EthersFlow's intermediate gateway.

### 3. Dual Ed25519 Cryptographic Attestations (Canonical v4 Format)

Every receipt contains a root attestation and per-node signatures generated under the active key (`ef_attest_v5`). The signed payload binds all critical decision fields into an immutable, colon-delimited string:

```text
v4:<request_id>:<action_hash>:<policy_id>:<verdict>:<action_eligible>:<consensus_score>:<reviewer_agreement>:<risk_index>:<evidence_status>:<grounding_status>:<reason_codes>:<approval_blocked>:<timestamp>:<version>
```

**Privacy Guarantee**: The canonical string binds `action_hash` (`sha256(agent_action)`), never the raw action text. An external auditor can verify cryptographic authenticity without exposing sensitive operational payloads.

### 4. Lane Honesty: Fast-Path vs. Consensus

| Property | FAST_PATH Lane | CONSENSUS Lane |
| :--- | :--- | :--- |
| **Target Latency** | ~126 ms total (nodes ~4 ms) | 1.7 s – 2.0 s (R74 measured) |
| **Inference Source** | Deterministic Safety Kernel (`policy-kernel-fast-path-v4` @ `ethersflow_kernel`) | Heterogeneous Frontier Council (Gemini 3.7 Flash + GPT-OSS-120B) |
| **Model Invocations** | Zero live LLM calls. Deterministic catalog & rule matching. | Live multi-model parallel debate & adversarial cross-examination. |
| **Receipt Structure** | Dual kernel-attested signatures under `ef_attest_v5`. | Independent per-model Ed25519 signatures with live provider request IDs. |

### 5. Control Surface Reference

| Output Field | Type | Values | Meaning & Enforcement Directive |
| :--- | :--- | :--- | :--- |
| `verdict` | string | `APPROVED`, `FLAGGED_HUMAN_REVIEW`, `REJECTED` | High-level gateway decision. |
| `action_eligible` | boolean | `true`, `false` | Execution flag. Agent runners **must halt** immediately if `false`. |
| `approval_blocked` | boolean | `true`, `false` | Tripwire circuit-breaker flag. `true` on prompt injections, credential theft, and wire transfers exceeding bounds. |
| `lane` | string | `FAST_PATH`, `CONSENSUS` | Indicates whether decision was deterministic or council-deliberated. |
| `idempotency_key` | string / null | User UUID | Deduplication key reference. Sub-millisecond replay on repeat calls. |

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
      "model_id": "google/gemini-3.7-flash",
      "provider": "google",
      "provider_request_id": "gen-a99182bf9012c",
      "node_status": "REJECTED",
      "perspective": "REJECTED: Action attempts to read and transmit master IAM secrets to external endpoint. Unconditional block.",
      "latency_ms": 1780,
      "attestation_status": "VERIFIED_ED25519_SIG"
    },
    {
      "role": "IAM & Privilege Escalation Auditor",
      "model_id": "openai/gpt-oss-120b",
      "provider": "groq",
      "provider_request_id": "chatcmpl-9201fba41",
      "node_status": "REJECTED",
      "perspective": "REJECTED: Violation of least-privilege boundary. Exfiltration pattern detected in proposed action arguments.",
      "latency_ms": 1820,
      "attestation_status": "VERIFIED_ED25519_SIG"
    }
  ],
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
# First Call (Fresh Verification ~126ms Fast-Path or ~1.7–2.0s Consensus)
curl -X POST https://www.ethersflow.com/api/v1/verify \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Idempotency-Key: agent-step-uuid-101" \
  -d '{"agent_action": "Order $10 of pens from Staples under ticket FAC-911"}'
# Response: {"request_id": "req_a1b2...", "replayed": false, "replay_index": 0, ...}

# Second Call (Instant Replay ~12ms)
curl -X POST https://www.ethersflow.com/api/v1/verify \
  -H "Authorization: Bearer YOUR_API_KEY" \
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
- **Live Model Engine**: Powered by heterogeneous inference nodes across independent providers: **Gemini 3.7 Flash** (Google) and **GPT-OSS-120B** (Groq/OpenRouter), confirmed via live provider request IDs (`gen-...` and `chatcmpl-...`). Additional architectures (Llama 3.3 70B, Qwen 3.6/3.8 27B) are on the Bring-Your-Own-Key (BYOK) roadmap.
- **Gateway Architecture & Repository Evolution**: The core Federated Adversarial Consensus backend operates as a secure API service with default receipt-only persistence and payload discard (verdicts, reason codes, action hashes, and Ed25519 signatures retained; raw action payloads discarded immediately after signing). Currently, this repository hosts the gateway service alongside developer toolkits and SDKs; backend engine code will be segregated into a dedicated repository in Phase C.

---

## Key Features

- **Multi-Model Consensus**: Reduces single-model bias by forcing heterogeneous frontier models into adversarial cross-examination.
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

verifier_tool = EthersFlowLangChainTool(api_key=os.getenv("ETHERSFLOW_API_KEY", "your_api_key"))

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
- **Independent Acceptance QA**: Independent acceptance QA in progress.

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
