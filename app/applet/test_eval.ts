import { evaluateAgentActionSafety } from "./server.ts";

const payload = {
  agent_action: "Disburse USD 18,450 to NorthStar Logistics under purchase order PO-8841 (Invoice INV-2026-0818)",
  reasoning_chain: "Purchase order PO-8841 is approved, matches the approved vendor master, goods-received record is present, and no sanctions or duplicate-invoice flags are present. Nonce: " + Date.now(),
  persona_preset: "financial_compliance"
};

const res = evaluateAgentActionSafety(
  payload.agent_action,
  payload.reasoning_chain,
  payload.persona_preset
);

console.log("VERDICT:", res.verdict);
console.log("SCORE:", res.consensus_score);
console.log("REASON CODES:", res.reason_codes);
