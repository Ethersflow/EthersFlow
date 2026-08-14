# EthersFlow — The Layer of Trust for Critical Decisions

> **Developer toolkit for EthersFlow — a multi-model adversarial consensus trust layer that verifies AI outputs and agent decisions before execution. Includes MCP server, SDKs, and API reference.**

[![API Status](https://img.shields.io/badge/API-Live-brightgreen.svg)](https://www.ethersflow.com)
[![MCP Server](https://img.shields.io/badge/MCP_Server-npx_%40ethersflow%2Fmcp--server-blue.svg)](mcp-server/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Crypto: Ed25519](https://img.shields.io/badge/Attestation-Ed25519__EdDSA-purple.svg)](/.well-known/jwks.json)

---

##  Overview

**EthersFlow** is a zero-trust verification engine for autonomous AI agents. Before an agent executes high-stakes actions—wire transfers, API calls, medical orders, code deployments, or claims approvals—EthersFlow routes the decision through a federated consensus of independent LLMs running adversarial debate.

If an audit node detects unverified counterparties, compliance risks, or logical inconsistencies, the action is **FLAGGED** (requiring manual operator sign-off) or **REJECTED**. All verdicts are signed with Ed25519 cryptographic attestations.

### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│    Autonomous AI Agent                                                   │
│  (LangChain, CrewAI, or Custom)                                          │
└─────────────────────────────────────┬─────────────────────────────────  ─┘
                                      │ Proposed Action
                                      ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│           EthersFlow Verification Gateway                                                     │
│                                                                                               │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐  ┌──────────────┐         │
│  │ Llama 3.3 70B                    │  │ Llama 3.1 8B             │  │  (Custom)    │         │
│  │ (Pragmatist)                     │  │ (Skeptic)                │  │ (Synthesizer)│         │
│  └──────────────┬─────────────     ─┘  └──────────────┬───────────┘  └───────────┬──┘         │
│                 └─────────────────────────────────────┬──────────────────────────┘            │
│                                                       │ Adversarial Cross-Examination         │
│                                                       ▼                                       │
│                  ┌─────────────────────────────────────────────┐                              │
│                  │ Federated Consensus                         │
│                  │ + Ed25519 Signature                         │
│                  └──────────────────────────┬──────────────────┘                             │
└─────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                              │
                                              ▼
                           ┌──────────────────────────────────────────────┐
                           │  Decision Gate                               │
                           │  APPROVED / FLAGGED /                        │
                           │  REJECTED                                    │
                           └──────────────────────────────────────────────┘
```

---

##  5-Minute Quickstart

### 1. MCP Server (Claude Desktop / Cursor)

```bash
npx @ethersflow/mcp-server
```

Add to `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "ethersflow": {
      "command": "npx",
      "args": ["-y", "@ethersflow/mcp-server"],
      "env": {
        "ETHERSFLOW_TOKEN": "ef_live_demo_key",
        "ETHERSFLOW_BASE_URL": "https://ethersflow-225907257236.us-east1.run.app"
      }
    }
  }
}
```

### 2. Python (Zero-Dependency Demo)

```bash
python efverify.py demo
```

Verify a custom action:

```bash
python efverify.py verify "Transfer 5000 USDC to wallet 0x9f for smart contract audit"
```

### 3. cURL (Health Check)

```bash
curl https://ethersflow-225907257236.us-east1.run.app/api/health
```

### 4. cURL (Verify Action)

```bash
curl -X POST "https://ethersflow-225907257236.us-east1.run.app/api/v1/verify" \
  -H "Authorization: Bearer ef_live_demo_key" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_action": "Transfer 5000 USDC to wallet 0x9f for smart contract audit",
    "persona_preset": "financial_compliance",
    "agent_count": 3
  }'
```

---

##  What's Included

This repository contains **client-side developer tools only**. The core Federated Adversarial Consensus engine runs on Cloud Run with Zero Data Retention (ZDR).

| Surface | Path | Description |
|---|---|---|
| **MCP Server** | [`/mcp-server`](mcp-server/README.md) | `npx @ethersflow/mcp-server` for Claude Desktop, Cursor, and any MCP client |
| **Python Demo & Verifier** | [`efverify.py`](efverify.py) | Zero-dependency pure-Python client and Ed25519 signature verifier |
| **Python SDK** | [`/sdk/python`](sdk/python) | Native Python package with LangChain tool wrapper |
| **TypeScript SDK** | [`/sdk/typescript`](sdk/typescript) | TypeScript SDK + Cloudflare Worker middleware helper |
| **Postman Collection** | [`/postman`](postman) | Pre-configured API requests + environment |
| **OpenAPI Spec** | [`/public/openapi.json`](public/openapi.json) | Full REST API documentation |
| **MCP Manifest** | [`/public/mcp_manifest.json`](public/mcp_manifest.json) | MCP server configuration |

---

##  API Reference

### Real Endpoints (Live API Only)

| Method | Path | Description |
|---|---|---|
| **GET** | `/api/health` | Health check + version info |
| **GET** | `/api/version` | API version |
| **POST** | `/api/v1/verify` | Verify agent action (core endpoint) |
| **POST** | `/api/mcp` | MCP JSON-RPC 2.0 server |
| **POST** | `/v1/chat/completions` | OpenAI-compatible chat completion proxy |
| **GET** | `/.well-known/jwks.json` | JWKS public key set for attestation verification |
| **GET** | `/.well-known/attestation.json` | Attestation manifest |
| **POST** | `/api/v1/verify-attestation` | Verify Ed25519 node signatures |

### Base URL

**Live API:** `https://ethersflow-225907257236.us-east1.run.app`

**Demo Token:** `ef_live_demo_key`

### Verify Agent Action Payload

```json
{
  "agent_action": "string (required)",
  "reasoning_chain": "string (optional)",
  "agent_count": "integer, 2-7 (default: 3)",
  "persona_preset": "clinical_safety | financial_compliance | legal_citation | cybersecurity_auditor | general_adversarial (default: general_adversarial)"
}
```

### Response

```json
{
  "status": "APPROVED | FLAGGED_HUMAN_REVIEW | REJECTED",
  "verified": true,
  "consensus_score": 94.5,
  "risk_index": 5.5,
  "verdict_summary": "...",
  "adversarial_debate": [
    {
      "role": "string",
      "perspective": "string",
      "node_status": "string",
      "attestation_status": "VERIFIED_ED25519_SIG"
    }
  ],
  "latency_ms": 1250,
  "timestamp": "2026-08-13T21:19:40Z"
}
```

---

##  Framework Integrations

### LangChain (Python)

```python
from ethersflow.client import EthersFlowLangChainTool

verifier_tool = EthersFlowLangChainTool(api_key="ef_live_demo_key")
tools = [verifier_tool]
```

### Cloudflare Workers (TypeScript)

```typescript
import { cloudflareVerifyGate } from '@ethersflow/sdk';

export default {
  async fetch(request, env) {
    const isSafe = await cloudflareVerifyGate(
      "Transfer 5000 USDC to wallet 0x9f",
      "Vendor audit payment",
      env.ETHERSFLOW_API_KEY
    );

    if (!isSafe) {
      return new Response("Action blocked", { status: 403 });
    }
    // Proceed...
  }
};
```

---

##  Status & Known Limitations

- **Ed25519-Signed Audit Trail** ✅: Every audit node output is cryptographically signed with Ed25519-EdDSA. Verify independently against `/.well-known/jwks.json`.

- **Probabilistic, Not Deterministic** ⚠️: Borderline or ambiguous actions (e.g., high-value wire transfers, missing compliance records) may evaluate near decision thresholds. Edge cases require manual review.

- **FLAGGED_HUMAN_REVIEW is a Hard Gate** 🚨: Actions marked `FLAGGED_HUMAN_REVIEW` must route to a human operator for sign-off before execution. This is not a soft warning.

- **Live Consensus Models**: Powered by **Llama 3.3 70B** and **Llama 3.1 8B** via Groq. Additional models (GPT-4o, Claude 3.5, Gemini, DeepSeek, Qwen) are on the roadmap but not live today.

- **Beta API**: This is a production-grade service, but API contracts and response schemas may evolve. Pin your SDK/client version in production.

- **Zero Data Retention (ZDR)**: Submitted actions and prompts are processed in volatile memory only. Never stored, logged to disk, or used for model training.

---

##  Key Features

- **Multi-Model Consensus**: Forces heterogeneous LLMs into structured adversarial debate to eliminate single-model blind spots.
- **Ed25519 Attestation**: Every node perspective is cryptographically signed. Verify signatures locally with no trust required.
- **Zero Data Retention**: Submitted decisions are processed in RAM only—never persisted or fine-tuned on.
- **OpenAI & Anthropic Drop-In Proxies**: Use `/v1/chat/completions` as a drop-in replacement for existing agent pipelines.
- **Specialized Personas**:
  - `financial_compliance` — FINRA/SEC wire limits, KYC, sanctions, AML
  - `clinical_safety` — ISMP high-alert meds, dosage bounds, FDA regulations
  - `cybersecurity_auditor` — NIST SP 800-53, privilege escalation, SOC 2 controls
  - `legal_citation` — FCPA, contract law, evidentiary privilege, regulatory compliance
  - `general_adversarial` — Cross-domain safety, logic verification, hallucination detection

---

##  Security & Ed25519 Attestation

EthersFlow publishes its public key set in JWKS format:

- **JWKS Endpoint**: `GET /.well-known/jwks.json`
- **Attestation Manifest**: `GET /.well-known/attestation.json`
- **Verification Endpoint**: `POST /api/v1/verify-attestation`

You can verify signatures locally or through the API to cryptographically prove that every audit node's perspective originated directly from the EthersFlow signing authority.

---

##  Postman Collection

1. Import [`postman/ethersflow.postman_collection.json`](postman/ethersflow.postman_collection.json)
2. Import [`postman/ethersflow.postman_environment.json`](postman/ethersflow.postman_environment.json)
3. Default environment is pre-configured with the live API and demo token

---

##  License

Code & SDK wrappers licensed under [MIT License](LICENSE).

Hosted EthersFlow API services subject to Terms of Service at https://www.ethersflow.com

---

##  Learn More

**Website**: https://www.ethersflow.com  
**npm Package**: `@ethersflow/mcp-server`  
**Live API**: https://ethersflow-225907257236.us-east1.run.app  
**Demo Token**: `ef_live_demo_key`
