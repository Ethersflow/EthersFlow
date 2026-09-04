// ethersflowGate.ts — Model-Blind EthersFlow Hard-Gate Core (§2)
// Conforms to EthersFlow Adoption Closure Pack (§2 & §2.6)

import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import type {
  Verdict,
  Decision,
  PolicyRubric,
  GateConfig,
  GateResult,
  ActionContext,
  RubricMode,
  ToolRequest
} from './types.ts';

export const GATE_VERSION = 1;

export interface GateEnvelope<T> {
  __gate_version__: number;
  gate_timestamp: string;
  payload: T;
}

export interface GateVerificationOptions {
  policy?: PolicyRubric;
  sessionId?: string;
  requestId?: string;
  personaPreset?: string;
  agentCount?: number;
  zeroRetention?: boolean;
  context?: Record<string, unknown>;
  reasoningChain?: string;
  metadata?: Record<string, unknown>;
}

export class EthersflowGate {
  public readonly version: number = GATE_VERSION;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly mode: RubricMode;
  private readonly defaultPolicyId: string;
  private readonly timeoutMs: number;
  private readonly cacheSafePatterns: RegExp[];
  private readonly onVerdict?: (v: Verdict, ctx: ActionContext) => Promise<void>;
  private readonly createReviewTicket?: (v: Verdict, ctx: ActionContext) => Promise<string>;

