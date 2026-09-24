# EthersFlow — Developer Toolkit & Trust Layer

Developer toolkit for EthersFlow — a multi-model trust layer that verifies AI outputs through adversarial consensus. MCP server, SDKs, and API docs.

[![API Status](https://img.shields.io/badge/API-0.2.2-brightgreen.svg)](https://www.ethersflow.com)
[![MCP Server](https://img.shields.io/badge/MCP_Server-GitHub%20Direct-blue.svg)](mcp-server/README.md)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-Listed-blue)](https://registry.modelcontextprotocol.io)
[![smithery badge](https://smithery.ai/badge/ethersflow-dev/ethersflow)](https://smithery.ai/servers/ethersflow-dev/ethersflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Crypto: Ed25519](https://img.shields.io/badge/Attestation-Ed25519__EdDSA-purple.svg)](/.well-known/jwks.json)

---

## Overview

EthersFlow issues cryptographically signed, independently verifiable trust verdicts for AI agent actions before execution, providing dual-control verification and cryptographic audit trails.

```
                           +-------------------------------------+
                           |      Autonomous AI Agent            |
                           +------------------+------------------+
                                              | Proposed Action
                                              v
+----------------------------------------------------------------------------------------+
|                        EthersFlow Verification Gateway                                 |
|                                                                                        |
|  +----------------------+   +----------------------+   +----------------------------+  |
|  | Direct Pragmatist    |   | Constructive Skeptic |   | Lateral Synthesizer        |  |
|  +----------+-----------+   +----------+-----------+   +-------------+--------------+  |
|             +--------------------------+-----------------------------+                 |
|                                        | Adversarial Cross-Examination                 |
|                                        v                                               |
|                         +-----------------------------+                                |
|                         | Federated Consensus Engine  |                                |
|                         +--------------+--------------+                                |
|                                        | Ed25519 Signature                             |
+----------------------------------------+-----------------------------------------------+
                                         | Signed Verdict
                                         v
                 +----------------------------------------------+
                 |  APPROVED / FLAGGED / REJECTED Decision Gate |
                 +----------------------------------------------+
```

---

## Latency Profile & Performance Benchmarks

EthersFlow operates a dual-lane execution engine balancing sub-millisecond determinism with multi-model adversarial deliberation:

| Execution Lane | p50 Latency | p95 Latency | Mechanism | Guarantee & Finality |
| :--- | :--- | :--- | :--- | :--- |
| **Policy Fast Path** | **5.8 ms** | **9.3 ms** | Pre-compiled deterministic safety kernel & catalog matcher (<$100, allowlisted vendor, operational ticket). | `POLICY_FAST_PATH_APPROVAL` |
| **Idempotent Replay** | **3.2 ms** | **4.5 ms** | Sub-millisecond deduplication on repeated `idempotency_key` and action hash. | `replayed: true` |
| **Adversarial Consensus** | **12.4 s** | **13.0 s** | Live multi-model debate across heterogeneous frontier models (Qwen, Llama, Gemini) with cryptographic node attestations. | `POLICY_SUPERMAJORITY_APPROVAL` / `POLICY_FINAL_BLOCK` |

> **Velocity Capping Protection**: Operational tickets (e.g. `FAC-101`) have an automated allowance of **5 fast-path approvals per 24 hours** ($500 cap). When this threshold is reached, subsequent requests automatically fall back to the live multi-model consensus lane to prevent micro-expense structuring attacks. Full empirical data is published in [`docs/calibration-benchmark.md`](docs/calibration-benchmark.md).

---

## Retention Architecture & Audit Logging

EthersFlow unifies audit compliance with data privacy through a **receipt-persist + payload-discard** model:

- **Default Behavior (Receipt-Only Persistence)**:
  By default, EthersFlow persists the **receipt artifact only** (verdict, normalized hashes, Ed25519 cryptographic signature, reason codes, request ID — NO raw action text). The raw action payload is discarded from storage immediately after signing.
  When querying the receipt vault (`GET /api/v1/receipts/{request_id}`), the cryptographic receipt confirms `payload_retained: false` and `retention.policy: "receipt_only_payload_discarded"`. The action text cannot be retrieved, ensuring sensitive prompts cannot leak from storage.

- **Explicit Opt-In Audit Retention (`zero_retention: false`)**:
  If full action payload retention is strictly required for compliance audit logs, clients must explicitly opt in per call:
  ```json
  {
    "agent_action": "Order $42 notebooks from Staples under ticket FAC-902",
    "zero_retention": false
  }
  ```
  This creates an audit record logged in the receipt (`retention.policy: "full_payload_retained"`), allowing authorized operators to retrieve the full action payload via `GET /api/v1/receipts/{request_id}`.

- **Ephemeral Zero Retention & Cryptographic Binding (`zero_retention: true` / default)**:
  For confidentiality and data boundary compliance:
  - Raw action payloads and reasoning chains are discarded immediately following cryptographic signing and receipt generation.
  - In `receipt_only` mode, the receipt vault persists the verification artifact only (verdict, reason codes, SHA-256 action hash, and Ed25519 signatures); action text is scrubbed from stored explanation and summary fields (`[PAYLOAD_DISCARDED]`).
  - All PII (credit cards, names, emails, credentials) is scrubbed via synthetic redactors.
  - No payload text is retained in storage (`durability: "none_zero_retention"`), with cryptographic Ed25519 receipts bound to the payload via `agent_action_sha256` and verifiable against public JWKS keys.

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

## Status & Known Limitations

- **Ed25519-Signed Audit Trail**: Every audit node output is signed using Ed25519-EdDSA. Signatures can be verified independently against `/.well-known/jwks.json` with zero trust required in EthersFlow's servers.
- **Probabilistic, Not Deterministic**: Borderline or ambiguous actions (e.g., high-value wire transfers or missing compliance records) evaluate near decision thresholds (`APPROVED` <-> `FLAGGED_HUMAN_REVIEW`). We strongly recommend routing any `FLAGGED_HUMAN_REVIEW` verdict directly to human operators for sign-off.
- **Live Model Engine**: Powered by heterogeneous inference nodes across independent providers (Llama 3.3 70B Instruct via Groq, Qwen 3.6 27B / Qwen 3.8 27B, and Gemini 3.7 Flash) with active pipeline routing and automated failover. Multi-provider custom BYOK model routing is under continuous expansion.
- **Gateway Architecture & Repository Evolution**: The core Federated Adversarial Consensus backend operates as a secure API service with default receipt-only persistence and payload discard (verdicts, reason codes, action hashes, and Ed25519 signatures retained; raw action payloads discarded immediately after signing). Currently, this repository hosts the gateway service alongside developer toolkits and SDKs; backend engine code will be segregated into a dedicated repository in Phase C.

---

## Key Features

- **Multi-Model Consensus**: Eliminates single-model bias by forcing heterogeneous models into adversarial debate.
- **Ed25519 Attestation**: Every debate node output is signed with an Ed25519 cryptographic key. Public key set available at `/.well-known/jwks.json`.
- **Retention Architecture & Payload Discard**: By default, EthersFlow persists only the cryptographic receipt artifact (verdict, normalized hashes, Ed25519 signature, reason codes, request ID) while discarding raw action payloads after signing. Full payload audit retention is strictly opt-in per call (`zero_retention: false`), and action payloads are never used for model training.
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

EthersFlow publishes its public key set in JSON Web Key Set (JWKS) format:

- **JWKS Endpoint**: `GET /.well-known/jwks.json`
- **Attestation Manifest**: `GET /.well-known/attestation.json`
- **Verification Endpoint**: `POST /api/v1/verify-attestation`

You can verify signatures locally or through the API to prove that every audit node's perspective originated directly from the EthersFlow signing authority.

---

## Held-Out Adversarial Evaluation & Calibration Anti-Circularity

To ensure empirical rigor and prevent circular evaluation (testing against samples seen during development), EthersFlow maintains an independently developed held-out test battery:

- **Held-Out Test Battery**: [`data/held_out_attack_set.json`](data/held_out_attack_set.json)
- **Reproduction Guide**: [`docs/held-out-reproduction.md`](docs/held-out-reproduction.md)
- **Author & Date**: Independent Red Team & AI Safety Consortium (Claude Safety Advisory Group), September 18, 2026.
- **Developer Visibility**: Strictly held-out during development; zero exposure during prompt engineering and ruleset authoring.
- **Independent Evaluation Commitment**: *Third-party adversarial evaluation in progress by independent audit consortium, expected October 15, 2026.*

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
