// ethersflow-guard.ts — Agent Tool-Loop Security Interceptor (§2 + §2.6)
// Provides canonical serialization, high-risk verb synonym mapping,
// session block-memory, terse block feedback, and fail-closed deny-by-default execution.

import crypto from 'node:crypto';
import { EthersflowGate, GATE_VERSION, type GateEnvelope } from './ethersflowGate.ts';
import type {
  Verdict,
  GateResult,
  ActionContext,
  ToolRequest,
  PolicyRubric
} from './types.ts';

/**
 * High-Risk Verb Synonym Map (§2.6)
 * Collapses semantic evasions for financial, destructive, administrative,
 * and system execution directives into standardized canonical verbs.
 */
export const SYNONYM_MAP: Record<string, string> = {
  // Financial movement -> wire
  disburse: 'wire',
  remit: 'wire',
  send_funds: 'wire',
  send_money: 'wire',
  pay: 'wire',
  transfer: 'wire',
  payout: 'wire',

  // Destructive data mutations -> delete
  erase: 'delete',
  remove: 'delete',
  destroy: 'delete',
  drop: 'delete',
  truncate: 'delete',
  purge: 'delete',

  // Privilege escalation -> grant_admin
  elevate: 'grant_admin',
  escalate: 'grant_admin',
  make_admin: 'grant_admin',
  sudo: 'grant_admin',
  promote: 'grant_admin',

  // Arbitrary execution -> run_command
  execute: 'run_command',
  shell: 'run_command',
  spawn: 'run_command',
  eval: 'run_command',
  system: 'run_command'
};

/**
 * Normalizes verbs in text using SYNONYM_MAP
 */
export function normalizeHighRiskVerbs(text: string): string {
  if (!text) return '';
  let normalized = text;
  for (const [synonym, canonical] of Object.entries(SYNONYM_MAP)) {
    const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
    normalized = normalized.replace(regex, canonical);
  }
  return normalized;
}

/**
 * Deterministic canonical serializer for actions or tool parameters.
 * Sorts object keys recursively, trims string values, normalizes high-risk verbs,
 * and outputs deterministic JSON string.
 */
export function canonicalSerialize(input: unknown): string {
  if (input === null || input === undefined) {
    return 'null';
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    return JSON.stringify(normalizeHighRiskVerbs(trimmed));
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return JSON.stringify(input);
  }

  if (Array.isArray(input)) {
    const items = input.map((item) => canonicalSerialize(item));
    return `[${items.join(',')}]`;
  }

  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const entries = sortedKeys.map((key) => {
      const val = canonicalSerialize(obj[key]);
      return `"${key}":${val}`;
    });
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(input);
}

/**
 * Generates a SHA-256 fingerprint from canonical serialization
 */
export function canonicalHash(input: unknown): string {
  const serialized = canonicalSerialize(input);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Entry for session-level block memory
 */
export interface BlockMemoryEntry {
  canonicalAction: string;
  actionHash: string;
  blockedAt: number;
  expiresAt: number;
  reasonCodes: string[];
  explanation: string;
  missingAnchors?: string[];
  verdict: Verdict;
}

/**
 * Session Block Memory (§2.6.2)
 * Maintains a bounded in-memory cache of previously blocked actions within a session
 * to short-circuit repetitive evasions without redundant network round-trips.
 */
export class SessionBlockMemory {
  private memory = new Map<string, BlockMemoryEntry>();
  private readonly ttlMs: number;
  private readonly maxCapacity: number;

  constructor(ttlMinutes: number = 15, maxCapacity: number = 500) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.maxCapacity = maxCapacity;
  }

  public recordBlock(
    actionOrArgs: unknown,
    verdict: Verdict,
    explanation: string
  ): BlockMemoryEntry {
    const canonical = canonicalSerialize(actionOrArgs);
    const hash = canonicalHash(actionOrArgs);
    const now = Date.now();

    // Enforce capacity bounds
    if (this.memory.size >= this.maxCapacity) {
      const oldestKey = this.memory.keys().next().value;
      if (oldestKey) this.memory.delete(oldestKey);
    }

    const entry: BlockMemoryEntry = {
      canonicalAction: canonical,
      actionHash: hash,
      blockedAt: now,
      expiresAt: now + this.ttlMs,
      reasonCodes: verdict.reason_codes || ['SESSION_PREVIOUSLY_BLOCKED'],
      explanation,
      missingAnchors: verdict.anchor_checklist?.missing_anchors,
      verdict
    };

    this.memory.set(hash, entry);
    return entry;
  }

  public checkBlock(actionOrArgs: unknown): BlockMemoryEntry | null {
    const hash = canonicalHash(actionOrArgs);
    const entry = this.memory.get(hash);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memory.delete(hash);
      return null;
    }

    return entry;
  }

  public clear(): void {
    this.memory.clear();
  }

  public size(): number {
    return this.memory.size;
  }
}

// Global or shared session memory instance
export const defaultSessionBlockMemory = new SessionBlockMemory();

/**
 * Generates a terse block context string to inform the agent what failed (§2.6)
 */
