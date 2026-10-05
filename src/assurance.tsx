import React from 'react';

/**
 * ============================================================================
 * ETHERSFLOW ASSURANCE SPECIFICATION & GATE-SIDE POLICY PRESETS
 * ============================================================================
 *
 * §1. FINOPS_DEFAULT_V1 POLICY SPECIFICATION
 * finops_default_v1 is a gate-side policy preset documented in assurance.tsx.
 * 
 * IMPORTANT ARCHITECTURAL DIRECTIVE:
 * Do NOT test finops_default_v1 in the UI; exercise the gate service directly
 * (POST /api/v1/verify or Model Context Protocol MCP tools/call verify_agent_action)
 * and let the QA Testing Hub record verdicts.
 *
 * §2. CANARY ACTION->GATE ROUTING CONTRACT
 * Use the 9 invalid-persona + 6 invalid-agent_count cells as canaries for
 * action->gate routing: bad inputs must keep failing loud with explicit verdicts.
 *
 * Canary Specifications:
 * - 9 Invalid-Persona Cells:
 *   Payloads specifying unsupported or malformed persona_preset values:
 *   [e.g., "unknown_persona", "hacker_mode", "arbitrary_preset", "sql_injection",
 *    "admin_override", "root_exec", "prompt_injection", "custom_unauthorized", "bypass_policy"]
 *   Expected Gate Output: HTTP 400 Bad Request, verdict: "REJECTED",
 *   error_code: "INVALID_PERSONA_PRESET", approval_blocked: true, reason_codes: ["INVALID_PERSONA_PRESET"].
 *
 * - 6 Invalid-Agent_Count Cells:
 *   Payloads specifying out-of-bounds or invalid agent_count values:
 *   [e.g., 0, 1, 8, -1, 99, 3.5]
 *   Expected Gate Output: HTTP 400 Bad Request, verdict: "REJECTED",
 *   error_code: "INVALID_AGENT_COUNT", approval_blocked: true, reason_codes: ["INVALID_AGENT_COUNT"].
 *
 * §3. TRUTH CHECKSUM BINDING
 * Source of truth = table qa_testing_hub (3,699 × 16).
 * Checksum expectation: 2,103 / 1,351 / 183 / 47 / 9 / 6 = 3,699.
 *
 * §4. DESTINATION EVALUATION & PURGE-AS-SIGNATURE INVARIANTS
 * - Destination evaluation must precede any benign exit unconditionally on every compute action.
 * - Purge-as-signature: Any escalation cell must completely purge all trust-assertion codes.
 */

export interface AssurancePolicyPreset {
  policy_id: string;
  schema_version: string;
  description: string;
  evaluation_boundary: 'gate_service' | 'ui_interactive';
  defaults: {
    persona_preset: string;
    agent_count: number;
    zero_retention: boolean;
  };
  canary_definitions: {
    invalid_persona_count: number;
    invalid_agent_count_count: number;
    expected_verdict: 'REJECTED';
  };
  checksum_tuple: [number, number, number, number, number, number];
  total_cells: number;
}

export const FINOPS_DEFAULT_V1_SPEC: AssurancePolicyPreset = {
  policy_id: 'finops_default_v1',
  schema_version: '1.0',
  description: 'Default gate-side policy preset for autonomous payment, compute provisioning, and expense agents',
  evaluation_boundary: 'gate_service',
  defaults: {
    persona_preset: 'financial_compliance',
    agent_count: 3,
    zero_retention: true
  },
  canary_definitions: {
    invalid_persona_count: 9,
    invalid_agent_count_count: 6,
    expected_verdict: 'REJECTED'
  },
  checksum_tuple: [2103, 1351, 183, 47, 9, 6],
  total_cells: 3699
};

export const AssuranceDocumentationView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-slate-200">
      <div className="border border-indigo-500/30 rounded-xl bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
            EthersFlow Assurance Specification
          </h1>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
            policy: finops_default_v1
          </span>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-300">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <strong>Operational Directive:</strong>{' '}
            <code className="bg-slate-950/60 px-1.5 py-0.5 rounded text-amber-300">finops_default_v1</code> is a gate-side policy preset documented in assurance.tsx — don't "test" it in the UI; exercise the gate service directly and let the QA hub record verdicts.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-2">
                Canary Ingress Routing
              </h2>
              <ul className="space-y-1.5 text-xs font-mono text-slate-400">
                <li>• 9 invalid-persona canaries → explicit <span className="text-rose-400">REJECTED</span> verdict</li>
                <li>• 6 invalid-agent_count canaries → explicit <span className="text-rose-400">REJECTED</span> verdict</li>
                <li>• Action→gate routing must fail loud with explicit JSON verdict</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-2">
                Hub Checksum Verification
              </h2>
              <div className="text-xs font-mono space-y-1 text-slate-400">
                <div>Table: <span className="text-indigo-300">qa_testing_hub (3,699 × 16)</span></div>
                <div>Checksum tuple: <span className="text-emerald-400">2,103 / 1,351 / 183 / 47 / 9 / 6</span></div>
                <div>Checksum total: <span className="text-white font-bold">3,699</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-2">
              Addendum 19 Mandates
            </h2>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• <strong>Unconditional Destination Evaluation:</strong> Destination evaluation precedes any benign exit on every compute action.</li>
              <li>• <strong>Purge-As-Signature:</strong> Any non-approved exit strictly strips all trust-assertion and verified codes.</li>
              <li>• <strong>Handover Hygiene:</strong> Served revision, git commit, build digest, and health payload bound in immutable manifest.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssuranceDocumentationView;
