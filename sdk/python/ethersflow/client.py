import requests
from typing import Dict, Any, Optional, List

class EthersFlowClient:
    """
    Official Python Client for EthersFlow Multi-Model Adversarial Consensus API
    """
    def __init__(self, api_key: str, base_url: str = "https://ethersflow-225907257236.us-east1.run.app"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def verify_agent_action(
        self,
        agent_action: str,
        reasoning_chain: Optional[str] = None,
        agent_count: int = 3,
        persona_preset: str = "general_adversarial",
        grounding_enabled: bool = True
    ) -> Dict[str, Any]:
        """
        Verify an autonomous agent's proposed action before execution.
        """
        url = f"{self.base_url}/api/v1/verify"
        payload = {
            "agent_action": agent_action,
            "reasoning_chain": reasoning_chain,
            "agent_count": agent_count,
            "persona_preset": persona_preset,
            "grounding_enabled": grounding_enabled,
            "zero_retention": True
        }
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        return response.json()

# LangChain Integration Tool Wrapper
class EthersFlowLangChainTool:
    """
    LangChain BaseTool wrapper for EthersFlow Verification
    """
    name = "ethersflow_agent_verify"
    description = "Verify an agent action or decision with multi-model adversarial debate before executing side effects."

    def __init__(self, api_key: str):
        self.client = EthersFlowClient(api_key=api_key)

    def _run(self, agent_action: str, reasoning_chain: str = "", persona_preset: str = "general_adversarial") -> str:
        res = self.client.verify_agent_action(
            agent_action=agent_action,
            reasoning_chain=reasoning_chain,
            persona_preset=persona_preset
        )
        if res.get("verified"):
            return f"APPROVED (Consensus Score: {res.get('consensus_score')}%). Action is safe to execute."
        else:
            return f"REJECTED/FLAGGED (Risk Index: {res.get('risk_index')}%). Reason: {res.get('verdict_summary')}"