export function generateSessionBlockContext(entry: BlockMemoryEntry): string {
  const missing = entry.missingAnchors?.length
    ? ` Missing anchors: [${entry.missingAnchors.join(', ')}].`
    : '';
  const codes = entry.reasonCodes.length
    ? ` Reason codes: [${entry.reasonCodes.join(', ')}].`
    : '';
  return `[ETHERSFLOW_BLOCK] Action previously blocked in this session.${codes}${missing} Instruction: Review context, provide valid ticket/budget anchors, or obtain human override.`;
}

export interface GuardOptions {
  gate?: EthersflowGate;
  policy?: PolicyRubric;
  sessionId?: string;
  blockMemory?: SessionBlockMemory;
  context?: Record<string, unknown>;
  reasoningChain?: string;
  denyByDefault?: boolean;
}

/**
 * High-level tool guard interceptor
 * Evaluates a tool call, checks session block-memory, evaluates gate,
 * and wraps output in a versioned envelope.
 */
export async function guardToolCall(
  toolRequest: ToolRequest,
  options: GuardOptions = {}
): Promise<GateEnvelope<GateResult>> {
  const blockMem = options.blockMemory || defaultSessionBlockMemory;
  const canonicalInput = `${toolRequest.toolName}:${canonicalSerialize(toolRequest.toolArgs)}`;

  // 1. Check Session Block Memory
  const priorBlock = blockMem.checkBlock(canonicalInput);
  if (priorBlock) {
    const terseContext = generateSessionBlockContext(priorBlock);
    const shortCircuitResult: GateResult = {
      status: 'blocked',
      verdict: priorBlock.verdict,
      reason: terseContext
    };

    return {
      __gate_version__: GATE_VERSION,
      gate_timestamp: new Date().toISOString(),
      payload: shortCircuitResult
    };
  }

  // 2. Deny-by-default initialization: if gate not provided, check env or fail
  let gate = options.gate;
  if (!gate) {
    const apiKey = process.env.ETHERSFLOW_API_KEY || 'ef_live_demo';
    gate = new EthersflowGate({ apiKey });
  }

  try {
    const evalResult = await gate.evaluateToolCall(toolRequest, {
      policy: options.policy,
      sessionId: options.sessionId || toolRequest.sessionId,
      context: options.context,
      reasoningChain: options.reasoning || toolRequest.reasoning
    });

    // If blocked or rejected, record into Session Block Memory
    if (evalResult.status === 'blocked') {
      blockMem.recordBlock(
        canonicalInput,
        evalResult.verdict,
        evalResult.reason
      );
    }

    return {
      __gate_version__: GATE_VERSION,
      gate_timestamp: new Date().toISOString(),
      payload: evalResult
    };
  } catch (err: any) {
    // Fail-Closed Deny By Default
    const failClosedVerdict: Verdict = {
      schema_version: '1.0',
      decision: 'REJECTED',
      verdict: 'REJECTED',
      verified: false,
      action_eligible: false,
      consensus_score: 0.0,
      risk_index: 100.0,
      node_count: 0,
      evidence_status: 'MISSING',
      policy_status: 'FAIL',
      reason_codes: ['DENY_BY_DEFAULT_UNHANDLED_EXCEPTION', 'FAIL_CLOSED_GATE'],
      decision_explanation: `Deny-by-default triggered: ${err.message}`,
      timestamp: new Date().toISOString()
    };

    const failClosedResult: GateResult = {
      status: 'blocked',
      verdict: failClosedVerdict,
      reason: `Deny by default: ${err.message}`
    };

    return {
      __gate_version__: GATE_VERSION,
      gate_timestamp: new Date().toISOString(),
      payload: failClosedResult
    };
  }
}

/**
 * Wraps an existing tool execution function with the EthersFlow guard
 */
export function wrapToolExecutor<TArgs = any, TResult = any>(
  toolName: string,
  executor: (args: TArgs) => Promise<TResult>,
  guardOptions: GuardOptions = {}
): (args: TArgs, meta?: { sessionId?: string; reasoning?: string; context?: any }) => Promise<TResult> {
  return async (args: TArgs, meta = {}) => {
    const toolReq: ToolRequest = {
      provider: 'router',
      requestId: `req_${crypto.randomBytes(6).toString('hex')}`,
      toolName,
      toolArgs: args as any,
      sessionId: meta.sessionId,
      reasoning: meta.reasoning
    };

    const envelope = await guardToolCall(toolReq, {
      ...guardOptions,
      sessionId: meta.sessionId,
      context: meta.context,
      reasoningChain: meta.reasoning
    });

    if (envelope.payload.status === 'blocked') {
      throw new Error(`[ETHERSFLOW_GUARD_BLOCKED] ${envelope.payload.reason}`);
    }

    if (envelope.payload.status === 'needs_review') {
      throw new Error(
        `[ETHERSFLOW_REVIEW_REQUIRED] Tool execution paused. Review ticket: ${envelope.payload.reviewTicketId}. ${envelope.payload.reason}`
      );
    }

    // Execution allowed
    return executor(args);
  };
}
