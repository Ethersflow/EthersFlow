# EthersFlow MCP Server — Agent Installation Guide

EthersFlow is a trust gate for AI agents: before an agent executes a high-stakes
action (payments, deployments, data ops, communications), it runs multi-model
adversarial consensus over the proposed action and returns
APPROVED / FLAGGED_HUMAN_REVIEW / REJECTED with an Ed25519-signed audit trail.

## Requirements
- Node.js 18+ (for local/stdio installation)
- An EthersFlow API key — free during early access at https://www.ethersflow.com

## Option A — Local stdio server (recommended for Cline, Claude Desktop, Cursor)
Run:
    npx -y @ethersflow/mcp-server

Provide the API key via environment variables:
    ETHERSFLOW_TOKEN=<your API key>
    ETHERSFLOW_BASE_URL=https://www.ethersflow.com

Alternative: pass the key as a flag instead of an env var:
    npx @ethersflow/mcp-server --api-key=YOUR_API_KEY

## Option B — Remote gateway (no local install)
Point your MCP client at:
    https://www.ethersflow.com/api/mcp
Authentication header:
    Authorization: Bearer <your API key>

## Client configuration example
{
  "mcpServers": {
    "ethersflow": {
      "command": "npx",
      "args": ["-y", "@ethersflow/mcp-server"],
      "env": {
        "ETHERSFLOW_TOKEN": "YOUR_API_KEY",
        "ETHERSFLOW_BASE_URL": "https://www.ethersflow.com"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}

## Verify the installation
1. Call tools/list — you should see exactly one tool: verify_agent_action
2. Call verify_agent_action with a small sample action (e.g. a test payment of
   $0.00 or a read-only operation) — expect a verdict object containing a
   decision (APPROVED / FLAGGED_HUMAN_REVIEW / REJECTED) and a signature field.

## Troubleshooting
- 401 INVALID_API_KEY: the token is missing, malformed, or not a real key.
  Keys are issued at https://www.ethersflow.com (format: ef_live_...).
- ETHERSFLOW_BASE_URL must be exactly https://www.ethersflow.com (no trailing slash).
- If tools/list fails, confirm Node.js >= 18 is installed: node --version
