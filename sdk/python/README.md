# EthersFlow Python SDK

Official Python client and LangChain integration wrapper for **EthersFlow** — the multi-model trust layer that verifies AI outputs and agent action directives through adversarial consensus before execution.

## Installation

```bash
pip install ethersflow
```

Or install directly from git:
```bash
pip install git+https://github.com/Ethersflow/EthersFlow.git#subdirectory=sdk/python
```

## Quick Start

```python
import os
from ethersflow import EthersFlowClient

client = EthersFlowClient(api_key=os.getenv("ETHERSFLOW_API_KEY", "your_api_key"))

result = client.verify_agent_action(
    agent_action="Transfer 5000 USDC to 0x71C... for auditing services",
    persona_preset="financial_compliance",
    agent_count=3
)

print(f"Verified: {result['verified']}")
print(f"Verdict: {result['verdict_summary']}")
```

## LangChain Integration

```python
from ethersflow import EthersFlowLangChainTool

verifier_tool = EthersFlowLangChainTool(api_key=os.getenv("ETHERSFLOW_API_KEY", "your_api_key"))
tools = [verifier_tool]
```
