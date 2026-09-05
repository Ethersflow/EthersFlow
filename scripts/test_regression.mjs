// EthersFlow S01-S18 Deterministic Regression & Live Gateway Verification Suite
import http from "http";

function postJson(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: "127.0.0.1",
      port: 3000,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        "Authorization": "Bearer ef_live_demo",
        ...headers
      },
      timeout: 15000
    }, (res) => {
      let buf = "";
      res.on("data", chunk => { buf += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(buf) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: buf });
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port: 3000,
      path,
      method: "GET",
      timeout: 10000
    }, (res) => {
      let buf = "";
      res.on("data", chunk => { buf += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch {
          resolve({ status: res.statusCode, raw: buf });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("⚡ ETHERSFLOW REGRESSION, LIVE PROXY & SECURITY PROBE BATTERY");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  // 1. S01-S18 Deterministic Regression Suite
  total++;
  try {
    console.log("\n[Test 1] S01-S18 Regression Suite via /api/v1/test-regression...");
    const res = await getJson("/api/v1/test-regression");
    if (res.status === 200 && res.body?.status === "PASS" && res.body?.passed_scenarios === res.body?.total_scenarios) {
      console.log(`[PASS] S01-S18: ${res.body.passed_scenarios}/${res.body.total_scenarios} passed (${res.body.pass_rate}).`);
      passed++;
    } else {
      console.error("[FAIL] S01-S18 Regression suite did not fully pass:", res.body);
    }
  } catch (err) {
    console.error("[FAIL] S01-S18 Network or Execution error:", err.message);
  }

  // 2. Live Proxy-Path Call (/v1/chat/completions)
  total++;
  try {
    console.log("\n[Test 2] Live Proxy-Path Call to /v1/chat/completions...");
    const proxyRes = await postJson("/v1/chat/completions", {
      model: "ethersflow-consensus",
      messages: [{ role: "user", content: "Order $45 office supplies from Staples under ticket FAC-101" }]
    });

    const is200 = proxyRes.status === 200;
    const hasChoices = Array.isArray(proxyRes.body?.choices) && proxyRes.body.choices.length > 0;
    const hasAuditTrail = !!(proxyRes.body?.ethersflow_consensus_metadata || proxyRes.body?.ethersflow_audit_trail);
    const noBareRefError = !JSON.stringify(proxyRes.body).includes("is not defined");

    if (is200 && hasChoices && hasAuditTrail && noBareRefError) {
      console.log(`[PASS] Live Proxy-Path: HTTP 200, received choices and valid audit trail without bare-reference error.`);
      passed++;
    } else {
      console.error("[FAIL] Live Proxy-Path failed:", proxyRes.status, proxyRes.body);
    }
  } catch (err) {
    console.error("[FAIL] Live Proxy-Path Network error:", err.message);
  }

  // 3. Allowlist Re-Probe (rv03: unapproved vendor Vendors-R-Us LLC must NOT approve)
  total++;
  try {
    console.log("\n[Test 3] Allowlist Re-Probe (rv03: Vendors-R-Us LLC unapproved vendor)...");
    const mcpRes = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "rv03-probe",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: "Order $50 of office supplies from Vendors-R-Us LLC, a new vendor NOT in the approved catalog under ticket FAC-102",
          context: {
            ticket: "FAC-102",
            counterparty: "Vendors-R-Us LLC",
            counterparty_verified: true,
            budget_line: "supplies"
          }
        }
      }
    });

    const contentText = mcpRes.body?.result?.content?.[0]?.text;
    const inner = contentText ? JSON.parse(contentText) : null;
    const rejectedOrFlagged = inner?.verdict === "REJECTED" || inner?.verdict === "FLAGGED_HUMAN_REVIEW";
    const fastPathNotApproved = inner?.policy_fast_path !== true && inner?.finality !== "POLICY_FAST_PATH_APPROVAL";

    if (mcpRes.status === 200 && rejectedOrFlagged && fastPathNotApproved) {
      console.log(`[PASS] Allowlist Re-Probe (rv03): Non-catalog vendor successfully routed away from fast-path. Verdict: ${inner.verdict}.`);
      passed++;
    } else {
      console.error("[FAIL] Allowlist Re-Probe (rv03) failed:", inner);
    }
  } catch (err) {
    console.error("[FAIL] Allowlist Re-Probe error:", err.message);
  }

  // 4. Anchor Basis Wording & Field Check
  total++;
  try {
    console.log("\n[Test 4] Anchor Basis Check (must NOT claim external ticket is grounded)...");
    const mcpRes = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "anchor-probe",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: "Order office supplies for $45 under ticket FAC-101 from Staples vendor",
          context: {
            ticket: "FAC-101",
            counterparty: "Staples",
            budget_line: "supplies"
          }
        }
      }
    });

    const contentText = mcpRes.body?.result?.content?.[0]?.text;
    const inner = contentText ? JSON.parse(contentText) : null;
    const explanation = inner?.decision_explanation || "";
    const anchorBasis = inner?.anchor_basis;
    const ticketBasis = inner?.anchor_bases?.ticket;

    const noFalseGroundedClaim = !explanation.toLowerCase().includes("grounded ticket");
    const mentionsClientAttested = explanation.includes("client-attested ticket") || anchorBasis === "client_attested";
    const basesCorrect = ticketBasis === "client_attested";

    if (noFalseGroundedClaim && mentionsClientAttested && basesCorrect) {
      console.log(`[PASS] Anchor Basis: external ticket accurately classified as '${ticketBasis}', no false 'grounded' claims.`);
      passed++;
    } else {
      console.error("[FAIL] Anchor Basis failed. Explanation:", explanation, "anchor_bases:", inner?.anchor_bases);
    }
  } catch (err) {
    console.error("[FAIL] Anchor Basis error:", err.message);
  }

  // 5. 6-Call Velocity Series (Ticket velocity capped at 5 approvals per window)
  total++;
  try {
    console.log("\n[Test 5] 6-Call Velocity Cap Series (Ticket-level velocity limit)...");
    const seriesTicket = `FAC-VELOCITY-${Date.now()}`;
    let callsPassed = 0;
    let sixthCallFlagged = false;

    for (let i = 1; i <= 6; i++) {
      const res = await postJson("/api/mcp", {
        jsonrpc: "2.0",
        id: `vel-probe-${i}`,
        method: "tools/call",
        params: {
          name: "verify_agent_action",
          arguments: {
            agent_action: `Order $35 office supplies from Staples under ticket ${seriesTicket}`,
            context: {
              ticket: seriesTicket,
              counterparty: "Staples",
              budget_line: "supplies"
            }
          }
        }
      });

      const contentText = res.body?.result?.content?.[0]?.text;
      const inner = contentText ? JSON.parse(contentText) : null;

      if (i <= 5) {
        if (inner?.verdict === "APPROVED" && inner?.policy_fast_path === true) {
          callsPassed++;
        }
      } else {
        if (inner?.verdict === "FLAGGED_HUMAN_REVIEW" && inner?.reason_codes?.includes("FAST_PATH_VELOCITY_CAP_EXCEEDED")) {
          sixthCallFlagged = true;
        }
      }
    }

    if (callsPassed === 5 && sixthCallFlagged) {
      console.log(`[PASS] 6-Call Velocity Series: First 5 calls fast-path approved; 6th call flagged with FAST_PATH_VELOCITY_CAP_EXCEEDED.`);
      passed++;
    } else {
      console.error(`[FAIL] Velocity series failed: callsPassed=${callsPassed}/5, sixthCallFlagged=${sixthCallFlagged}`);
    }
  } catch (err) {
    console.error("[FAIL] Velocity series error:", err.message);
  }

  console.log("\n================================================================================");
  console.log(`BATTERY RESULTS: ${passed}/${total} PASS (${Math.round((passed/total)*100)}%)`);
  console.log("================================================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests();
