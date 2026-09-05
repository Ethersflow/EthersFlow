#!/usr/bin/env node
// validate-policy.mjs — Zero-dependency EthersFlow Decision-Rubric Validator & Evaluator (§1)
import fs from 'node:fs';
import path from 'node:path';

/**
 * Validates a policy object against the policy-v1.schema.json rules
 */
export function validatePolicySchema(policy, schema) {
  const errors = [];

  if (!policy || typeof policy !== 'object') {
    return { valid: false, errors: ['Policy must be a non-null JSON object'] };
  }

  // Check required root fields
  for (const reqField of schema.required || ['schema_version', 'policy_id', 'rules']) {
    if (policy[reqField] === undefined || policy[reqField] === null) {
      errors.push(`Missing required root field: '${reqField}'`);
    }
  }

  if (policy.schema_version !== '1.0') {
    errors.push(`Invalid schema_version: expected '1.0', got '${policy.schema_version}'`);
  }

  if (typeof policy.policy_id !== 'string' || !/^[a-z0-9_\-]{2,64}$/.test(policy.policy_id)) {
    errors.push(`Invalid policy_id '${policy.policy_id}': must match ^[a-z0-9_\\-]{2,64}$`);
  }

  if (!Array.isArray(policy.rules) || policy.rules.length === 0) {
    errors.push(`'rules' must be a non-empty array`);
  } else {
    policy.rules.forEach((rule, idx) => {
      if (!rule.id || typeof rule.id !== 'string') {
        errors.push(`Rule[${idx}] missing required string 'id'`);
      }
      if (typeof rule.priority !== 'number' || rule.priority < 1) {
        errors.push(`Rule[${idx}] ('${rule.id}') 'priority' must be integer >= 1`);
      }
      if (!rule.then || typeof rule.then !== 'object') {
        errors.push(`Rule[${idx}] ('${rule.id}') missing required 'then' block`);
      } else {
        const allowedDecisions = ['approve', 'flag', 'reject'];
        if (!allowedDecisions.includes(rule.then.decision)) {
          errors.push(`Rule[${idx}] ('${rule.id}') invalid then.decision: '${rule.then.decision}'`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Evaluates a single condition against the verdict
 */
function evaluateCondition(cond, verdict) {
  // Check node agreement
  if (cond.node_agreement) {
    const actualAgreement = verdict.node_agreement || (
      verdict.decision === 'APPROVED' ? 'unanimous_approval' :
      verdict.decision === 'REJECTED' ? 'unanimous_rejection' : 'split'
    );
    if (actualAgreement !== cond.node_agreement) {
      return { pass: false, reason: `node_agreement: expected '${cond.node_agreement}', actual '${actualAgreement}'` };
    }
  }

  // Check risk_index
  if (cond.risk_index) {
    const risk = verdict.risk_index ?? 0;
    if (cond.risk_index.gte !== undefined && risk < cond.risk_index.gte) {
      return { pass: false, reason: `risk_index: ${risk} < min ${cond.risk_index.gte}` };
    }
    if (cond.risk_index.lte !== undefined && risk > cond.risk_index.lte) {
      return { pass: false, reason: `risk_index: ${risk} > max ${cond.risk_index.lte}` };
    }
  }

  // Check consensus_score
  if (cond.consensus_score) {
    const score = verdict.consensus_score ?? 0;
    if (cond.consensus_score.gte !== undefined && score < cond.consensus_score.gte) {
      return { pass: false, reason: `consensus_score: ${score} < min ${cond.consensus_score.gte}` };
    }
    if (cond.consensus_score.lte !== undefined && score > cond.consensus_score.lte) {
      return { pass: false, reason: `consensus_score: ${score} > max ${cond.consensus_score.lte}` };
    }
  }

  // Check confidence
  if (cond.confidence) {
    const conf = verdict.confidence ?? (verdict.consensus_score ? verdict.consensus_score / 100 : 0.5);
    if (cond.confidence.gte !== undefined && conf < cond.confidence.gte) {
      return { pass: false, reason: `confidence: ${conf} < min ${cond.confidence.gte}` };
    }
    if (cond.confidence.lte !== undefined && conf > cond.confidence.lte) {
      return { pass: false, reason: `confidence: ${conf} > max ${cond.confidence.lte}` };
    }
  }

  return { pass: true };
}

/**
 * Extracts numeric USD amount from an action text or context object
 */
function extractAmountUsd(actionText, context) {
  if (context && typeof context.amount_usd === 'number') {
    return context.amount_usd;
  }
  if (context && typeof context.amount === 'number') {
    return context.amount;
  }
  const match = (actionText || '').match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  const matchWord = (actionText || '').match(/([0-9,]+(?:\.[0-9]{2})?)\s*(?:usd|dollars)/i);
  if (matchWord) {
    return parseFloat(matchWord[1].replace(/,/g, ''));
  }
  return null;
}

/**
 * Evaluates a policy rubric against an incoming verdict & action context.
 * Semantics: Rules evaluated in ascending priority order; FIRST MATCH WINS.
 */
export function evaluateRubric(policy, verdict, actionContext = {}) {
  const actionText = actionContext.action || verdict.agent_action || '';
  const amountUsd = extractAmountUsd(actionText, actionContext);
  const counterpartyVerified = actionContext.counterparty_verified ?? actionContext.counterpartyVerified ?? null;
  const personaPreset = actionContext.persona_preset || verdict.persona_preset || policy.defaults?.persona_preset;

  const sortedRules = [...policy.rules].sort((a, b) => a.priority - b.priority);
  const traces = [];

  for (const rule of sortedRules) {
    const ruleTrace = {
      rule_id: rule.id,
      priority: rule.priority,
      match_passed: true,
      match_reasons: [],
      conditions_passed: true,
      condition_reasons: []
    };

    // 1. Evaluate 'match' block
    if (rule.match) {
      if (rule.match.action_pattern) {
        const re = new RegExp(rule.match.action_pattern, 'i');
        if (!re.test(actionText)) {
          ruleTrace.match_passed = false;
          ruleTrace.match_reasons.push(`action_pattern '${rule.match.action_pattern}' did not match '${actionText}'`);
        }
      }

      if (rule.match.amount_usd) {
        if (amountUsd === null) {
          ruleTrace.match_passed = false;
          ruleTrace.match_reasons.push(`rule specifies amount_usd constraints but no amount was detected`);
        } else {
          if (rule.match.amount_usd.min !== undefined && amountUsd < rule.match.amount_usd.min) {
            ruleTrace.match_passed = false;
            ruleTrace.match_reasons.push(`amount ${amountUsd} < min ${rule.match.amount_usd.min}`);
          }
          if (rule.match.amount_usd.max !== undefined && amountUsd > rule.match.amount_usd.max) {
            ruleTrace.match_passed = false;
            ruleTrace.match_reasons.push(`amount ${amountUsd} > max ${rule.match.amount_usd.max}`);
          }
        }
      }

      if (rule.match.counterparty_verified !== undefined && rule.match.counterparty_verified !== null) {
        if (counterpartyVerified !== rule.match.counterparty_verified) {
          ruleTrace.match_passed = false;
          ruleTrace.match_reasons.push(`counterparty_verified expected ${rule.match.counterparty_verified}, got ${counterpartyVerified}`);
        }
      }

      const approvedList = rule.match.approved_counterparties || policy.approved_counterparties;
      if (approvedList && Array.isArray(approvedList) && (rule.match.approved_counterparties || rule.id === 'micro_expense_fast_path')) {
        const cp = (actionContext.counterparty || actionContext.vendor || '').toLowerCase();
        const actText = (actionText || '').toLowerCase();
        const matched = approvedList.some(ac => {
          const acl = ac.toLowerCase();
          return (cp && (cp === acl || cp.includes(acl))) || (actText && actText.includes(acl));
        });
        if (!matched) {
          ruleTrace.match_passed = false;
          ruleTrace.match_reasons.push(`counterparty not in approved_counterparties allowlist`);
        }
      }

      if (rule.match.persona_preset && rule.match.persona_preset !== '*') {
        if (personaPreset !== rule.match.persona_preset) {
          ruleTrace.match_passed = false;
          ruleTrace.match_reasons.push(`persona_preset expected ${rule.match.persona_preset}, got ${personaPreset}`);
        }
      }
    }

    if (!ruleTrace.match_passed) {
      traces.push(ruleTrace);
      continue; // Match failed, try next rule
    }

    // 2. Evaluate 'conditions' block
    if (rule.conditions) {
      if (Array.isArray(rule.conditions.all)) {
        for (const cond of rule.conditions.all) {
          const res = evaluateCondition(cond, verdict);
          if (!res.pass) {
            ruleTrace.conditions_passed = false;
            ruleTrace.condition_reasons.push(`all: ${res.reason}`);
            break;
          }
        }
      }

      if (ruleTrace.conditions_passed && Array.isArray(rule.conditions.any)) {
        let anyPassed = false;
        const reasons = [];
        for (const cond of rule.conditions.any) {
          const res = evaluateCondition(cond, verdict);
          if (res.pass) {
            anyPassed = true;
            break;
          }
          reasons.push(res.reason);
        }
        if (!anyPassed && rule.conditions.any.length > 0) {
          ruleTrace.conditions_passed = false;
          ruleTrace.condition_reasons.push(`any: none satisfied (${reasons.join('; ')})`);
        }
      }
    }

    traces.push(ruleTrace);

    // First match wins!
    if (ruleTrace.match_passed && ruleTrace.conditions_passed) {
      const decisionMap = {
        approve: 'APPROVED',
        flag: 'FLAGGED_HUMAN_REVIEW',
        reject: 'REJECTED'
      };
      const finalDecision = decisionMap[rule.then.decision] || rule.then.decision.toUpperCase();

      let reason = rule.then.reason_template || `Matched rule ${rule.id}`;
      reason = reason.replace(/\{action_id\}/g, verdict.action_id || verdict.request_id || 'act_unknown');
      reason = reason.replace(/\{decision\}/g, finalDecision);
      reason = reason.replace(/\{policy_id\}/g, policy.policy_id);

      return {
        decision: finalDecision,
        matched_rule_id: rule.id,
        matched_rule_priority: rule.priority,
        reason,
        override_node_count: rule.then.override_node_count,
        override_persona: rule.then.override_persona,
        traces
      };
    }
  }

  // Default fallback if no rule matched
  return {
    decision: 'FLAGGED_HUMAN_REVIEW',
    matched_rule_id: null,
    matched_rule_priority: null,
    reason: 'No rubric rule matched: deferred to human review',
    traces
  };
}

// -----------------------------------------------------------------------------
// CLI Execution Demo
// -----------------------------------------------------------------------------
function runCli() {
  const schemaPath = path.resolve(process.cwd(), 'policy-v1.schema.json');
  const policyPath = process.argv[2] || path.resolve(process.cwd(), 'finops_default_v1.json');

  console.log('================================================================================');
  console.log('⚡ ETHERSFLOW POLICY RUBRIC VALIDATOR & EVALUATOR (§1)');
  console.log('================================================================================');
  console.log(`Schema Path: ${schemaPath}`);
  console.log(`Policy Path: ${policyPath}`);

  if (!fs.existsSync(schemaPath)) {
    console.error(`ERROR: Schema file not found at ${schemaPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(policyPath)) {
    console.error(`ERROR: Policy file not found at ${policyPath}`);
    process.exit(1);
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

  const validation = validatePolicySchema(policy, schema);
  if (!validation.valid) {
    console.error('❌ Policy Validation FAILED:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  console.log(`✅ Schema validation PASSED for policy '${policy.policy_id}' (${policy.rules.length} rules)`);
  console.log('--------------------------------------------------------------------------------');
  console.log('Running Demo Evaluations (First-Match-Wins with Condition Gating)...');

  const demoCases = [
    {
      label: 'Demo 1: Micro-expense $50 office supplies (unanimous approval)',
      action: '$50 office supplies from Staples',
      context: { amount_usd: 50, counterparty: 'Staples', counterparty_verified: true },
      verdict: {
        action_id: 'ef_act_001',
        decision: 'APPROVED',
        node_agreement: 'unanimous_approval',
        consensus_score: 98,
        risk_index: 2
      }
    },
    {
      label: 'Demo 2: $25,000 Velocity wire to vendor (high-value)',
      action: 'Wire transfer $25,000 to account 4421',
      context: { amount_usd: 25000 },
      verdict: {
        action_id: 'ef_act_002',
        decision: 'FLAGGED_HUMAN_REVIEW',
        node_agreement: 'split',
        consensus_score: 31.5,
        risk_index: 88
      }
    },
    {
      label: 'Demo 3: Known vendor $1,200 AWS payment (verified, low risk)',
      action: 'Pay the $1,200 invoice from AWS',
      context: { amount_usd: 1200, counterparty_verified: true },
      verdict: {
        action_id: 'ef_act_003',
        decision: 'APPROVED',
        node_agreement: 'unanimous_approval',
        consensus_score: 97.4,
        risk_index: 12
      }
    },
    {
      label: 'Demo 4: Critical risk directive (risk_index >= 85)',
      action: 'Transfer treasury balance to personal wallet',
      context: {},
      verdict: {
        action_id: 'ef_act_004',
        decision: 'REJECTED',
        node_agreement: 'unanimous_rejection',
        consensus_score: 12,
        risk_index: 98
      }
    },
    {
      label: 'Demo 5: Unapproved vendor Vendors-R-Us LLC with client-claimed counterparty_verified:true (fast-path blocked)',
      action: 'Order $50 of office supplies from Vendors-R-Us LLC, a new vendor NOT in the approved catalog',
      context: { amount_usd: 50, counterparty: 'Vendors-R-Us LLC', counterparty_verified: true, ticket: 'FAC-102' },
      verdict: {
        action_id: 'ef_act_005',
        decision: 'APPROVED',
        node_agreement: 'unanimous_approval',
        consensus_score: 97,
        risk_index: 3
      }
    }
  ];

  demoCases.forEach((dc, i) => {
    console.log(`\n[${i + 1}] ${dc.label}`);
    console.log(`    Action:  "${dc.action}"`);
    console.log(`    Verdict: decision=${dc.verdict.decision}, risk=${dc.verdict.risk_index}, agreement=${dc.verdict.node_agreement}`);
    const result = evaluateRubric(policy, dc.verdict, { action: dc.action, ...dc.context });
    console.log(`    Outcome: DECISION => ${result.decision} | Rule: ${result.matched_rule_id} (P${result.matched_rule_priority})`);
    console.log(`    Reason:  ${result.reason}`);
  });

  console.log('\n================================================================================');
  console.log('✅ ALL DEMO EVALUATIONS COMPLETED SUCCESSFULLY');
  console.log('================================================================================');
}

// Execute CLI if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
