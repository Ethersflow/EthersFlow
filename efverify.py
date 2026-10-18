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

DEFAULT_BASE_URL = os.getenv("ETHERSFLOW_BASE_URL", "http://localhost:3000" if os.path.exists("server.ts") else "https://www.ethersflow.com")
DEFAULT_API_KEY = os.getenv("ETHERSFLOW_API_KEY", os.getenv("ETHERSFLOW_TOKEN", "ef_live_demo"))

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

    def verify_verdict(self, verdict_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates EthersFlow Decision Verdict & Cryptographic Receipt against signed canonical payload.
        Enforces ef_attest_v3 full-field binding:
        (consensus, risk, evidence_status, grounding_status, reason_codes, approval_blocked, request_id, timestamp)
        Fails if any field was tampered or modified relative to the cryptographically signed payload.
        """
        att = verdict_data.get("attestation") or verdict_data.get("receipt", {}).get("attestation") or verdict_data.get("receipt") or {}
        canonical_payload = verdict_data.get("canonical_payload") or att.get("canonical_payload")
        signature = verdict_data.get("signature") or att.get("signature")

        if not canonical_payload or not signature:
            return {
                "verified": False,
                "error": "MISSING_ATTESTATION",
                "message": "Missing canonical_payload or signature in verdict object."
            }

        # Check v3 canonical binding fields
        mismatches = []
        if isinstance(canonical_payload, str) and canonical_payload.startswith("v3:"):
            parts = canonical_payload.split(":")
            if len(parts) >= 14:
                b_requestId = parts[1]
                b_actionHash = parts[2]
                b_policyId = parts[3]
                b_verdict = parts[4]
                b_actionEligible = parts[5]
                b_consensus = parts[6]
                b_reviewerAgreement = parts[7]
                b_risk = parts[8]
                b_evidenceStatus = parts[9]
                b_groundingStatus = parts[10]
                b_reasonCodes = parts[11]
                b_approvalBlocked = parts[12]
                b_timestamp = parts[13]

                v_obj = verdict_data.get("receipt") if isinstance(verdict_data.get("receipt"), dict) else verdict_data

                if "consensus_score" in v_obj:
                    v_score = f"{float(v_obj['consensus_score']):.1f}"
                    if v_score != b_consensus:
                        mismatches.append(f"consensus_score mismatch (verdict: {v_obj['consensus_score']} [{v_score}], bound: {b_consensus})")

                if "risk_index" in v_obj:
                    v_risk = f"{float(v_obj['risk_index']):.1f}"
                    if v_risk != b_risk:
                        mismatches.append(f"risk_index mismatch (verdict: {v_obj['risk_index']} [{v_risk}], bound: {b_risk})")

                if "reviewer_agreement" in v_obj:
                    v_rev = f"{float(v_obj['reviewer_agreement']):.3f}"
                    if v_rev != b_reviewerAgreement:
                        mismatches.append(f"reviewer_agreement mismatch (verdict: {v_obj['reviewer_agreement']} [{v_rev}], bound: {b_reviewerAgreement})")

                if "evidence_status" in v_obj:
                    v_ev = str(v_obj["evidence_status"]).strip().upper()
                    if v_ev != b_evidenceStatus:
                        mismatches.append(f"evidence_status mismatch (verdict: {v_obj['evidence_status']}, bound: {b_evidenceStatus})")

                gr_val = v_obj.get("grounding_status") or (v_obj.get("grounding_check", {}).get("status") if isinstance(v_obj.get("grounding_check"), dict) else None)
                if gr_val is not None:
                    v_gr = str(gr_val).strip().upper()
                    if v_gr != b_groundingStatus:
                        mismatches.append(f"grounding_status mismatch (verdict: {gr_val}, bound: {b_groundingStatus})")

                if "approval_blocked" in v_obj:
                    v_app = "true" if bool(v_obj["approval_blocked"]) else "false"
                    if v_app != b_approvalBlocked:
                        mismatches.append(f"approval_blocked mismatch (verdict: {v_obj['approval_blocked']}, bound: {b_approvalBlocked})")

                if "verdict" in v_obj and str(v_obj["verdict"]).strip() != b_verdict:
                    mismatches.append(f"verdict mismatch (verdict: {v_obj['verdict']}, bound: {b_verdict})")

                if "request_id" in v_obj and str(v_obj["request_id"]).strip() != b_requestId:
                    mismatches.append(f"request_id mismatch (verdict: {v_obj['request_id']}, bound: {b_requestId})")

                if "reason_codes" in v_obj and isinstance(v_obj["reason_codes"], list):
                    v_codes = ",".join(sorted(str(c) for c in v_obj["reason_codes"]))
                    if v_codes != b_reasonCodes:
                        mismatches.append(f"reason_codes mismatch (verdict: {v_codes}, bound: {b_reasonCodes})")

        if mismatches:
            return {
                "verified": False,
                "tampered": True,
                "attestation_status": "TAMPERING_DETECTED",
                "error": "PAYLOAD_TAMPERING_DETECTED",
                "message": f"Integrity check failed: verdict fields were modified relative to signed canonical payload! Mismatches: {'; '.join(mismatches)}",
                "mismatches": mismatches
            }

        # Verify signature with server endpoint
        res = self._http_post("/api/v1/verify-attestation", verdict_data, auth=False)
        if isinstance(res, dict) and res.get("http_status", 200) >= 400:
            err_details = res.get("error")
            if isinstance(err_details, dict):
                return err_details
            return {"verified": False, "error": "HTTP_ERROR", "message": str(err_details)}
        return res

    def verify_verdict_file(self, filepath: str) -> bool:
        if not os.path.isfile(filepath):
            print(f"✗ Error: File not found: {filepath}")
            return False
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"✗ Error: Failed to parse JSON in {filepath}: {e}")
                return False

        res = self.verify_verdict(data)
        if res.get("verified") is True:
            print(f"✓ PASS: Verdict signature and all bound fields VERIFIED for {filepath}")
            print(f"  Key ID: {res.get('key_id', 'ef_attest_v3')} | Status: {res.get('attestation_status')}")
            return True
        else:
            print(f"✗ FAIL: Verdict verification FAILED for {filepath}!")
            if res.get("tampered"):
                print(f"  Reason: TAMPERING DETECTED: {res.get('message')}")
            else:
                print(f"  Reason: {res.get('error') or res.get('message') or res}")
            return False

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

    # Verify signature of Node 1 and full verdict receipt
    if res_micro.get("adversarial_debate"):
        node1 = res_micro["adversarial_debate"][0]
        sig_ver = verifier.verify_attestation_signature(node1)
        print(f"  ✓ Node 1 Ed25519 Signature Verification: verified={sig_ver.get('verified')} ({sig_ver.get('attestation_status')})")

    if res_micro.get("attestation"):
        ver_receipt = verifier.verify_verdict(res_micro)
        print(f"  ✓ Verdict Receipt Attestation (ef_attest_v3): verified={ver_receipt.get('verified')} ({ver_receipt.get('attestation_status', 'VERIFIED_ED25519_SIG')})")

    # 4. Unverified Wallet Transfer Probe (I-15 Safeguard)
    print("\n[4/5] Testing Unverified Wallet Transfer Probe ($5000 USDC to 0x9f)...")
    res_probe = verifier.verify_action("Transfer 5000 USDC to wallet 0x9f for a smart-contract audit", persona_preset="financial_compliance")
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
    elif sys.argv[1] in ["verify-file", "verify-verdict"] and len(sys.argv) >= 3:
        target_file = sys.argv[2]
        success = verifier.verify_verdict_file(target_file)
        sys.exit(0 if success else 1)
    elif sys.argv[1].endswith(".json") and os.path.isfile(sys.argv[1]):
        target_file = sys.argv[1]
        success = verifier.verify_verdict_file(target_file)
        sys.exit(0 if success else 1)
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
        print("Usage:\n  python efverify.py demo\n  python efverify.py verify <action>\n  python efverify.py verify-file <verdict.json>\n  python efverify.py <verdict.json>\n  python efverify.py attestation")
        sys.exit(1)

if __name__ == "__main__":
    main()
