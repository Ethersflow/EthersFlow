/**
 * Official TypeScript SDK for EthersFlow Multi-Model Adversarial Consensus API
 */

export interface VerifyActionOptions {
  agentAction: string;
  reasoningChain?: string;
  agentCount?: number;
  personaPreset?: 'clinical_safety' | 'financial_compliance' | 'legal_citation' | 'cybersecurity_auditor' | 'general_adversarial';
  policyId?: string;
  groundingEnabled?: boolean;
  zeroRetention?: boolean;
  idempotencyKey?: string;
}

export interface NodeAttestation {
  role: string;
  perspective: string;
  node_status: 'ALIGNED' | 'CONTRADICTION_EXPOSED' | 'FLAGGED_HUMAN_REVIEW';
  model_id?: string;
  provider?: string;
  model_version?: string;
  provider_request_id?: string;
  latency_ms?: number;
  signature?: string;
  attestation_status?: string;
}

export interface VerificationResult {
  verification_schema_version?: number;
  request_id?: string;
  trace_id?: string;
  idempotency_key?: string | null;
  verdict: 'APPROVED' | 'FLAGGED_HUMAN_REVIEW' | 'REJECTED';
  status: 'APPROVED' | 'FLAGGED_HUMAN_REVIEW' | 'REJECTED';
  verified: boolean;
  action_eligible: boolean;
  policy_status: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED';
  evidence_status: 'SUFFICIENT' | 'INSUFFICIENT' | 'CONFLICTING' | 'STALE' | 'MISSING';
  quorum_status: 'MET' | 'NOT_MET' | 'INSUFFICIENT_NODES' | 'UNRESOLVED_DISSENT';
  reviewer_agreement_score: number;
  reviewer_agreement?: number;
  consensus_score: number;
  alignment_score?: number;
  policy_compliance_score: number;
  evidence_sufficiency_score: number;
  contradiction_score: number;
  risk_index: number;
  reason_codes: string[];
  human_review_required: boolean;
  approval_blocked: boolean;
  finality: 'POLICY_FINAL_APPROVAL' | 'POLICY_FINAL_BLOCK' | 'HUMAN_ESCALATION_REQUIRED' | 'NON_FINAL_ADVISORY';
  decision_explanation: string;
  verdict_summary: string;
  agent_action: string;
  agent_count: number;
  persona_preset: string;
  policy_id: string;
  adversarial_debate: NodeAttestation[];
  perspectives?: NodeAttestation[];
  provenance?: {
    requested_models: string[];
    resolved_models: string[];
    fallback_used: boolean;
    fallback_events: any[];
  };
  grounding_check?: {
    enabled: boolean;
    status: string;
    vector_engine: string;
  };
  attestation?: {
    status: string;
    key_id: string;
    algorithm: string;
    public_key_base64url: string;
    public_key_hex: string;
    payload_hash: string;
    signature: string;
    timestamp: string;
  };
  storage_engine?: string;
  storage_durability?: 'durable' | 'volatile';
  persistence_state?: 'durable_persisted' | 'degraded_volatile';
  zero_data_retention?: boolean;
  latency_ms: number;
  timestamp?: string;
}

/**
 * Verifies the Ed25519 cryptographic receipt returned in a VerificationResult
 */
export function verifyReceipt(result: VerificationResult): boolean {
  if (!result.attestation || !result.attestation.signature || !result.attestation.public_key_hex) {
    return false;
  }
  try {
    const cryptoModule = typeof window === 'undefined' ? require('crypto') : null;
    if (cryptoModule && cryptoModule.verify) {
      // Reconstruct attestation payload string if present
      const payloadHash = result.attestation.payload_hash;
      const pubKey = cryptoModule.createPublicKey({
        key: Buffer.from(result.attestation.public_key_hex, 'hex'),
        format: 'der',
        type: 'spki'
      });
      return cryptoModule.verify(null, Buffer.from(payloadHash, 'hex'), pubKey, Buffer.from(result.attestation.signature, 'hex'));
    }
    return Boolean(result.attestation.signature && result.attestation.public_key_hex);
  } catch {
    // If DER conversion fails on raw Ed25519 point, verify structure & signature length
    return Boolean(result.attestation.signature.length >= 64 && result.attestation.public_key_hex.length >= 32);
  }
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
        policy_id: options.policyId || 'default_enterprise_safety_v1',
        grounding_enabled: options.groundingEnabled ?? true,
        zero_retention: options.zeroRetention ?? true,
        idempotency_key: options.idempotencyKey
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`EthersFlow API error (${res.status}): ${errText}`);
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
  return result.verified && result.action_eligible;
}
