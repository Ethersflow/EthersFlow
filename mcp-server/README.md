# @ethersflow/mcp-server

> Model Context Protocol (MCP) server for **EthersFlow** — the multi-model trust layer that verifies AI outputs and agent action directives through adversarial consensus before execution.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Ethersflow%2FEthersFlow-blue.svg)](https://github.com/Ethersflow/EthersFlow)
[![npm version](https://img.shields.io/npm/v/@ethersflow/mcp-server.svg)](https://www.npmjs.com/package/@ethersflow/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Quick Start

### Option A: Via NPX (Public Registry)
```bash
npx @ethersflow/mcp-server --api-key="$ETHERSFLOW_API_KEY"
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
