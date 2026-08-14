# EthersFlow — Developer Toolkit & Trust Layer

> **Developer toolkit for EthersFlow — a multi-model trust layer that verifies AI outputs through adversarial consensus. MCP server, SDKs, and API docs.**

[![API Status](https://img.shields.io/badge/API-Live_r12__fac__unified__v1-brightgreen.svg)](https://www.ethersflow.com)
[![MCP Server](https://img.shields.io/badge/MCP_Server-npx_%40ethersflow%2Fmcp--server-blue.svg)](mcp-server/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Crypto: Ed25519](https://img.shields.io/badge/Attestation-Ed25519__EdDSA-purple.svg)](/.well-known/jwks.json)

---

## 🚀 Overview

**EthersFlow** is a zero-trust verification engine for autonomous AI agents. Before an agent executes side effects—such as wire transfers, API calls, medical orders, or code changes—EthersFlow forces independent LLMs (Claude, Gemini, Llama, Mistral) into **Federated Adversarial Debate**.

If an audit node uncovers hallucinations, unverified counterparties, or compliance risks, the proposed action is flagged or rejected with an **Ed25519 cryptographically signed attestation trail**.

```
                           ┌─────────────────────────────────────┐
                           │      Autonomous AI Agent            │
                           └──────────────────┬──────────────────┘
                                              │ Proposed Action
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        EthersFlow Verification Gateway                                │
│                                                                                        │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌────────────────────────────┐  │
│  │ Direct Pragmatist    │   │ Constructive Skeptic │   │ Lateral Synthesizer        │  │
│  │ (Claude / Llama)     │   │ (Gemini / Mistral)   │   │ (DeepSeek / Qwen)          │  │
│  └──────────┬───────────┘   └──────────┬───────────┘   └─────────────┬──────────────┘  │
│             └──────────────────────────┼─────────────────────────────┘                 │
│                                        │ Adversarial Cross-Examination                 │
│                                        ▼                                               │
│                         ┌─────────────────────────────┐                                │
│                         │ Federated Consensus Engine  │                                │
│                         └──────────────┬──────────────┘                                │
│                                        │ Ed25519 Signature                             │
└────────────────────────────────────────┼───────────────────────────────────────────────┘
                                         │ Signed Verdict
                                         ▼
                 ┌──────────────────────────────────────────────┐
                 │  APPROVED / FLAGGED / REJECTED Decision Gate │
                 └──────────────────────────────────────────────┘
```

---

## 📦 What's Included

This repository contains the official client surfaces and developer tools for the EthersFlow ecosystem:

| Surface | Path | Description |
|---|---|---|
| **MCP Server** | [`/mcp-server`](mcp-server/README.md) | `npx @ethersflow/mcp-server` for Claude Desktop, Cursor, and MCP clients |
| **Python Demo & Verifier** | [`efverify.py`](efverify.py) | Zero-dependency pure-Python client and Ed25519 signature validator |
| **Python SDK** | [`/sdk/python`](sdk/python) | Native Python package & LangChain tool wrapper |
| **TypeScript SDK** | [`/sdk/typescript`](sdk/typescript) | TypeScript SDK + Cloudflare Worker middleware helper |
| **Postman Collection** | [`/postman`](postman) | 11-request Postman collection + environment variables |

> *Note: The core Federated Adversarial Consensus engine runs on Cloud Run with Zero Data Retention (ZDR). This public repository hosts client-side tools, SDKs, and integration specs.*

---

## ⚡ 5-Minute Quickstart

### 1. Model Context Protocol (MCP) Server

Connect EthersFlow directly to **Claude Desktop** or **Cursor** in seconds:

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

Run the included reference verifier script:

```bash
python efverify.py demo
```

To verify a custom proposed action:
```bash
python efverify.py verify "Transfer 5000 USDC to wallet 0x9f for smart contract audit"
```

### 3. cURL API Call

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

## 📊 Status & Known Limitations

- **Ed25519-Signed Audit Trail** ✅: Every audit node output is signed using Ed25519-EdDSA. Signatures can be verified independently against `/.well-known/jwks.json` with zero trust required in EthersFlow's servers.
- **Probabilistic, Not Deterministic** ⚠️: Borderline or ambiguous actions (e.g., high-value wire transfers or missing compliance records) evaluate near decision thresholds (`APPROVED` ↔ `FLAGGED_HUMAN_REVIEW`). We strongly recommend routing any `FLAGGED_HUMAN_REVIEW` verdict directly to human operators for sign-off.
- **Live Model Engine**: Powered by live inference nodes (Llama 3.3 70B + Llama 3.1 8B via Groq) with active pipeline routing. Additional providers (Claude 3.5, GPT-4o, Gemini 1.5, DeepSeek R1, Qwen) are on the roadmap.
- **Proprietary Core Architecture**: This repository hosts public developer toolkits, SDKs, Postman collections, and MCP wrappers. The core Federated Adversarial Consensus backend operates as a secure, hosted API service on Cloud Run with Zero Data Retention (ZDR). No backend application code or server secrets exist in this repository.

---

## 🔑 Key Features

- **Multi-Model Consensus**: Eliminates single-model bias by forcing heterogeneous models into adversarial debate.
- **Ed25519 Attestation**: Every debate node output is signed with an Ed25519 cryptographic key. Public key set available at `/.well-known/jwks.json`.
- **Zero Data Retention (ZDR)**: Submitted action chains are processed purely in volatile RAM and never stored or used for model training.
- **OpenAI & Anthropic Drop-In Proxies**: Use `/v1/chat/completions` or `/v1/messages` as a drop-in replacement for existing agent pipelines.
- **Specialized Personas**:
  - `financial_compliance` (FINRA/SEC, wire limits, KYC, sanctions)
  - `clinical_safety` (ISMP high-alert meds, dosage bounds, FDA)
  - `cybersecurity_auditor` (NIST SP 800-53, privilege escalation, SOC 2)
  - `legal_citation` (FCPA, evidentiary privilege, contract breach)
  - `general_adversarial` (Cross-domain safety & logic verification)

---

## 🛠️ Framework Integrations

### LangChain (Python)

```python
from ethersflow.client import EthersFlowLangChainTool

verifier_tool = EthersFlowLangChainTool(api_key="ef_live_demo_key")

# Add to your LangChain agent tools
tools = [verifier_tool]
```

### Cloudflare Workers / Agents SDK (TypeScript)

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
      return new Response("Action blocked by EthersFlow Consensus Gate", { status: 403 });
    }

    // Proceed with execution
  }
};
```

---

## 🛡️ Security & Ed25519 Attestation

EthersFlow publishes its public key set in JSON Web Key Set (JWKS) format:

- **JWKS Endpoint**: `GET /.well-known/jwks.json`
- **Attestation Manifest**: `GET /.well-known/attestation.json`
- **Verification Endpoint**: `POST /api/v1/verify-attestation`

You can verify signatures locally or through the API to prove that every audit node's perspective originated directly from the EthersFlow signing authority.

---

## 📬 Postman Collection

Import [`postman/ethersflow.postman_collection.json`](postman/ethersflow.postman_collection.json) and [`postman/ethersflow.postman_environment.json`](postman/ethersflow.postman_environment.json) into Postman to test all 11 core endpoints instantly.

---

## 📄 License

Code & SDK wrappers licensed under [MIT License](LICENSE). Hosted EthersFlow API services subject to Terms of Service.
