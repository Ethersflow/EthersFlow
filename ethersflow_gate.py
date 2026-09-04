#!/usr/bin/env python3
"""
ethersflow_gate.py — Python Parity Client for EthersFlow Hard-Gate Core (§2 + §2.6)
Provides identical model-blind core, canonical serialization, high-risk verb synonym mapping,
session block-memory, and fail-closed deny-by-default execution.
"""

import json
import time
import urllib.request
import urllib.error
import hashlib
import re
from typing import Dict, Any, Optional, List, Tuple

GATE_VERSION = 1

SYNONYM_MAP = {
    # Financial movement -> wire
    "disburse": "wire",
    "remit": "wire",
    "send_funds": "wire",
    "send_money": "wire",
    "pay": "wire",
    "transfer": "wire",
    "payout": "wire",
    # Destructive data mutations -> delete
    "erase": "delete",
    "remove": "delete",
    "destroy": "delete",
    "drop": "delete",
    "truncate": "delete",
    "purge": "delete",
    # Privilege escalation -> grant_admin
    "elevate": "grant_admin",
    "escalate": "grant_admin",
    "make_admin": "grant_admin",
    "sudo": "grant_admin",
    "promote": "grant_admin",
    # Arbitrary execution -> run_command
    "execute": "run_command",
    "shell": "run_command",
    "spawn": "run_command",
    "eval": "run_command",
    "system": "run_command"
}

def normalize_high_risk_verbs(text: str) -> str:
    if not text:
        return ""
    normalized = text
    for synonym, canonical in SYNONYM_MAP.items():
        pattern = re.compile(rf"\b{re.escape(synonym)}\b", re.IGNORECASE)
        normalized = pattern.sub(canonical, normalized)
    return normalized

def canonical_serialize(input_data: Any) -> str:
    if input_data is None:
        return "null"
    if isinstance(input_data, str):
        return json.dumps(normalize_high_risk_verbs(input_data.strip()))
    if isinstance(input_data, bool):
        return "true" if input_data else "false"
    if isinstance(input_data, (int, float)):
        return str(input_data)
    if isinstance(input_data, (list, tuple)):
        items = [canonical_serialize(item) for item in input_data]
        return f"[{','.join(items)}]"
    if isinstance(input_data, dict):
        sorted_keys = sorted(input_data.keys())
        entries = [f'"{k}":{canonical_serialize(input_data[k])}' for k in sorted_keys]
        return f"{{{','.join(entries)}}}"
    return json.dumps(input_data, sort_keys=True)

def canonical_hash(input_data: Any) -> str:
    serialized = canonical_serialize(input_data)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

class SessionBlockMemory:
    def __init__(self, ttl_minutes: int = 15, max_capacity: int = 500):
        self.ttl_seconds = ttl_minutes * 60
        self.max_capacity = max_capacity
        self.memory: Dict[str, Dict[str, Any]] = {}

    def record_block(self, action_or_args: Any, verdict: Dict[str, Any], explanation: str) -> Dict[str, Any]:
        h = canonical_hash(action_or_args)
        now = time.time()
        if len(self.memory) >= self.max_capacity:
            oldest_key = next(iter(self.memory.keys()))
            del self.memory[oldest_key]

        entry = {
            "canonical_action": canonical_serialize(action_or_args),
            "action_hash": h,
            "blocked_at": now,
            "expires_at": now + self.ttl_seconds,
            "reason_codes": verdict.get("reason_codes", ["SESSION_PREVIOUSLY_BLOCKED"]),
            "explanation": explanation,
            "missing_anchors": verdict.get("anchor_checklist", {}).get("missing_anchors", []),
            "verdict": verdict
        }
        self.memory[h] = entry
        return entry

    def check_block(self, action_or_args: Any) -> Optional[Dict[str, Any]]:
        h = canonical_hash(action_or_args)
        entry = self.memory.get(h)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            del self.memory[h]
            return None
        return entry

def generate_session_block_context(entry: Dict[str, Any]) -> str:
    missing = entry.get("missing_anchors", [])
    missing_str = f" Missing anchors: [{', '.join(missing)}]." if missing else ""
    codes = entry.get("reason_codes", [])
    codes_str = f" Reason codes: [{', '.join(codes)}]." if codes else ""
    return f"[ETHERSFLOW_BLOCK] Action previously blocked in this session.{codes_str}{missing_str} Instruction: Review context, provide valid ticket/budget anchors, or obtain human override."

class EthersflowGate:
    def __init__(
        self,
        api_key: str,
        base_url: str = "http://127.0.0.1:3000",
        mode: str = "hard",
        policy_id: str = "default_enterprise_safety_v1",
        timeout_seconds: float = 8.0
    ):
        if not api_key:
            raise ValueError("api_key is required")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.mode = mode
        self.policy_id = policy_id
        self.timeout_seconds = timeout_seconds
        self.version = GATE_VERSION

    def evaluate(
        self,
        action_text: str,
        reasoning_chain: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        zero_retention: bool = True
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1/verify"
        payload = json.dumps({
            "agent_action": action_text,
            "reasoning_chain": reasoning_chain or f"Evaluated via Python EthersflowGate v{self.version}",
            "context": context,
            "zero_retention": zero_retention,
            "policy_id": self.policy_id
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "X-Gate-Version": str(self.version)
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as response:
                body = json.loads(response.read().decode("utf-8"))
                decision = body.get("verdict") or body.get("decision") or "REJECTED"
                if decision == "APPROVED":
                    return {
                        "status": "allowed",
                        "verdict": body,
                        "reason": body.get("decision_explanation") or "Approved"
                    }
                return {
                    "status": "blocked",
                    "verdict": body,
                    "reason": body.get("decision_explanation") or "Blocked by EthersFlow policy"
                }
        except Exception as e:
            # Fail closed deny-by-default
            return {
                "status": "blocked",
                "verdict": {
                    "verdict": "REJECTED",
                    "reason_codes": ["FAIL_CLOSED_DENY_BY_DEFAULT"],
                    "decision_explanation": f"Gateway error: {str(e)}"
                },
                "reason": f"Fail closed deny-by-default: {str(e)}"
            }
