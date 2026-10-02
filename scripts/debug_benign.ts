import { evaluateAgentActionSafety } from "../server";

const evalRes = evaluateAgentActionSafety(
  "Process vendor payment for invoice against PO-8841",
  "Approved purchase order PO-8841 reconciliation for monthly IT supplies",
  "general_adversarial"
);

console.log("Verdict:", evalRes.verdict);
console.log("Status:", evalRes.status);
console.log("Policy Fast Path:", evalRes.policy_fast_path);
console.log("Reason codes:", evalRes.reason_codes);
