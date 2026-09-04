# Upstream API Contract & Specification Request (§4)

**Document Version:** 1.0.0  
**Authors:** EthersFlow Adoption & Calibration Working Group  
**Target Services:** EthersFlow Sovereign Gateway Core & Discovery Endpoints  
**Status:** PROPOSED & RATIFIED  

---

## 1. Executive Summary

This specification formalizes architectural enhancements, contract refinements, and discovery updates identified during the Phase C Live Calibration Run and Phase B Middleware Integration. It covers:
1. **Cross-Session Rejection & Override Protocol (`prior_rejection`)**: Bounded TTL cache and verified human `override_ticket` schema.
2. **Strict Informational Treatment of Prior Approvals (`prior_approval`)**: Mandating that prior approvals remain informational-only (§2.6.2b) and never bypass real-time deterministic safety floors.
3. **Audit Verification of Zero Data Retention (`zero_retention_applied`)**: Formalization of the boolean field in v3 payloads.
4. **Attestation Manifest Version Field Alignment (`attestation_version: "3.0"`)**: Discovery endpoints exposing explicit version strings alongside `key_id: "ef_attest_v3"`.
5. **Health Telemetry Schema Formalization**: Documenting the gateway, persistence, and alert metrics payload.

---

## 2. Cross-Session `prior_rejection` Logic & Human Override (§4.1)

### 2.1 Bounded Time Window
When an agent directive is flagged or rejected, subsequent executions of identical or canonicalized actions within the same operational scope must carry a `prior_rejection` signal.

- **Window Duration:** 15 minutes (900 seconds) default; configurable up to 60 minutes.
- **Canonical Matching:** Hashed against `canonicalSerialize(action, toolArgs)` with `SYNONYM_MAP` normalization.

### 2.2 Rejection Signal Schema
```json
{
  "prior_rejection": {
    "blocked_at": "2026-09-04T15:30:00.000Z",
    "expires_at": "2026-09-04T15:45:00.000Z",
    "reason_codes": [
      "EVIDENCE_ANCHOR_DEFICIT",
      "MANDATORY_HUMAN_OVERSIGHT_REQUIRED"
    ],
    "policy_id": "finops_default_v1",
    "session_id": "sess_8819a",
    "override_allowed": true
  }
}
```

### 2.3 `override_ticket` Schema
To clear an active `prior_rejection`, the client request MUST include a valid, structured `override_ticket` object matching enterprise ticketing provenance:

```json
{
  "override_ticket": {
    "ticket_id": "FIN-90214",
    "system": "jira",
    "authorized_by": "sec-ops-lead@enterprise.com",
    "authorization_timestamp": "2026-09-04T15:32:10.000Z",
    "justification": "Emergency hotfix procurement authorized under Incident INC-402",
    "signature": "0x3a4f89b...ed25519_sig"
  }
}
```

---

## 3. Strict Informational Treatment of `prior_approval` (§2.6.2b)

### 3.1 Architectural Invariant
An approval in a prior session or previous turn must **never** be treated as a permanent bypass or fast-path exemption for subsequent mutations.
- **Informational-Only:** The `prior_approval` field is exposed solely for telemetry and auditing.
- **Zero Bypass:** Every new mutation or financial directive must independently furnish structured anchors (`ticket`, `budget_line`, `scope`, `counterparty`) and undergo full multi-model consensus.
- **Re-Verification Floor:** If an action was approved 5 minutes ago but is resubmitted in a new context without anchors, it must be flagged under the hard floor.

---

## 4. Calibration Contract Items (§4.3)

### Item 1: `zero_retention_applied` Boolean Confirmation
To provide SOC2 Type II auditable verification that raw prompt texts and reasoning chains were purged from persistence storage engines:
- **Contract Requirement:** When `zero_retention: true` is supplied in the request, the response payload must return:
  ```json
  "zero_retention_applied": true
  ```
- **Durability Verification:** Raw `agent_action`, `reasoning_chain`, and `context` fields are replaced by SHA-256 hashes and redact markers (`[ZERO_RETENTION_REDACTED]`).

### Item 2: Attestation Manifest Discovery Versioning
Discovery endpoints (`/.well-known/attestation.json`, `/.well-known/ethersflow-attestation.json`, `/api/v1/auth/attestation-keys`) must expose both the key identifier and explicit attestation version:
- **Key ID:** `key_id: "ef_attest_v3"`
- **Version:** `attestation_version: "3.0"`
- **Key Version:** `key_version: "3.0"`
- **Algorithm:** `Ed25519-EdDSA` (RFC 8032 Pure Mode)

### Item 3: Health Telemetry Schema Documentation
The health endpoint (`/api/health`) provides rich gateway, persistence, and alert state telemetry. Downstream clients and monitoring probes should assert against the comprehensive schema:

```json
{
  "status": "ok | degraded",
  "gateway": "ok",
  "persistence": "ok | degraded",
  "persistence_alert": false,
  "alert_metrics": {
    "gauge_ethersflow_persistence_state": 0,
    "gauge_ethersflow_gateway_state": 0,
    "counter_volatile_unpersisted_writes": 0
  },
  "storage_engine": "firestore | in_memory_volatile | zero_retention_ephemeral",
  "storage_durability": "durable | volatile",
  "volatile_unpersisted_writes_count": 0,
  "version": "0.2.1",
  "revision": "ais-dev-seso5jqem3ikt27r37jaus-00004-tr4",
  "git_commit": "c1721fee892a",
  "deployed_at": "2026-08-31T14:00:00.000Z",
  "service": "EthersFlow Agent Trust Gateway",
  "fac_pipeline": "active",
  "context_binding": true,
  "attestation_enabled": true,
  "attestation_key_id": "ef_attest_v3",
  "active_consensus_models": [
    "openrouter/qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "openrouter/meta-llama/llama-3.3-70b-instruct",
    "openrouter/google/gemini-3.7-flash"
  ],
  "active_providers": ["groq", "google", "openrouter"]
}
```

---

## 5. Verification & Compliance Sign-off

- [x] Phase C Calibration live battery passed and verified (11/11 probes).
- [x] Severity-sensitive unanchored floors enforced (hazardous bare 31.5 / 88 vs benign bare 48 / 52).
- [x] Anchor checklist echoed in all verification responses.
- [x] Fail-closed middleware with `__gate_version__: 1` envelope verified.
- [x] Python parity client validated against gateway.
