# EthersFlow Python SDK

Lightweight Python client for the EthersFlow verification API.

## Install

```bash
pip install ethersflow
```

## Usage

```python
from ethersflow import EthersFlowClient

client = EthersFlowClient(api_key="YOUR_ETHERSFLOW_API_KEY")
response = client.verify_agent_action(
    agent_action="Transfer 5000 USDC to wallet 0x9f for smart contract audit",
    persona_preset="financial_compliance",
    agent_count=3,
)

print(response["status"])
```

Set `ETHERSFLOW_API_KEY` in your environment or pass `api_key=` explicitly when constructing the client.
