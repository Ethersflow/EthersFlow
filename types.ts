// types.ts — EthersFlow Decision-Rubric & Multi-Model Gate Core Types
// Conforms to EthersFlow Adoption Closure Pack (§1 & §2)

export type Decision = 'APPROVED' | 'FLAGGED_HUMAN_REVIEW' | 'REJECTED';

export interface NodeDebateRecord {
  node_id?: string;
  role?: string;
  model?: string;
  model_id?: string;
  persona?: string;
  node_status: string;
  score?: number;
  reasoning?: string;
  perspective?: string;
  signature?: string;
  latency_ms?: number;
}

export interface AttestationPayload {
  alg?: string;
  kid?: string;
  key_id?: string;
  version?: string;
  signature?: string;
  signed_at?: string;
  status?: string;
  public_key_hex?: string;
  public_key_base64url?: string;
  canonical_payload?: string;
  payload_hash?: string;
}

export interface PriorRejectionSignal {
  blocked_at: string;
  reason_codes: string[];
  policy_id?: string;
  session_id?: string;
  expires_at: string;
}

export interface PriorApprovalSignal {
  approved_at: string;
  policy_id?: string;
  session_id?: string;
  consensus_score?: number;
}

export interface AnchorChecklist {
  ticket_present: boolean;
  budget_line_present: boolean;
  scope_bounded: boolean;
  counterparty_verified: boolean;
  data_classification_present: boolean;
  missing_anchors: string[];
}

export interface Verdict {
  schema_version?: string;
  verification_schema_version?: number;
  action_id?: string;
  request_id?: string;
  trace_id?: string;
  policy_id?: string;
  decision: Decision;
  verdict?: Decision;
  status?: string;
  verified?: boolean;
  action_eligible?: boolean;
  consensus_score: number;
  confidence_interval?: [number, number];
  node_agreement?: 'unanimous' | 'majority' | 'split' | 'unanimous_approval' | 'majority_approval' | 'unanimous_rejection' | 'majority_flag' | 'none';
  risk_index: number;
  risk_factors?: string[];
  reason_codes?: string[];
  policy_status?: 'PASS' | 'FAIL' | 'INDETERMINATE';
  evidence_status?: 'SUFFICIENT' | 'CONFLICTING' | 'MISSING' | 'UNAVAILABLE';
  node_count: number;
  agent_count?: number;
  adversarial_debate?: NodeDebateRecord[];
  attestation?: AttestationPayload;
  anchor_checklist?: AnchorChecklist;
  zero_retention?: boolean;
  zero_retention_applied?: boolean;
  zero_data_retention?: boolean;
  prior_rejection?: PriorRejectionSignal;
  prior_approval?: PriorApprovalSignal;
  verdict_summary?: string;
  decision_explanation?: string;
  timestamp?: string;
}

// -----------------------------------------------------------------------------
// §1 Decision-Rubric Schema Types (policy-as-code)
// -----------------------------------------------------------------------------

export type RubricMode = 'advisory' | 'deferred' | 'hard';

export type PersonaPreset =
  | 'financial_compliance'
  | 'clinical_safety'
  | 'legal_citation'
  | 'cybersecurity_auditor'
  | 'general_adversarial';

export interface NumericRange {
  min?: number;
  max?: number;
}

export interface ThresholdComparison {
  gte?: number;
  lte?: number;
}

export interface RuleMatch {
  action_pattern?: string;
  amount_usd?: NumericRange;
  counterparty_verified?: boolean | null;
  persona_preset?: PersonaPreset | '*';
}

export interface Condition {
  node_agreement?: 'unanimous_approval' | 'majority_approval' | 'split' | 'majority_flag' | 'unanimous_rejection';
  risk_index?: ThresholdComparison;
  confidence?: ThresholdComparison;
  consensus_score?: ThresholdComparison;
}

export interface RuleConditions {
  all?: Condition[];
  any?: Condition[];
}

export interface RuleThen {
  decision: 'approve' | 'flag' | 'reject';
  reason_template?: string;
  override_node_count?: number;
  override_persona?: PersonaPreset;
}

export interface Rule {
  id: string;
  priority: number;
  match?: RuleMatch;
  conditions?: RuleConditions;
  then: RuleThen;
}

export interface HumanReviewConfig {
  integration?: 'slack' | 'microsoft_teams' | 'pagerduty' | 'jira' | 'generic_webhook';
  channel?: string;
  escalation_after_ms?: number;
  resolution_endpoint?: string;
  block_ttl_seconds?: number;
}

export interface TelemetryConfig {
  enabled?: boolean;
  endpoint?: string;
  required_fields?: string[];
}

export interface PolicyRubric {
  schema_version: '1.0';
  policy_id: string;
  description?: string;
  meta?: {
    author?: string;
    updated?: string;
    mode?: RubricMode;
    timeout_ms?: number;
  };
  defaults?: {
    persona_preset?: PersonaPreset;
    agent_count?: number;
    zero_retention?: boolean;
    grounding_enabled?: boolean;
  };
  rules: Rule[];
  human_review?: HumanReviewConfig;
  telemetry?: TelemetryConfig;
}

// -----------------------------------------------------------------------------
// §2 Hard-Gate Middleware Types
// -----------------------------------------------------------------------------

export interface ActionContext {
  requestId: string;
  sessionId?: string;
  action: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type GateResult =
  | { status: 'allowed'; verdict: Verdict; reason?: string }
  | { status: 'blocked'; verdict: Verdict; reason: string }
  | { status: 'needs_review'; verdict: Verdict; reviewTicketId: string; reason?: string };

export interface GateConfig {
  apiKey: string;
  baseUrl?: string;
  policyId?: string;
  mode?: RubricMode;
  timeoutMs?: number;
  cacheSafePatterns?: RegExp[];
  onVerdict?: (v: Verdict, ctx: ActionContext) => Promise<void>;
  createReviewTicket?: (v: Verdict, ctx: ActionContext) => Promise<string>;
}

export interface ToolRequest {
  provider: 'gemini' | 'openai' | 'anthropic' | 'local' | 'router';
  requestId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  sessionId?: string;
  reasoning?: string;
  persona?: string;
  agentCount?: number;
}

export interface SessionMemory {
  fingerprints: Map<string, string[]>;
}
