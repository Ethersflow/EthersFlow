# @ethersflow/mcp-server

> Model Context Protocol (MCP) server for **EthersFlow** — the multi-model trust layer that verifies AI outputs and agent action directives through adversarial consensus before execution.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Ethersflow%2FEthersFlow-blue.svg)](https://github.com/Ethersflow/EthersFlow)
[![npm version](https://img.shields.io/npm/v/@ethersflow/mcp-server.svg)](https://www.npmjs.com/package/@ethersflow/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Quick Start

### Option A: Via NPX (Public Registry)
```bash
npx -y @ethersflow/mcp-server --api-key="$ETHERSFLOW_API_KEY"
```

### Option B: Direct From GitHub (Zero npm publication dependency / Cold-start)
```bash
git clone https://github.com/Ethersflow/EthersFlow.git
cd EthersFlow/mcp-server
npm install
npm start
```

### Option C: Remote HTTP / SSE Gateway (Zero Local Node / NPX Dependencies)
Connect your MCP client directly to EthersFlow's production endpoint:
- **Endpoint**: `https://ethersflow-225907257236.us-east1.run.app/api/mcp`
- **Headers**: `Authorization: Bearer ef_live_demo_key`

---

## ⚙️ Configuration Guides

### 1. Claude Desktop Setup

Add EthersFlow to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Stdio Mode (via npx / local):
```json
{
  "mcpServers": {
    "ethersflow": {
      "command": "npx",
      "args": ["-y", "@ethersflow/mcp-server"],
      "env": {
        "ETHERSFLOW_TOKEN": "YOUR_ETHERSFLOW_API_KEY",
        "ETHERSFLOW_BASE_URL": "https://ethersflow-225907257236.us-east1.run.app"
      }
    }
  }
}
```

#### Local Clone Fallback (if running from repo source):
```json
{
  "mcpServers": {
    "ethersflow": {
      "command": "node",
      "args": ["/path/to/EthersFlow/mcp-server/index.js"],
      "env": {
        "ETHERSFLOW_TOKEN": "YOUR_ETHERSFLOW_API_KEY",
        "ETHERSFLOW_BASE_URL": "https://ethersflow-225907257236.us-east1.run.app"
      }
    }
  }
}
```

---

## 2. Cursor IDE Integration

In Cursor Settings → **MCP Servers** → **Add New MCP Server**:

- **Name**: `ethersflow`
- **Type**: `command`
- **Command**: `npx -y @ethersflow/mcp-server` (or `node /path/to/EthersFlow/mcp-server/index.js`)
- **Environment Variables**:
  - `ETHERSFLOW_TOKEN`: `YOUR_ETHERSFLOW_API_KEY`
  - `ETHERSFLOW_BASE_URL`: `https://ethersflow-225907257236.us-east1.run.app`

---

## 🧪 Testing Guide

### Installation Verification

```bash
npm view @ethersflow/mcp-server version
npm install @ethersflow/mcp-server
```

### Tool Exposure Smoke Test

Use the official MCP SDK client to verify that the published package advertises `verify_agent_action` over stdio:

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

Expected output:

```text
[ 'verify_agent_action' ]
```

### Live API Connectivity

Create a live key from `https://ethersflow.com/#developers`, then launch the MCP server with:

```bash
ETHERSFLOW_API_KEY="ef_live_your_key" \
ETHERSFLOW_BASE_URL="https://ethersflow-225907257236.us-east1.run.app" \
npx -y @ethersflow/mcp-server
```

Any MCP client that can call `tools/list` and `tools/call` can now invoke `verify_agent_action`.

### Generic MCP Client Example

If you are not using Claude Desktop or Cursor, configure your MCP client to run:

- command: `npx`
- args: `["-y", "@ethersflow/mcp-server"]`
- env:
  - `ETHERSFLOW_API_KEY=ef_live_your_key`
  - `ETHERSFLOW_BASE_URL=https://ethersflow-225907257236.us-east1.run.app`

---

## 🚀 Maintainer Guide: Publishing to npm

To publish this package to npm under `@ethersflow/mcp-server`:

```bash
# 1. Navigate to mcp-server package directory
cd mcp-server

# 2. Authenticate with your npm account / organization
npm login

# 3. Publish public scoped package
npm publish --access public
```

---
## 🛠️ Tool Definition: `verify_agent_action`

The server exposes a single typed tool:

```typescript
verify_agent_action({
  agent_action: string;          // Required: Proposed action directive
  reasoning_chain?: string;      // Optional: Reasoning or background context
  agent_count?: number;          // Optional: Number of audit nodes (2 to 7, default 3)
  persona_preset?: string;       // Optional: "financial_compliance" | "clinical_safety" | "legal_citation" | "cybersecurity_auditor" | "general_adversarial"
})
```

### Example Input
```json
{
  "agent_action": "Transfer 5000 USDC to wallet 0x9f for smart-contract audit",
  "reasoning_chain": "Vendor request via email notification",
  "persona_preset": "financial_compliance"
}
```

### Example Response
```json
{
  "status": "FLAGGED_HUMAN_REVIEW",
  "verified": false,
  "consensus_score": 72.5,
  "risk_index": 42.0,
  "verdict_summary": "FLAGGED FOR HUMAN REVIEW: Audit node analysis identified unverified risk factors or compliance concerns (1/3 flagged caution). Manual operator sign-off required prior to execution.",
  "adversarial_debate": [
    {
      "role": "Direct Pragmatist",
      "perspective": "FLAGGED: Unverified wallet recipient 0x9f requires manual KYC validation.",
      "node_status": "FLAGGED_HUMAN_REVIEW",
      "attestation_status": "VERIFIED_ED25519_SIG"
    }
  ]
}
```

---

## 🔒 Zero Data Retention Guarantee

EthersFlow operates on a strict **Zero-Data-Retention (ZDR)** policy. Submitted prompts and action chains are processed strictly in volatile memory and never stored, logged to disk, or used for model training.

For full API reference and Ed25519 attestation details, visit [EthersFlow Documentation](https://www.ethersflow.com).

---

## Troubleshooting

- **Tool not visible in client**: ensure the client is running `npx -y @ethersflow/mcp-server`
- **401/403 API responses**: confirm `ETHERSFLOW_API_KEY` or `ETHERSFLOW_TOKEN` is set to an active `ef_live_...` key
- **DNS/connectivity errors**: verify your environment can resolve `ethersflow-225907257236.us-east1.run.app`
- **Claude Desktop/Cursor config issues**: fully restart the client after editing MCP settings
