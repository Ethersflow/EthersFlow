// Minimal TypeScript SDK public surface for EthersFlow
// Exports: cloudflareVerifyGate, EthersFlow, VerifyActionOptions, VerificationResult

export type VerifyActionOptions = {
  reasoning_chain?: string;
  agent_count?: number;
  persona_preset?: string;
  grounding_enabled?: boolean;
};

export type VerificationResult = {
  status: string;
  verified: boolean;
  consensus_score?: number;
  risk_index?: number;
  verdict_summary?: string;
  [key: string]: any;
};

export class EthersFlow {
  baseUrl: string;
  apiKey?: string;

  constructor(apiKey?: string, baseUrl: string = "https://ethersflow-225907257236.us-east1.run.app") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async verifyAgentAction(agent_action: string, opts: VerifyActionOptions = {}): Promise<VerificationResult> {
    const payload = {
      agent_action,
      reasoning_chain: opts.reasoning_chain,
      agent_count: opts.agent_count,
      persona_preset: opts.persona_preset,
      grounding_enabled: opts.grounding_enabled ?? true,
      zero_retention: true
    };

    const res = await fetch(`${this.baseUrl}/api/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`EthersFlow verify request failed: ${res.status} ${text}`);
    }

    return (await res.json()) as VerificationResult;
  }
}

export async function cloudflareVerifyGate(
  agent_action: string,
  reasoning: string | undefined,
  apiKey: string | undefined
): Promise<boolean> {
  const client = new EthersFlow(apiKey);
  const res = await client.verifyAgentAction(agent_action, { reasoning_chain: reasoning });
  return Boolean(res.verified);
}

export default EthersFlow;
