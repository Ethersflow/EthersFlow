# EthersFlow Python SDK

Lightweight Python client for the [EthersFlow](https://ethersflow.com) Verifiable Agent Trust Gateway API.

## Installation

```bash
pip install ethersflow
```

## Quick Start

```python
from ethersflow import EthersFlowClient

client = EthersFlowClient(api_key="your_api_key")
result = client.verify({"agent": "my-agent", "action": "transfer"})
print(result)
```

## Configuration

| Environment Variable | Description |
|---|---|
| `ETHERSFLOW_API_KEY` | Your EthersFlow API key |
| `ETHERSFLOW_TOKEN` | Alternative API key variable |
| `ETHERSFLOW_BASE_URL` | API base URL (defaults to production) |

## License

MIT
