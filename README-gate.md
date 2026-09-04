# EthersFlow Gate & Guard Middleware (§2 & §2.6)

Model-blind, fail-closed trust gate and agent tool-loop security middleware for AI agents.

---

## 1. Overview & Architecture

EthersFlow Hard-Gate (`ethersflowGate.ts`) and Agent Guard (`ethersflow-guard.ts`) act as an authoritative deterministic enforcement layer between LLM decision loops and real-world system execution (financial transactions, infrastructure changes, database mutations, and file operations).

```
   ┌──────────────────────────────────────────────────────────┐
   │                    AI Agent Engine                       │
   │      (Gemini / OpenAI / Anthropic / Custom Agent)        │
   └────────────────────────────┬─────────────────────────────┘
                                │ Tool Request
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                 ethersflow-guard.ts                      │
   │  1. Canonical Serialization (canonicalSerialize)         │
   │  2. High-Risk Verb Synonym Mapping (SYNONYM_MAP)         │
   │  3. Session Block-Memory Check (SessionBlockMemory)      │
   └────────────────────────────┬─────────────────────────────┘
                                │
               ┌────────────────┴────────────────┐
      Hit Cache│                                 │ Miss
               ▼                                 ▼
    ┌──────────────────────┐         ┌──────────────────────┐
    │ Short-Circuit Block  │         │  ethersflowGate.ts   │
    │  (sessionBlockContext│         │  Model-Blind Gateway │
    │   terse feedback)    │         │  Enforces Policy-v1  │
    └──────────────────────┘         └──────────┬───────────┘
                                                │ POST /api/v1/verify
                                                ▼
                                     ┌──────────────────────┐
                                     │  EthersFlow Gateway  │
                                     │  Adversarial Debate  │
                                     │  Ed25519 Attestation │
                                     │  Anchor Verification │
                                     └──────────────────────┘
```

---

## 2. Core Components

### `ethersflowGate.ts` (Model-Blind Core)
- **Model-Blind Execution**: Treats all agent directives uniformly regardless of whether the calling model is Gemini, Claude, Llama, or GPT-4.
- **Fail-Closed Deny-by-Default**: If the gateway is unreachable, encounters timeouts, or returns an HTTP error, the gate defaults to `status: 'blocked'`.
- **Envelope Versioning**: All gate envelopes include `__gate_version__: 1`.
- **Enforcement Modes**:
  - `hard` *(default)*: Strictly blocks any directive not receiving `APPROVED` consensus (including `FLAGGED_HUMAN_REVIEW` and `REJECTED`).
  - `deferred`: Dispatches `createReviewTicket` on flagged actions, keeping execution blocked until human oversight resolves the ticket.
  - `advisory`: Emits telemetry and logs verdicts while maintaining fail-closed guard in production.

### `ethersflow-guard.ts` (Agent Tool-Loop Guard)
- **Canonical Serialization (`canonicalSerialize`)**: Recursively sorts object keys, trims string parameters, and applies high-risk verb normalization.
- **High-Risk Verb Synonym Map (`SYNONYM_MAP`)**:
  - `disburse`, `remit`, `send_funds`, `pay`, `transfer`, `payout` ➔ `wire`
  - `erase`, `remove`, `destroy`, `drop`, `truncate`, `purge` ➔ `delete`
  - `elevate`, `escalate`, `make_admin`, `sudo`, `promote` ➔ `grant_admin`
  - `execute`, `shell`, `spawn`, `eval`, `system` ➔ `run_command`
- **Session Block-Memory (`SessionBlockMemory`)**: Bounded in-memory LRU cache storing blocked action hashes for 15 minutes. Prevents prompt-injection retry loops and redundant gateway traffic.
- **Terse Agent Feedback (`generateSessionBlockContext`)**: Generates structured, token-efficient feedback instructing the agent on missing anchors (e.g. `ticket`, `budget_line`, `scope`) to facilitate automated parameter correction.

---

## 3. Installation & Usage Examples

### Direct Gate Evaluation
```typescript
import { EthersflowGate } from './ethersflowGate';

const gate = new EthersflowGate({
  apiKey: process.env.ETHERSFLOW_API_KEY!,
  baseUrl: 'https://api.ethersflow.com',
  mode: 'hard'
});

const result = await gate.evaluate('wire $25,000 to vendor ACME', {
  context: {
    ticket: 'FIN-8841',
    budget_line: 'cloud_infra_Q3',
    scope: 'routine_procurement',
    counterparty: 'ACME Inc'
  },
  zeroRetention: true
});

if (result.status === 'blocked') {
  console.error('Execution blocked:', result.reason);
} else {
  console.log('Action approved, consensus score:', result.verdict.consensus_score);
}
```

### Wrapping an Agent Tool Loop
```typescript
import { wrapToolExecutor } from './ethersflow-guard';

async function executeWireTransfer(args: { amount: number; vendor: string }) {
  // Actual payment logic
  return { txId: 'tx_9921', status: 'submitted' };
}

// Wrap tool with EthersFlow Guard
const guardedWireTransfer = wrapToolExecutor('wire_transfer', executeWireTransfer);

// Invocation inside agent tool loop:
try {
  await guardedWireTransfer(
    { amount: 50, vendor: 'Office Depot' },
    {
      sessionId: 'session_user_42',
      reasoning: 'Ordering office supplies under approved facilities ticket FAC-101',
      context: {
        ticket: 'FAC-101',
        budget_line: 'kitchen_supplies_Q3',
        scope: 'routine_procurement',
        data_classification: 'internal'
      }
    }
  );
} catch (err) {
  console.error('Tool execution prevented by EthersFlow Guard:', err.message);
}
```

---

## 4. Cross-Language Parity (Python)

`ethersflow_gate.py` mirrors the TypeScript client interface and behavior:

```python
from ethersflow_gate import EthersflowGate

gate = EthersflowGate(api_key="ef_live_demo")
result = gate.evaluate(
    action_text="$50 office supplies",
    reasoning_chain="routine facilities procurement",
    context={
        "ticket": "FAC-101",
        "scope": "routine_procurement",
        "budget_line": "kitchen_supplies_Q3"
    }
)

if result["status"] == "allowed":
    print("Action approved:", result["verdict"]["consensus_score"])
else:
    print("Action blocked:", result["reason"])
```

---

## 5. Security Invariants

1. **Zero Retention (ZDR)**: `zero_retention: true` is passed by default. Verification payloads redact raw directives from persistent storage, returning `zero_retention_applied: true`.
2. **First-Match-Wins Rubric**: Policies defined in `policy-v1.schema.json` evaluate rules sequentially by priority.
3. **Hard Floors**: Lack of verifiable anchors enforces a hard floor (`consensus_score` ≤ 31.5, `risk_index` ≥ 88 for hazardous-bare actions) regardless of model sentiment.
