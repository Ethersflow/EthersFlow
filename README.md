# EthersFlow — Developer Toolkit & Trust Layer

Developer toolkit for EthersFlow — a multi-model trust layer that verifies AI outputs through adversarial consensus. MCP server, SDKs, and API docs.

[![API Status](https://img.shields.io/badge/API-0.2.0-brightgreen.svg)](https://www.ethersflow.com)
[![MCP Server](https://img.shields.io/badge/MCP_Server-GitHub%20Direct-blue.svg)](mcp-server/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Crypto: Ed25519](https://img.shields.io/badge/Attestation-Ed25519__EdDSA-purple.svg)](/.well-known/jwks.json)

---

## Overview

EthersFlow verifies what an AI agent is about to do — before it does it — using multiple independent models and a cryptographically signed audit trail.

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

## What's Included

This repository contains the official client surfaces and developer tools for the EthersFlow ecosystem:

| Surface | Path | Description |
|---|---|---|
| MCP Server | [`/mcp-server`](mcp-server/README.md) | Model Context Protocol server for Claude Desktop, Cursor, and MCP clients |
| Python Demo & Verifier | [`efverify.py`](efverify.py) | Zero-dependency pure-Python client and Ed25519 signature validator |
| Python SDK | [`/sdk/python`](sdk/python) | Native Python package & LangChain tool wrapper |
| TypeScript SDK | [`/sdk/typescript`](sdk/typescript) | TypeScript SDK + Cloudflare Worker middleware helper |
| Postman Collection | [`/postman`](postman) | 11-request Postman collection + environment variables |

*Note: The core Federated Adversarial Consensus engine runs on Cloud Run with Zero Data Retention (ZDR). This public repository hosts client-side tools, SDKs, and integration specs.*

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
Connect your MCP client directly to EthersFlow's production endpoint:
- **Endpoint**: `https://www.ethersflow.com/api/mcp`
- **Headers**: `Authorization: Bearer YOUR_API_KEY`

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
- **Proprietary Core Architecture**: This repository hosts public developer toolkits, SDKs, Postman collections, and MCP wrappers. The core Federated Adversarial Consensus backend operates as a secure, hosted API service on Cloud Run with Zero Data Retention (ZDR). No backend application code or server secrets exist in this repository.

---

## Key Features

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

## Postman Collection

Import [`postman/ethersflow.postman_collection.json`](postman/ethersflow.postman_collection.json) and [`postman/ethersflow.postman_environment.json`](postman/ethersflow.postman_environment.json) into Postman to test all 11 core endpoints instantly.

---

## License

Code & SDK wrappers licensed under [MIT License](LICENSE). Hosted EthersFlow API services subject to Terms of Service.
