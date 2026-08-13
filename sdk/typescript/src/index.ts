/**
 * Official TypeScript SDK for EthersFlow Multi-Model Adversarial Consensus API
 */

export interface VerifyActionOptions {
  agentAction: string;
  reasoningChain?: string;
  agentCount?: number;
  personaPreset?: 'clinical_safety' | 'financial_compliance' | 'legal_citation' | 'cybersecurity_auditor' | 'general_adversarial';
  groundingEnabled?: boolean;
}

export interface VerificationResult {
  status: 'APPROVED' | 'FLAGGED_HUMAN_REVIEW' | 'REJECTED';
  verified: boolean;
  consensus_score: number;
  risk_index: number;
  verdict_summary: string;
  adversarial_debate: Array<{
    role: string;
    perspective: string;
    node_status: string;
  }>;
  latency_ms: number;
}

export class EthersFlow {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://ethersflow-225907257236.us-east1.run.app') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async verify(options: VerifyActionOptions): Promise<VerificationResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_action: options.agentAction,
        reasoning_chain: options.reasoningChain,
        agent_count: options.agentCount || 3,
        persona_preset: options.personaPreset || 'general_adversarial',
        grounding_enabled: options.groundingEnabled ?? true,
        zero_retention: true
      })
    });

    if (!res.ok) {
      throw new Error(`EthersFlow API error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  }
}

/**
 * Cloudflare Worker Middleware Helper
 */
export async function cloudflareVerifyGate(
  requestAction: string,
  reasoningChain: string,
  ethersflowApiKey: string
): Promise<boolean> {
  const ef = new EthersFlow(ethersflowApiKey);
  const result = await ef.verify({
    agentAction: requestAction,
    reasoningChain: reasoningChain,
    personaPreset: 'cybersecurity_auditor'
  });
  return result.verified;
}
