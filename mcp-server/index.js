#!/usr/bin/env node
/**
 * @ethersflow/mcp-server — Executable Model Context Protocol (MCP) Server
 * Exposes `verify_agent_action` tool for Claude Desktop, Cursor, and any MCP client.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Parse CLI args (e.g. --api-key=xyz, --base-url=http://..., or --demo)
const args = process.argv.slice(2);
let cliApiKey = "";
let cliBaseUrl = "";
let demoMode = false;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--demo") demoMode = true;
  else if (arg.startsWith("--api-key=")) cliApiKey = arg.split("=")[1];
  else if (arg === "--api-key" && args[i + 1]) cliApiKey = args[++i];
  else if (arg.startsWith("--token=")) cliApiKey = arg.split("=")[1];
  else if (arg === "--token" && args[i + 1]) cliApiKey = args[++i];
  else if (arg.startsWith("--base-url=")) cliBaseUrl = arg.split("=")[1];
  else if (arg === "--base-url" && args[i + 1]) cliBaseUrl = args[++i];
}

const ETHERSFLOW_API_URL = (cliBaseUrl || process.env.ETHERSFLOW_BASE_URL || process.env.ETHERSFLOW_API_URL || "https://www.ethersflow.com").replace(/\/$/, "");
let activeApiKey = cliApiKey || process.env.ETHERSFLOW_TOKEN || process.env.ETHERSFLOW_API_KEY || "";

function maskKey(k) {
  if (!k || k.length < 18) return "ef_sandbox_...";
  return `${k.slice(0, 15)}...${k.slice(-4)}`;
}

async function provisionSandboxKey() {
  const sandboxUrl = `${ETHERSFLOW_API_URL}/api/v1/keys/sandbox`;
  const res = await fetch(sandboxUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "EthersFlow-MCP-Server/0.3.3",
    },
    body: "{}",
  });
  const text = await res.text();
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {}
  if (!res.ok || !parsed.key) {
    const reason = parsed.message || parsed.error || `HTTP ${res.status}`;
    throw new Error(`Sandbox provisioning failed (${reason}). Get a key manually at https://www.ethersflow.com/api-keys.html`);
  }
  return parsed;
}

const server = new Server(
  {
    name: "EthersFlow",
    version: "0.3.3",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "verify_agent_action",
        description: "Gate and verify autonomous AI agent action decisions (e.g. trades, emails, claims, API calls, wallet transfers) via EthersFlow Multi-Model Federated Adversarial Consensus before execution.",
        inputSchema: {
          type: "object",
          properties: {
            agent_action: {
              type: "string",
              description: "The proposed action or decision the autonomous agent intends to take.",
            },
            reasoning_chain: {
              type: "string",
              description: "Optional internal reasoning chain or context supporting the decision.",
            },
            context: {
              type: "object",
              description: "Optional structured context or evidence payload.",
            },
            agent_count: {
              type: "number",
              description: "Number of adversarial audit nodes (1 to 5, default 3).",
            },
            persona_preset: {
              type: "string",
              description: "Built-in audit preset (clinical_safety, financial_compliance, legal_citation, cybersecurity_auditor, general_adversarial) or a registered custom persona ID/slug.",
            },
            custom_personas: {
              type: "array",
              description: "Optional inline array of custom analyst roles or persona objects ({ role, instructions }) for flexible domain reviews.",
            },
            persona_instructions: {
              type: "string",
              description: "Optional inline custom instructions appended to all council auditor system prompts.",
            },
            scope_hint: {
              type: "string",
              description: "Optional domain or task scope hint (e.g. 'clinical_safety', 'financial_compliance', 'legal_citation', 'cybersecurity_auditor').",
            },
            scope_grant: {
              type: "object",
              description: "Explicit kernel-resolvable subject authorization or scope grant evidence (e.g. { subject_id, granted_by, consent_verified, status: 'VERIFIED' }).",
            },
            policy_id: {
              type: "string",
              description: "Optional system or custom policy ID to evaluate against.",
            },
            policy: {
              type: "object",
              description: "Optional inline custom policy rules object (max_amount_usd, blocked_verbs, blocked_keywords, allowed_domains, blocked_domains, require_ticket_anchor, custom_instructions).",
            },
            grounding_enabled: {
              type: "boolean",
              description: "Enable hybrid fact grounding check.",
            },
            zero_retention: {
              type: "boolean",
              description: "Enforce zero data retention (ZDR).",
            },
          },
          required: ["agent_action"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  if (!["verify_agent_action", "ethersflow_verify_agent_action", "ethersflow_consensus_evaluate", "ethersflow_red_team_audit"].includes(toolName)) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  const args = request.params.arguments || {};
  const actionText = args.agent_action || args.action || args.query || args.prompt || "";
  if (!actionText) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            verdict: "REJECTED",
            status: "REJECTED",
            verified: false,
            action_eligible: false,
            approval_blocked: true,
            human_review_required: false,
            policy_status: "FAIL",
            evidence_status: "MISSING",
            consensus_score: 0.0,
            risk_index: 100.0,
            reason_codes: ["MISSING_AGENT_ACTION"],
            error: "Missing required argument 'agent_action' (or 'action' / 'query').",
            error_code: "MISSING_AGENT_ACTION"
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  if (!activeApiKey) {
    return {
      content: [
        {
          type: "text",
          text: "Error: Missing EthersFlow API key. Run with --demo or obtain a free key at https://www.ethersflow.com/api-keys.html",
        },
      ],
      isError: true,
    };
  }

  try {
    const url = `${ETHERSFLOW_API_URL}/api/v1/verify`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeApiKey}`,
        "User-Agent": "EthersFlow-MCP-Server/0.3.3",
      },
      body: JSON.stringify({
        agent_action: actionText,
        reasoning_chain: args.reasoning_chain || (typeof args.context === "string" ? args.context : ""),
        context: typeof args.context === "object" ? args.context : undefined,
        scope_grant: args.scope_grant,
        agent_count: args.agent_count !== undefined ? args.agent_count : 3,
        persona_preset: args.persona_preset,
        custom_personas: args.custom_personas,
        persona_instructions: args.persona_instructions,
        scope_hint: args.scope_hint || args.scope || args.hint,
        policy_id: args.policy_id,
        policy: args.policy,
        grounding_enabled: args.grounding_enabled !== undefined ? args.grounding_enabled : true,
        zero_retention: args.zero_retention !== undefined ? args.zero_retention : true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let outputText = errText;
      try {
        const parsed = JSON.parse(errText);
        outputText = JSON.stringify(parsed, null, 2);
      } catch {}
      return {
        content: [
          {
            type: "text",
            text: outputText,
          },
        ],
        isError: true,
      };
    }

    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
      isError: false,
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `EthersFlow MCP Verification Failed: ${err.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  if (!activeApiKey && !demoMode) {
    console.error("EthersFlow MCP: No API key found. Try instant 24h demo without sign-up: npx -y @ethersflow/mcp-server --demo");
    console.error("Or mint a sandbox/live key at https://www.ethersflow.com/api-keys.html and pass --api-key=<key> or ETHERSFLOW_TOKEN.");
    console.error('Client snippet: {"mcpServers":{"ethersflow":{"command":"npx","args":["-y","@ethersflow/mcp-server"],"env":{"ETHERSFLOW_TOKEN":"get_key_at_ethersflow.com/api-keys.html","ETHERSFLOW_BASE_URL":"https://www.ethersflow.com"}}}}');
    process.exit(1);
  }

  if (!activeApiKey && demoMode) {
    const minted = await provisionSandboxKey();
    activeApiKey = minted.key;
    const limit = minted.rate_limit?.limit ?? 60;
    const win = minted.rate_limit?.window ?? "hour";
    console.error(`EthersFlow MCP Demo Mode active — key ${maskKey(activeApiKey)} (24h TTL, ${limit} verdicts/${win}, gateway ${ETHERSFLOW_API_URL})`);
    console.error(`Manage permanent keys anytime: https://www.ethersflow.com/api-keys.html`);
    console.error(JSON.stringify({
      mcpServers: {
        ethersflow: {
          command: "npx",
          args: ["-y", "@ethersflow/mcp-server"],
          env: {
            ETHERSFLOW_TOKEN: activeApiKey,
            ETHERSFLOW_BASE_URL: ETHERSFLOW_API_URL,
          },
        },
      },
    }));
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EthersFlow MCP Server running on stdio.");
}

main().catch((error) => {
  console.error("Fatal error starting EthersFlow MCP Server:", error.message || error);
  process.exit(1);
});
