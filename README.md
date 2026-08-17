# EthersFlow — Developer Toolkit & Trust Layer

Developer toolkit for EthersFlow — a multi-model trust layer that verifies AI outputs through adversarial consensus. MCP server, SDKs, and API docs.

[![API Status](https://img.shields.io/badge/API-Live_r13-brightgreen.svg)](https://www.ethersflow.com)
[![MCP Server](https://img.shields.io/badge/MCP_Server-GitHub%20Direct-blue.svg)](mcp-server/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Crypto: Ed25519](https://img.shields.io/badge/Attestation-Ed25519__EdDSA-purple.svg)](/.well-known/jwks.json)

---

## Overview

EthersFlow is a zero-trust verification engine for autonomous AI agents. Before an agent executes side effects—such as wire transfers, API calls, medical orders, or code changes—EthersFlow evaluates the proposed action using a federated, adversarial cross-examination of heterogeneous models and emits a cryptographically signed attestation trail.

If an audit node uncovers hallucinations, unverified counterparties, or compliance risks, the proposed action is flagged or rejected with an Ed25519 cryptographically signed attestation trail.

```
                        Autonomous AI Agent
                                 |
                                 v
                    +------------------------------+
                    | EthersFlow Verification Gate |
                    +------------------------------+
                                 |
        +------------------------+------------------------+
        |                        |                        |
+------------------+   +----------------------+   +---------------------+
| Direct Pragmatist|   | Constructive Skeptic |   | Lateral Synthesizer |
|  (Claude / Llama)|   |  (Gemini / Mistral)  |   |  (DeepSeek / Qwen)  |
+------------------+   +----------------------+   +---------------------+
         \                     |                      /
          \                    |                     /
           \                   |                    /
            +-----------------------------------------+
            |        Federated Consensus Engine       |
            +-----------------------------------------+
                                 |
                                 v
                    APPROVED   /   FLAGGED   /   REJECTED
```

---

## What's Included

This repository contains the official client surfaces and developer tools for the EthersFlow ecosystem:

| Surface | Path | Description |
|---|---|---|
| MCP Server | [`/mcp-server`](mcp-server/README.md) | npx @ethersflow/mcp-server for Claude Desktop, Cursor, and MCP clients |
| Python Demo & Verifier | [`efverify.py`](efverify.py) | Zero-dependency pure-Python client and Ed25519 signature validator |
| Python SDK | [`/sdk/python`](sdk/python) | Native Python package & LangChain tool wrapper |
| TypeScript SDK | [`/sdk/typescript`](sdk/typescript) | TypeScript SDK + Cloudflare Worker middleware helper |
| Postman Collection | [`/postman`](postman) | 11-request Postman collection + environment variables |

Note: The core Federated Adversarial Consensus engine runs on Cloud Run with Zero Data Retention (ZDR). This public repository hosts client-side tools, SDKs, and integration specs.

---

## Published Packages

The public npm packages are now live and installable:

- ✅ [`@ethersflow/mcp-server@0.1.0`](https://www.npmjs.com/package/@ethersflow/mcp-server)
- ✅ [`@ethersflow/sdk@0.1.0`](https://www.npmjs.com/package/@ethersflow/sdk)

Both packages were smoke-tested from clean temp projects with `npm view`, `npm install`, and import/runtime checks.

---

## 5-Minute Quickstart

### 1. Model Context Protocol (MCP) Server

Use the published package for the fastest install path:

```bash
npx -y @ethersflow/mcp-server --api-key="$ETHERSFLOW_API_KEY"
```

If you want a local source checkout instead:

```bash
git clone https://github.com/Ethersflow/EthersFlow.git
cd EthersFlow/mcp-server
npm install
npm start
```

The published MCP package exposes a single tool: `verify_agent_action`.

### 2. TypeScript SDK

```bash
npm install @ethersflow/sdk
```

```typescript
import { EthersFlow } from '@ethersflow/sdk';

const client = new EthersFlow(process.env.ETHERSFLOW_API_KEY);

const result = await client.verifyAgentAction(
  "Transfer 5000 USDC to wallet 0x9f for smart-contract audit",
  {
    reasoning_chain: "Vendor request via email notification",
    persona_preset: "financial_compliance",
    agent_count: 3,
  }
);

console.log(result.status, result.consensus_score, result.verdict_summary);
```

### 3. Python (Zero-Dependency Demo)

Run the included reference verifier script:

```bash
python efverify.py demo
```

To verify a custom proposed action:

```bash
python efverify.py verify "Transfer 5000 USDC to wallet 0x9f for smart contract audit"
```

### 4. cURL API Call

```bash
curl -X POST "https://ethersflow-225907257236.us-east1.run.app/api/v1/verify" \
  -H "Authorization: Bearer ef_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_action": "Transfer 5000 USDC to wallet 0x9f for smart contract audit",
    "persona_preset": "financial_compliance",
    "agent_count": 3
  }'
```

---

## Status & Known Limitations

- Ed25519-Signed Audit Trail: Every audit node output is signed using Ed25519-EdDSA. Signatures can be verified independently against `/.well-known/jwks.json` with zero trust required.
- Probabilistic, Not Deterministic: Borderline or ambiguous actions (e.g., high-value wire transfers or missing compliance records) evaluate near decision thresholds (APPROVED ↔ FLAGGED).
- Live Model Engine: Powered by live inference nodes (Llama 3.3 70B + Llama 3.1 8B via Groq) with active pipeline routing.

---

## Key Features

- Multi-Model Consensus: Eliminates single-model bias by forcing heterogeneous models into adversarial debate.
- Ed25519 Attestation: Every debate node output is signed with an Ed25519 cryptographic key. Public key set available at `/.well-known/jwks.json`.
- Zero Data Retention (ZDR): Submitted action chains are processed purely in volatile RAM and never stored or used for model training.

---

## Framework Integrations

### LangChain (Python)

```python
import os
from ethersflow.client import EthersFlowLangChainTool

verifier_tool = EthersFlowLangChainTool(api_key=os.environ["ETHERSFLOW_API_KEY"])

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

## Security & Ed25519 Attestation

EthersFlow publishes its public key set in JSON Web Key Set (JWKS) format:

- JWKS Endpoint: `GET /.well-known/jwks.json`
- Attestation Manifest: `GET /.well-known/attestation.json`
- Verification Endpoint: `POST /api/v1/verify-attestation`

You can verify signatures locally or through the API to prove that every audit node's perspective originated directly from the EthersFlow signing authority.

---

## Postman Collection

Import `postman/ethersflow.postman_collection.json` and `postman/ethersflow.postman_environment.json`.

---

## Testing Guide

### 1. Package Installation Verification

```bash
npm view @ethersflow/mcp-server version
npm view @ethersflow/sdk version

mkdir -p /tmp/ethersflow-smoke && cd /tmp/ethersflow-smoke
npm init -y
npm install @ethersflow/mcp-server @ethersflow/sdk
```

### 2. MCP Server Tool Exposure

This verifies that the published MCP package starts correctly and advertises `verify_agent_action` over stdio:

```bash
node --input-type=module <<'EOF'
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@ethersflow/mcp-server'],
});

const client = new Client({ name: 'smoke-test', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);
const result = await client.listTools();
console.log(result.tools.map((tool) => tool.name));
await client.close();
EOF
```

Expected output includes:

```text
[ 'verify_agent_action' ]
```

### 3. TypeScript SDK Runtime + Types

```bash
npm install @ethersflow/sdk
```

```typescript
import EthersFlow, {
  cloudflareVerifyGate,
  type VerificationResult,
  type VerifyActionOptions,
} from '@ethersflow/sdk';

const client = new EthersFlow(process.env.ETHERSFLOW_API_KEY);

const opts: VerifyActionOptions = {
  reasoning_chain: 'Routine procurement request',
  persona_preset: 'financial_compliance',
  agent_count: 3,
  grounding_enabled: true,
};

const result: VerificationResult = await client.verifyAgentAction(
  '$50 office supplies (micro-expense)',
  opts
);

const allowed = await cloudflareVerifyGate(
  '$50 office supplies (micro-expense)',
  'Routine procurement request',
  process.env.ETHERSFLOW_API_KEY
);

console.log(result.status, allowed);
```

Behavior validated from the published package:

- `new EthersFlow(apiKey, baseUrl?)` instantiates cleanly
- `verifyAgentAction()` POSTs to `/api/v1/verify`
- `cloudflareVerifyGate()` returns `Boolean(res.verified)` on success
- non-2xx responses throw `EthersFlow verify request failed: <status> <body>`
- the published `.d.ts` types compile in a standalone TypeScript smoke test

### 4. Live API / Consensus / Attestation Checks

Use the developer portal to create an `ef_live_...` key, then run:

```bash
export ETHERSFLOW_API_KEY="ef_live_your_key_here"
export ETHERSFLOW_BASE_URL="https://ethersflow-225907257236.us-east1.run.app"
```

```bash
curl -sS "$ETHERSFLOW_BASE_URL/api/health"
curl -sS "$ETHERSFLOW_BASE_URL/.well-known/jwks.json"
curl -sS "$ETHERSFLOW_BASE_URL/.well-known/attestation.json"
```

Consensus probes:

```bash
curl -X POST "$ETHERSFLOW_BASE_URL/api/v1/verify" \
  -H "Authorization: Bearer ef_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_action": "$50 office supplies (micro-expense)",
    "reasoning_chain": "Standard office procurement",
    "persona_preset": "financial_compliance",
    "agent_count": 3,
    "zero_retention": true
  }'
```

```bash
curl -X POST "$ETHERSFLOW_BASE_URL/api/v1/verify" \
  -H "Authorization: Bearer ef_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_action": "Transfer 5000 USDC to wallet 0x9f for a smart-contract audit",
    "reasoning_chain": "Unverified third-party audit agreement",
    "persona_preset": "financial_compliance",
    "agent_count": 3,
    "zero_retention": true
  }'
```

Ed25519 verification flow:

1. Fetch `/.well-known/jwks.json`
2. Submit a node payload from `adversarial_debate[]` to `POST /api/v1/verify-attestation`
3. Expect `verified: true` when the signature matches the published JWKS

Zero Data Retention checklist:

- set `zero_retention: true` in verification payloads
- use the developer portal/API key vault for scoped production keys
- confirm returned payloads do not require prompt persistence for follow-up use

### 5. Developer Portal Workflow

The developer portal at `https://ethersflow.com/#developers` is the canonical onboarding path:

1. Open **Developers Hub**
2. Review the **SDKs & Quickstarts** section for npm, Python, and REST examples
3. Open the B2B/API portal and create a live `ef_live_...` key
4. Copy the key into `ETHERSFLOW_API_KEY` (or `ETHERSFLOW_TOKEN`)
5. Test via cURL, the TypeScript SDK, or `npx -y @ethersflow/mcp-server`
6. For IDE integration, add the MCP config to Claude Desktop, Cursor, or another MCP-capable client

### 6. Troubleshooting

- **`npm view` or `npm install` fails**: confirm you are using the public npm registry and Node 18+
- **MCP client cannot see tools**: verify the command is `npx -y @ethersflow/mcp-server`
- **401/403 from `/api/v1/verify`**: confirm your live API key is present and unrevoked
- **DNS / connectivity issues**: verify your environment can resolve `ethersflow-225907257236.us-east1.run.app`
- **Cloudflare Worker errors**: `cloudflareVerifyGate()` rethrows upstream API failures; wrap it in `try/catch`

---

## License

Code & SDK wrappers licensed under [MIT License](LICENSE). Hosted EthersFlow API services subject to Terms of Service.
