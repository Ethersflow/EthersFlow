#!/usr/bin/env node
/**
 * @ethersflow/mcp-server — Executable Model Context Protocol (MCP) Server
 * Exposes `verify_agent_action` tool for Claude Desktop, Cursor, and any MCP client.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Parse CLI args (e.g. --api-key=xyz or --base-url=http://...)
const args = process.argv.slice(2);
let cliApiKey = "";
let cliBaseUrl = "";
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith("--api-key=")) cliApiKey = arg.split("=")[1];
  else if (arg === "--api-key" && args[i + 1]) cliApiKey = args[++i];
  else if (arg.startsWith("--token=")) cliApiKey = arg.split("=")[1];
  else if (arg === "--token" && args[i + 1]) cliApiKey = args[++i];
  else if (arg.startsWith("--base-url=")) cliBaseUrl = arg.split("=")[1];
  else if (arg === "--base-url" && args[i + 1]) cliBaseUrl = args[++i];
}

const ETHERSFLOW_API_URL = cliBaseUrl || process.env.ETHERSFLOW_BASE_URL || process.env.ETHERSFLOW_API_URL || "https://ethersflow-225907257236.us-east1.run.app";
const ETHERSFLOW_API_KEY = cliApiKey || process.env.ETHERSFLOW_TOKEN || process.env.ETHERSFLOW_API_KEY || "";

const server = new Server(
  {
    name: "@ethersflow/mcp-server",
    version: "0.1.0",
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
            agent_count: {
              type: "number",
              description: "Number of adversarial audit nodes (2 to 7, default 3).",
            },
            persona_preset: {
              type: "string",
              enum: [
                "clinical_safety",
                "financial_compliance",
                "legal_citation",
                "cybersecurity_auditor",
                "general_adversarial",
              ],
              description: "Audit persona preset for specialized domain compliance.",
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
          text: "Error: Missing required argument 'agent_action' (or 'action' / 'query').",
        },
      ],
      isError: true,
    };
  }

  try {
    const url = `${ETHERSFLOW_API_URL.replace(/\/$/, "")}/api/v1/verify`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ETHERSFLOW_API_KEY}`,
        "User-Agent": "EthersFlow-MCP-Server/0.1.0",
      },
      body: JSON.stringify({
        agent_action: actionText,
        reasoning_chain: args.reasoning_chain || args.context || "",
        agent_count: args.agent_count || 3,
        persona_preset: args.persona_preset || "general_adversarial",
        zero_retention: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        content: [
          {
            type: "text",
            text: `EthersFlow API HTTP Error ${response.status}: ${errText}`,
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EthersFlow MCP Server running on stdio.");
}

main().catch((error) => {
  console.error("Fatal error starting EthersFlow MCP Server:", error);
  process.exit(1);
});
