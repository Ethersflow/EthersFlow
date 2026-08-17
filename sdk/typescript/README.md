# @ethersflow/sdk

TypeScript SDK for EthersFlow verification, plus a lightweight Cloudflare Worker helper.

- npm: [`@ethersflow/sdk`](https://www.npmjs.com/package/@ethersflow/sdk)
- API base URL default: `https://ethersflow-225907257236.us-east1.run.app`

## Installation

```bash
npm install @ethersflow/sdk
```

## Quick Start

```typescript
import { EthersFlow } from '@ethersflow/sdk';

const client = new EthersFlow(process.env.ETHERSFLOW_API_KEY);

const result = await client.verifyAgentAction(
  'Transfer 5000 USDC to wallet 0x9f for a smart-contract audit',
  {
    reasoning_chain: 'Vendor request via email notification',
    persona_preset: 'financial_compliance',
    agent_count: 3,
  }
);

console.log(result.status);
console.log(result.consensus_score);
console.log(result.verdict_summary);
```

## API

### `new EthersFlow(apiKey?, baseUrl?)`

- `apiKey`: EthersFlow live key (`ef_live_...`)
- `baseUrl`: optional override, defaults to production Cloud Run

### `verifyAgentAction(agent_action, options?)`

Available options:

- `reasoning_chain?: string`
- `agent_count?: number`
- `persona_preset?: string`
- `grounding_enabled?: boolean`

The SDK sends `zero_retention: true` by default.

### `cloudflareVerifyGate(agent_action, reasoning, apiKey)`

Returns `true` when the EthersFlow verdict is verified, otherwise `false`.

```typescript
import { cloudflareVerifyGate } from '@ethersflow/sdk';

export default {
  async fetch(_request: Request, env: { ETHERSFLOW_API_KEY: string }) {
    const allowed = await cloudflareVerifyGate(
      '$50 office supplies (micro-expense)',
      'Routine procurement request',
      env.ETHERSFLOW_API_KEY
    );

    return new Response(allowed ? 'approved' : 'blocked', {
      status: allowed ? 200 : 403,
    });
  },
};
```

## Error Handling

`verifyAgentAction()` throws on non-2xx responses:

```typescript
try {
  await client.verifyAgentAction('Transfer funds');
} catch (error) {
  console.error(error);
}
```

Example thrown message:

```text
EthersFlow verify request failed: 401 unauthorized
```

Because `cloudflareVerifyGate()` delegates to `verifyAgentAction()`, it also rethrows upstream API failures. Wrap Worker calls in `try/catch` if you need a fallback policy.

## TypeScript Types

The package ships with published types for:

- `EthersFlow`
- `VerifyActionOptions`
- `VerificationResult`
- `cloudflareVerifyGate`

Example compile check:

```bash
npx tsc your-file.ts --module NodeNext --target ES2022 --moduleResolution NodeNext --noEmit
```

## Testing Guide

### Installation Smoke Test

```bash
npm view @ethersflow/sdk version
npm install @ethersflow/sdk
```

### Runtime Smoke Test

```typescript
import EthersFlow from '@ethersflow/sdk';

const client = new EthersFlow(process.env.ETHERSFLOW_API_KEY);
const result = await client.verifyAgentAction('$50 office supplies (micro-expense)', {
  persona_preset: 'financial_compliance',
  agent_count: 3,
});

console.log(result.status, result.verified);
```

### Live API / JWKS Checks

Generate a live key from `https://ethersflow.com/#developers`, then:

```bash
export ETHERSFLOW_API_KEY="ef_live_your_key"
export ETHERSFLOW_BASE_URL="https://ethersflow-225907257236.us-east1.run.app"

curl -sS "$ETHERSFLOW_BASE_URL/api/health"
curl -sS "$ETHERSFLOW_BASE_URL/.well-known/jwks.json"
curl -sS "$ETHERSFLOW_BASE_URL/.well-known/attestation.json"
```

## Developer Portal Workflow

1. Open `https://ethersflow.com/#developers`
2. Go to the API/B2B portal
3. Create a live `ef_live_...` key
4. Store it in `ETHERSFLOW_API_KEY`
5. Run the quick-start examples above

## Troubleshooting

- **401/403 responses**: verify the live key is valid and not revoked
- **Network failures**: confirm your runtime can resolve the production Cloud Run hostname
- **Worker failures**: wrap `cloudflareVerifyGate()` in `try/catch`
- **Type errors**: ensure TypeScript is compiling with modern ESM settings (`moduleResolution NodeNext` is a good default)
