# @ethersflow/mcp-server

> Model Context Protocol (MCP) server for **EthersFlow** — the multi-model trust layer that verifies AI outputs and agent action directives through adversarial consensus before execution.

[![npm version](https://img.shields.io/npm/v/@ethersflow/mcp-server.svg)](https://www.npmjs.com/package/@ethersflow/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Quick Start

You can run `@ethersflow/mcp-server` instantly without local installation using `npx`:

```bash
npx @ethersflow/mcp-server
```

---

## ⚙️ Configuration Guides

### 1. Claude Desktop Setup

Add EthersFlow to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

---

## 2. Cursor IDE Integration

In Cursor Settings → **MCP Servers** → **Add New MCP Server**:

- **Name**: `ethersflow`
- **Type**: `command`
- **Command**: `npx -y @ethersflow/mcp-server`
- **Environment Variables**:
  - `ETHERSFLOW_TOKEN`: `ef_live_demo_key`
  - `ETHERSFLOW_BASE_URL`: `https://ethersflow-225907257236.us-east1.run.app`

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