  constructor(config: GateConfig) {
    if (!config.apiKey) {
      throw new Error('EthersflowGate requires an apiKey (ETHERSFLOW_API_KEY).');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || process.env.ETHERSFLOW_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
    this.mode = config.mode || 'hard';
    this.defaultPolicyId = config.policyId || 'default_enterprise_safety_v1';
    this.timeoutMs = config.timeoutMs || 8000;
    this.cacheSafePatterns = config.cacheSafePatterns || [];
    this.onVerdict = config.onVerdict;
    this.createReviewTicket = config.createReviewTicket;
  }

  /**
   * Evaluates an agent action or tool invocation against EthersFlow gateway.
   * Model-blind: operates identically regardless of LLM provider.
   */
  public async evaluate(
    actionText: string,
    options: GateVerificationOptions = {}
  ): Promise<GateResult> {
    const requestId = options.requestId || `req_gate_${crypto.randomBytes(8).toString('hex')}`;
    const actionContext: ActionContext = {
      requestId,
      sessionId: options.sessionId,
      action: actionText,
      metadata: options.metadata
    };

    // 1. Fast-Path Allowlist (Safe cache patterns)
    for (const pattern of this.cacheSafePatterns) {
      if (pattern.test(actionText)) {
        const safeVerdict: Verdict = {
          schema_version: '1.0',
          decision: 'APPROVED',
          verdict: 'APPROVED',
          verified: true,
          action_eligible: true,
          consensus_score: 99.0,
          risk_index: 1.0,
          node_count: 1,
          evidence_status: 'SUFFICIENT',
          policy_status: 'PASS',
          reason_codes: ['CACHE_SAFE_PATTERN_ALLOWLIST'],
          timestamp: new Date().toISOString()
        };
        return {
          status: 'allowed',
          verdict: safeVerdict,
          reason: `Fast-path match on safe pattern: ${pattern.toString()}`
        };
      }
    }

    // 2. Query EthersFlow Gateway (/api/v1/verify)
    let verdict: Verdict;
    try {
      verdict = await this.callGateway(actionText, options, requestId);
    } catch (err: any) {
      // Fail-Closed: Deny-by-default on network failure, timeout, or parsing error
      const failClosedVerdict: Verdict = {
        schema_version: '1.0',
        decision: 'REJECTED',
        verdict: 'REJECTED',
        verified: false,
        action_eligible: false,
        consensus_score: 0.0,
        risk_index: 99.9,
        node_count: 0,
        evidence_status: 'MISSING',
        policy_status: 'FAIL',
        reason_codes: ['GATEWAY_UNAVAILABLE_DENY_BY_DEFAULT', 'FAIL_CLOSED_PROTECTION'],
        decision_explanation: `EthersFlow Gateway verification failed closed: ${err.message}`,
        timestamp: new Date().toISOString()
      };

      return {
        status: 'blocked',
        verdict: failClosedVerdict,
        reason: `EthersFlow Fail-Closed Gate: ${err.message}`
      };
    }

    // 3. Optional Audit Hook
    if (this.onVerdict) {
      try {
        await this.onVerdict(verdict, actionContext);
      } catch (hookErr) {
        console.error('[EthersflowGate] onVerdict hook error:', hookErr);
      }
    }

    // 4. Decision Resolution
    const decision: Decision = verdict.decision || verdict.verdict || 'REJECTED';

    if (decision === 'APPROVED') {
      return {
        status: 'allowed',
        verdict,
        reason: verdict.decision_explanation || 'Action approved by EthersFlow consensus.'
      };
    }

    if (decision === 'FLAGGED_HUMAN_REVIEW') {
      if (this.mode === 'deferred' && this.createReviewTicket) {
        try {
          const ticketId = await this.createReviewTicket(verdict, actionContext);
          return {
            status: 'needs_review',
            verdict,
            reviewTicketId: ticketId,
            reason: `Action flagged for human review. Ticket created: ${ticketId}`
          };
        } catch (ticketErr: any) {
          // If ticket creation fails in deferred mode, fail closed
          return {
            status: 'blocked',
            verdict,
            reason: `Action flagged for human review and ticket creation failed: ${ticketErr.message}`
          };
        }
      }

      // Hard mode: FLAGGED_HUMAN_REVIEW blocks execution
      return {
        status: 'blocked',
        verdict,
        reason: verdict.decision_explanation || 'Action flagged for human review. Execution blocked under hard floor.'
      };
    }

    // REJECTED or unknown
    return {
      status: 'blocked',
      verdict,
      reason: verdict.decision_explanation || 'Action rejected by EthersFlow policy.'
    };
  }

  /**
   * Helper for tool invocation interceptors
   */
  public async evaluateToolCall(
    toolRequest: ToolRequest,
    options: GateVerificationOptions = {}
  ): Promise<GateResult> {
    const actionText = `${toolRequest.toolName}(${JSON.stringify(toolRequest.toolArgs)})`;
    return this.evaluate(actionText, {
      ...options,
      requestId: toolRequest.requestId,
      sessionId: toolRequest.sessionId,
      reasoningChain: toolRequest.reasoning,
      personaPreset: toolRequest.persona,
      agentCount: toolRequest.agentCount
    });
  }

  /**
   * Makes the HTTP POST request to EthersFlow gateway
   */
  private async callGateway(
    action: string,
    options: GateVerificationOptions,
    requestId: string
  ): Promise<Verdict> {
    const url = new URL(`${this.baseUrl}/api/v1/verify`);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const payload = JSON.stringify({
      agent_action: action,
      reasoning_chain: options.reasoningChain || `Agent action evaluated via EthersflowGate v${this.version}`,
      context: options.context || null,
      persona_preset: options.personaPreset || 'financial_compliance',
      agent_count: options.agentCount || 3,
      zero_retention: options.zeroRetention ?? true,
      policy_id: options.policy?.policy_id || this.defaultPolicyId,
      idempotency_key: requestId
    });

    return new Promise<Verdict>((resolve, reject) => {
      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Gate-Version': String(this.version),
            'X-Request-Id': requestId
          },
          timeout: this.timeoutMs
        },
        (res) => {
          let rawData = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              return reject(
                new Error(`Gateway HTTP ${res.statusCode}: ${rawData.slice(0, 200)}`)
              );
            }
            try {
              const json = JSON.parse(rawData);
              // Normalize verdict shape
              const normalized: Verdict = {
                schema_version: json.schema_version || '1.0',
                decision: json.verdict || json.decision || 'REJECTED',
                verdict: json.verdict || json.decision || 'REJECTED',
                status: json.status,
                verified: json.verified,
                action_eligible: json.action_eligible,
                consensus_score: json.consensus_score ?? 0,
                risk_index: json.risk_index ?? 0,
                node_count: json.node_count || json.agent_count || 3,
                reason_codes: json.reason_codes || [],
                evidence_status: json.evidence_status || 'MISSING',
                policy_status: json.policy_status || 'FAIL',
                anchor_checklist: json.anchor_checklist,
                zero_retention_applied: json.zero_retention_applied,
                attestation: json.attestation,
                adversarial_debate: json.adversarial_debate || json.perspectives,
                decision_explanation: json.decision_explanation || json.verdict_summary,
                verdict_summary: json.verdict_summary || json.decision_explanation,
                timestamp: json.timestamp || new Date().toISOString()
              };
              resolve(normalized);
            } catch (parseErr: any) {
              reject(new Error(`Failed to parse gateway response JSON: ${parseErr.message}`));
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`EthersFlow Gateway request timed out after ${this.timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }
}

/**
 * Factory helper
 */
export function createEthersflowGate(config: GateConfig): EthersflowGate {
  return new EthersflowGate(config);
}
