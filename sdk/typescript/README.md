# @ethersflow/sdk

Official TypeScript SDK and Cloudflare Worker middleware for **EthersFlow** — the multi-model trust layer that verifies AI agent action directives through adversarial consensus before execution.

## Installation

```bash
npm install @ethersflow/sdk
```

## Quick Start

```typescript
import { EthersFlow } from '@ethersflow/sdk';

const ef = new EthersFlow(process.env.ETHERSFLOW_API_KEY || 'your_api_key');

const result = await ef.verify({
  agentAction: 'Transfer 5000 USDC to 0x71C... for auditing services',
  personaPreset: 'financial_compliance',
  agentCount: 3
});

console.log('Verified:', result.verified);
console.log('Verdict:', result.verdict_summary);
```

## Cloudflare Worker Middleware

```typescript
import { cloudflareVerifyGate } from '@ethersflow/sdk';

export default {
  async fetch(request: Request, env: { ETHERSFLOW_API_KEY: string }) {
    const isSafe = await cloudflareVerifyGate(
      'Transfer 5000 USDC to wallet 0x9f',
      'Vendor audit payment',
      env.ETHERSFLOW_API_KEY
    );

    if (!isSafe) {
      return new Response('Action blocked by EthersFlow Consensus Gate', { status: 403 });
    }

    // Proceed with execution
  }
};
```
