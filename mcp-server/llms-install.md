# EthersFlow MCP Server — Agent Installation Guide

EthersFlow is a trust gate for AI agents: before an agent executes a high-stakes
action (payments, deployments, data ops, communications), it runs multi-model
adversarial consensus over the proposed action and returns
APPROVED / FLAGGED_HUMAN_REVIEW / REJECTED with an Ed25519-signed audit trail.

## Requirements
- Node.js 18+ (for local/stdio installation)
- No sign-up required for trial mode (`--demo` auto-provisions an ephemeral 24h `ef_sandbox_...` key), or mint a key at https://www.ethersflow.com/api-keys.html

## Option A — Instant zero-signup demo (stdio)
Run:
    npx -y @ethersflow/mcp-server@^0.4.0 --demo

## Option B — Local stdio server with explicit API key (Cline, Claude Desktop, Cursor)
Get a free sandbox (`ef_sandbox_...`) or live account key (`ef_live_...`) at:
    https://www.ethersflow.com/api-keys.html

Provide the API key via environment variables:
    ETHERSFLOW_TOKEN=<key from https://www.ethersflow.com/api-keys.html>
    ETHERSFLOW_BASE_URL=https://www.ethersflow.com

Alternative: pass the key as a flag instead of an env var:
    npx -y @ethersflow/mcp-server@^0.4.0 --api-key=get_key_at_ethersflow.com/api-keys.html

## Option C — Remote gateway (no local install)
Point your MCP client at:
    https://www.ethersflow.com/api/mcp
Authentication header:
    Authorization: Bearer <key from https://www.ethersflow.com/api-keys.html>

## Client configuration example
{
  "mcpServers": {
    "ethersflow": {
      "command": "npx",
      "args": ["-y", "@ethersflow/mcp-server@^0.4.0"],
      "env": {
        "ETHERSFLOW_TOKEN": "get_key_at_ethersflow.com/api-keys.html",
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
- 401 INVALID_API_KEY: the token is missing, malformed, or expired.
  Mint a fresh key anytime at https://www.ethersflow.com/api-keys.html (ef_sandbox_... or ef_live_...) or test immediately with --demo.
- ETHERSFLOW_BASE_URL must be exactly https://www.ethersflow.com (no trailing slash).
- If tools/list fails, confirm Node.js >= 18 is installed: node --version
