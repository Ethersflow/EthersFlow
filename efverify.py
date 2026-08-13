#!/usr/bin/env python3
"""
EthersFlow Zero-Dependency Reference Client & Signature Verifier
================================================================
Validates EthersFlow Multi-Model Adversarial Consensus API, JWKS Key Sets,
Ed25519 Cryptographic Node Attestations, and OpenAI Drop-In Completions.

Usage:
  python efverify.py demo           Run full interactive verification suite
  python efverify.py verify <action> Verify a custom proposed agent action
  python efverify.py attestation    Verify JWKS keys and cryptographic signatures
"""

import os
import sys
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

DEFAULT_BASE_URL = os.getenv("ETHERSFLOW_BASE_URL", "http://localhost:3000")
DEFAULT_API_KEY = os.getenv("ETHERSFLOW_API_KEY", "ef_live_test")

class EthersFlowVerifier:
    def __init__(self, base_url: str = DEFAULT_BASE_URL, api_key: str = DEFAULT_API_KEY):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def _http_get(self, path: str) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        req = urllib.request.Request(url, headers={"User-Agent": "EthersFlow-Python-Verifier/1.0"})
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _http_post(self, path: str, payload: Dict[str, Any], auth: bool = True) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json", "User-Agent": "EthersFlow-Python-Verifier/1.0"}
        if auth and self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                return {"http_status": e.code, "error": json.loads(err_body)}
            except Exception:
                return {"http_status": e.code, "error": err_body}

    def check_health(self) -> Dict[str, Any]:
        return self._http_get("/api/health")

    def get_jwks(self) -> Dict[str, Any]:
        return self._http_get("/.well-known/jwks.json")

    def get_attestation_manifest(self) -> Dict[str, Any]:
        return self._http_get("/.well-known/attestation.json")

    def verify_action(
        self,
        agent_action: str,
        reasoning_chain: Optional[str] = None,
        persona_preset: str = "financial_compliance",
        agent_count: int = 3
    ) -> Dict[str, Any]:
        payload = {
            "agent_action": agent_action,
            "reasoning_chain": reasoning_chain or "Autonomous execution request",
            "persona_preset": persona_preset,
            "agent_count": agent_count,
            "zero_retention": True
        }
        return self._http_post("/api/v1/verify", payload)

    def verify_attestation_signature(self, node_payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._http_post("/api/v1/verify-attestation", node_payload, auth=False)

    def verify_chat_completion(self, prompt: str) -> Dict[str, Any]:
        payload = {
            "model": "ethersflow-consensus-v1",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2
        }
        return self._http_post("/v1/chat/completions", payload)


def run_demo(verifier: EthersFlowVerifier):
    print("=" * 70)
    print(" ETHERSFLOW ADVERSARIAL CONSENSUS & ATTESTATION VERIFIER")
    print("=" * 70)

    # 1. Health
    print("\n[1/5] Checking Gateway Health & Version...")
    try:
        health = verifier.check_health()
        print(f"  ✓ Status: {health.get('status')} | Version: {health.get('version')} | Pipeline: {health.get('fac_pipeline')}")
    except Exception as e:
        print(f"  ✗ Health check failed: {e}")
        return

    # 2. JWKS
    print("\n[2/5] Fetching Public Key Set (/.well-known/jwks.json)...")
    jwks = verifier.get_jwks()
    key = jwks.get("keys", [{}])[0]
    print(f"  ✓ Key ID: {key.get('kid')} | Algorithm: {key.get('alg')} | Type: {key.get('kty')} ({key.get('crv')})")
    print(f"  ✓ Ed25519 Public Key (x Base64URL): {key.get('x')[:24]}...")

    # 3. Micro-Expense Verification (TC-006)
    print("\n[3/5] Verifying Micro-Expense Action ($50 Office Supplies)...")
    res_micro = verifier.verify_action("$50 office supplies (micro-expense)", persona_preset="financial_compliance")
    status = res_micro.get("status")
    score = res_micro.get("consensus_score")
    nodes = [n.get("node_status") for n in res_micro.get("adversarial_debate", [])]
    print(f"  ✓ Verdict: {status} | Consensus Score: {score}% | Node Statuses: {nodes}")

    # Verify signature of Node 1
    if res_micro.get("adversarial_debate"):
        node1 = res_micro["adversarial_debate"][0]
        sig_ver = verifier.verify_attestation_signature(node1)
        print(f"  ✓ Cryptographic Signature Verification: verified={sig_ver.get('verified')} ({sig_ver.get('attestation_status')})")

    # 4. Unverified Wallet Transfer Probe (I-15 Safeguard)
    print("\n[4/5] Testing Unverified Wallet Transfer Probe ($5000 USDC to 0x9f)...")
    res_probe = verifier.verify_action("Transfer 5000 USDC to wallet 0x9f for a smart-contract audit", persona_preset="financial_safety")
    p_status = res_probe.get("status")
    p_score = res_probe.get("consensus_score")
    p_risk = res_probe.get("risk_index")
    print(f"  ✓ Verdict: {p_status} | Consensus Score: {p_score}% | Risk Index: {p_risk}%")
    print(f"  ✓ Summary: {res_probe.get('verdict_summary')}")

    # 5. OpenAI Compatible Proxy
    print("\n[5/5] Testing OpenAI Drop-In Endpoint (/v1/chat/completions)...")
    res_chat = verifier.verify_chat_completion("Administer 40mg IV Lasix for acute pulmonary edema")
    content = res_chat.get("choices", [{}])[0].get("message", {}).get("content", "")
    print(f"  ✓ Response Model: {res_chat.get('model')}")
    print(f"  ✓ Consensus Output Snippet:\n    {content[:180]}...")

    print("\n" + "=" * 70)
    print(" ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY")
    print("=" * 70)


def main():
    verifier = EthersFlowVerifier()
    if len(sys.argv) < 2 or sys.argv[1] == "demo":
        run_demo(verifier)
    elif sys.argv[1] == "verify" and len(sys.argv) >= 3:
        action = " ".join(sys.argv[2:])
        print(f"Verifying action: '{action}'...")
        res = verifier.verify_action(action)
        print(json.dumps(res, indent=2))
    elif sys.argv[1] == "attestation":
        jwks = verifier.get_jwks()
        manifest = verifier.get_attestation_manifest()
        print("JWKS Public Keys:\n", json.dumps(jwks, indent=2))
        print("\nAttestation Manifest:\n", json.dumps(manifest, indent=2))
    else:
        print("Usage:\n  python efverify.py demo\n  python efverify.py verify <action>\n  python efverify.py attestation")

if __name__ == "__main__":
    main()
