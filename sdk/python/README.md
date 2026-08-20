# EthersFlow Python SDK

**Lightweight Python client + LangChain tool wrapper for the EthersFlow multi-model agent trust layer.**

## Overview

EthersFlow gates autonomous AI agent actions through adversarial multi-model consensus before execution. The Python SDK provides:

- **Direct API client** — Make requests to the EthersFlow verification gateway
- **LangChain integration** — Drop-in tool wrapper for LangChain agents
- **Zero-dependency reference implementation** — Full signature verification (Ed25519) with no external crypto libraries

## Installation

```bash
pip install ethersflow
```

## Quick Start

### Verify an Agent Action

```python
from ethersflow import EthersFlowClient

client = EthersFlowClient(
    base_url="https://ethersflow-225907257236.us-east1.run.app",
    api_key="ef_live_YOUR_API_KEY"  # Replace with your actual API key
)

# Submit an agent action for verification
result = client.verify_action(
    agent_action="Execute $250,000 wire transfer to Vendor X",
    reasoning_chain="Invoice PO-8841 matched; under approval threshold.",
    persona_preset="financial_compliance",
    agent_count=5  # 5-node adversarial council
)

if result["status"] == "APPROVED":
    print(f"✅ Action approved with {result['consensus_score']}% confidence")
else:
    print(f"⛔ Action flagged: {result['verdict_summary']}")
```

### LangChain Tool Integration

```python
from langchain.agents import AgentType, initialize_agent
from langchain.llms import OpenAI
from ethersflow.langchain import ethersflow_tool

llm = OpenAI(temperature=0)
agent = initialize_agent(
    tools=[ethersflow_tool(api_key="ef_live_YOUR_API_KEY")],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
)

# Agent automatically gates decisions through EthersFlow
response = agent.run(
    "Before executing a trade, verify it passes adversarial review."
)
```

## API Reference

### `EthersFlowClient`

#### Constructor

```python
EthersFlowClient(
    base_url: str = "https://ethersflow-225907257236.us-east1.run.app",
    api_key: str = None  # Falls back to ETHERSFLOW_API_KEY env var
)
```

#### Methods

**`verify_action(agent_action, reasoning_chain=None, persona_preset="general_adversarial", agent_count=3)`**

Verify an autonomous agent action through adversarial consensus.

**Parameters:**
- `agent_action` (str, required): The proposed action (e.g., "Execute wire transfer")
- `reasoning_chain` (str, optional): The reasoning leading to the action
- `persona_preset` (str, optional): Council type
  - `"clinical_safety"` — Medical/clinical context
  - `"financial_compliance"` — Fintech/banking context
  - `"legal_citation"` — Legal/contract analysis
  - `"cybersecurity_auditor"` — Security & threat assessment
  - `"general_adversarial"` (default) — Generic multi-model debate
- `agent_count` (int, optional): Number of audit nodes (2–7, default 3)

**Returns:** Dict with keys:
- `status` (str): `"APPROVED"`, `"FLAGGED_HUMAN_REVIEW"`, or `"REJECTED"`
- `verified` (bool): `True` if status is `"APPROVED"`
- `consensus_score` (float): Confidence 0–100%
- `risk_index` (float): Risk 0–100%
- `verdict_summary` (str): Human-readable verdict
- `perspectives` (list): Individual node verdicts

**`get_jwks()`**

Fetch the JWKS public key set for cryptographic signature verification.

**`get_attestation_manifest()`**

Fetch the attestation authority manifest with public key and metadata.

## Environment Variables

```bash
# API endpoint (optional, defaults to production Cloud Run)
ETHERSFLOW_BASE_URL=https://ethersflow-225907257236.us-east1.run.app

# API key (required for authenticated endpoints)
ETHERSFLOW_API_KEY=ef_live_YOUR_KEY
ETHERSFLOW_TOKEN=ef_live_YOUR_KEY  # Alternative
```

## Signature Verification

The SDK includes a zero-dependency verifier for Ed25519 node attestations:

```python
from ethersflow import EthersFlowVerifier

verifier = EthersFlowVerifier()

# Verify a node's cryptographic attestation
attestation = verifier.verify_attestation_signature(node_payload)
if attestation["valid"]:
    print(f"✅ Signature valid, issued by {attestation['issuer']}")
else:
    print(f"❌ Signature invalid or tampered")
```

## Troubleshooting

### 401 Unauthorized

- Ensure `ETHERSFLOW_API_KEY` or `api_key` parameter is set
- Verify the key format starts with `ef_live_` or matches your subscription tier
- Check that the key hasn't expired in your EthersFlow dashboard

### Connection Timeout

- Increase timeout: `client.timeout = 30`  
- Verify `base_url` is correct and accessible  
- Check network connectivity to the Cloud Run endpoint

### LangChain Integration Not Found

- Ensure LangChain is installed: `pip install langchain>=0.0.200`

## Support

- **Issues:** [GitHub Issues](https://github.com/Ethersflow/EthersFlow/issues)
- **Docs:** [https://ethersflow.com](https://ethersflow.com)
- **Email:** [ethersflow.dev@gmail.com](mailto:ethersflow.dev@gmail.com)

## License

MIT
