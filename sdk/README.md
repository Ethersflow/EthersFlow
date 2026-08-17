# EthersFlow SDK

TypeScript SDK for integrating with the EthersFlow API and trust-layer services.

## Installation

```bash
npm install @ethersflow/sdk
```

## Quick Start

```ts
import { EthersFlowClient } from '@ethersflow/sdk'

const client = new EthersFlowClient({
  apiKey: process.env.ETHERSFLOW_API_KEY,
})

async function run() {
  const result = await client.verify({
    input: 'Summarize this contract risk profile',
    model: 'gpt-4.1',
  })

  console.log(result)
}

run()
```

## Configuration

Set your API key as an environment variable:

```bash
export ETHERSFLOW_API_KEY=your_api_key_here
```

## Documentation

- API Docs: ../docs
- Repository: https://github.com/Ethersflow/EthersFlow

## License

See the repository license for details.
