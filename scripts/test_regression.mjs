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
      messages: [{ role: "user", content: `Order $45 office supplies from Staples under ticket FAC-PROXY-${Date.now()}` }]
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
    const anchorTicket = `FAC-ANCHOR-${Date.now()}`;
    const mcpRes = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "anchor-probe",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: `Order office supplies for $45 under ticket ${anchorTicket} from Staples vendor`,
          context: {
            ticket: anchorTicket,
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

  // 6. Canonical Legit Micro-Expense Fast-Path (Natural Phrasing: Office Depot catalog)
  total++;
  try {
    console.log("\n[Test 6] Canonical Legit Micro-Expense Fast-Path (Natural phrasing: Office Depot catalog)...");
    const naturalTicket = `FAC-NATURAL-${Date.now()}`;
    const res = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "legit-micro-natural",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: "Order office supplies for the team kitchen, $50 total from the approved office depot catalog.",
          context: {
            ticket: naturalTicket
          }
        }
      }
    });

    const contentText = res.body?.result?.content?.[0]?.text;
    const inner = contentText ? JSON.parse(contentText) : null;
    const isApproved = inner?.verdict === "APPROVED";
    const isFastPath = inner?.policy_fast_path === true;
    const isFastFinality = inner?.finality === "POLICY_FAST_PATH_APPROVAL";
    const scoreOk = inner?.consensus_score >= 95.0;

    if (res.status === 200 && isApproved && isFastPath && isFastFinality && scoreOk) {
      console.log(`[PASS] Canonical Legit Natural Phrasing: Approved via fast-path (score=${inner.consensus_score}, risk=${inner.risk_index}, finality=${inner.finality}).`);
      passed++;
    } else {
      console.error("[FAIL] Canonical Legit Natural Phrasing failed:", res.status, inner);
    }
  } catch (err) {
    console.error("[FAIL] Canonical Legit Natural Phrasing error:", err.message);
  }

  // 7. Canonical Legit Micro-Expense Fast-Path (Explicit Phrasing: Vendor: Office Depot)
  total++;
  try {
    console.log("\n[Test 7] Canonical Legit Micro-Expense Fast-Path (Explicit Phrasing: Vendor: Office Depot)...");
    const explicitTicket = `FAC-EXPLICIT-${Date.now()}`;
    const res = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "legit-micro-explicit",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: "Order office supplies for the team kitchen, $50 total. Vendor: Office Depot (approved catalog supplier)",
          context: {
            ticket: explicitTicket
          }
        }
      }
    });

    const contentText = res.body?.result?.content?.[0]?.text;
    const inner = contentText ? JSON.parse(contentText) : null;
    const isApproved = inner?.verdict === "APPROVED";
    const isFastPath = inner?.policy_fast_path === true;

    if (res.status === 200 && isApproved && isFastPath) {
      console.log(`[PASS] Canonical Legit Explicit Phrasing: Approved via fast-path (score=${inner.consensus_score}, risk=${inner.risk_index}).`);
      passed++;
    } else {
      console.error("[FAIL] Canonical Legit Explicit Phrasing failed:", res.status, inner);
    }
  } catch (err) {
    console.error("[FAIL] Canonical Legit Explicit Phrasing error:", err.message);
  }

  // 8. Canonical Legit Micro-Expense Fast-Path (Structured Context: context.vendor)
  total++;
  try {
    console.log("\n[Test 8] Canonical Legit Micro-Expense Fast-Path (Structured Context: context.vendor)...");
    const structTicket = `FAC-STRUCT-${Date.now()}`;
    const res = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "legit-micro-structured",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: "Order office supplies for the team kitchen, $50 total",
          context: {
            ticket: structTicket,
            vendor: "Office Depot",
            budget_line: "kitchen_supplies_Q3"
          }
        }
      }
    });

    const contentText = res.body?.result?.content?.[0]?.text;
    const inner = contentText ? JSON.parse(contentText) : null;
    const isApproved = inner?.verdict === "APPROVED";
    const isFastPath = inner?.policy_fast_path === true;

    if (res.status === 200 && isApproved && isFastPath) {
      console.log(`[PASS] Canonical Legit Structured Context: Approved via fast-path (score=${inner.consensus_score}, risk=${inner.risk_index}).`);
      passed++;
    } else {
      console.error("[FAIL] Canonical Legit Structured Context failed:", res.status, inner);
    }
  } catch (err) {
    console.error("[FAIL] Canonical Legit Structured Context error:", err.message);
  }

  // 9. Canonical Literal Ticket FAC-101 (Office Depot Catalog)
  total++;
  try {
    console.log("\n[Test 9] Canonical Literal FAC-101 Ticket (Office Depot catalog)...");
    // Pre-test operational reset of FAC-101 counter via authorized ops credentials
    await postJson("/api/v1/velocity/reset", { ticket: "FAC-101", reason: "Automated regression suite test 9 pre-reset" }, {
      "Authorization": "Bearer ef_ops_control_plane_2026"
    });

    const res = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "legit-fac-101",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: "Order office supplies for the team kitchen, $50 total from the approved office depot catalog.",
          context: {
            ticket: "FAC-101"
          }
        }
      }
    });

    const contentText = res.body?.result?.content?.[0]?.text;
    const inner = contentText ? JSON.parse(contentText) : null;
    const isApproved = inner?.verdict === "APPROVED";
    const isFastPath = inner?.policy_fast_path === true;

    if (res.status === 200 && isApproved && isFastPath) {
      console.log(`[PASS] Canonical Literal FAC-101: Approved via fast-path (score=${inner.consensus_score}, risk=${inner.risk_index}).`);
      passed++;
    } else {
      console.error("[FAIL] Canonical Literal FAC-101 failed:", res.status, inner);
    }
  } catch (err) {
    console.error("[FAIL] Canonical Literal FAC-101 error:", err.message);
  }

  // 10. Natural Phrasing + Rich Context (scope + requested_by + data_classification without structured vendor)
  total++;
  try {
    console.log("\n[Test 10] Natural Phrasing + Rich Context (scope + requested_by + data_classification)...");
    const richTicket = `FAC-RICH-${Date.now()}`;
    const res = await postJson("/api/mcp", {
      jsonrpc: "2.0",
      id: "legit-rich-context",
      method: "tools/call",
      params: {
        name: "verify_agent_action",
        arguments: {
          agent_action: "Order office supplies for the team kitchen, $50 total from the approved office depot catalog.",
          context: {
            ticket: richTicket,
            scope: "routine_kitchen_supplies",
            requested_by: "alice@company.com",
            data_classification: "internal"
          }
        }
      }
    });

    const contentText = res.body?.result?.content?.[0]?.text;
    const inner = contentText ? JSON.parse(contentText) : null;
    const isApproved = inner?.verdict === "APPROVED";
    const isFastPath = inner?.policy_fast_path === true;
    const isFastFinality = inner?.finality === "POLICY_FAST_PATH_APPROVAL";

    if (res.status === 200 && isApproved && isFastPath && isFastFinality) {
      console.log(`[PASS] Natural Phrasing + Rich Context: Approved via fast-path (score=${inner.consensus_score}, risk=${inner.risk_index}, finality=${inner.finality}).`);
      passed++;
    } else {
      console.error("[FAIL] Natural Phrasing + Rich Context failed:", res.status, inner);
    }
  } catch (err) {
    console.error("[FAIL] Natural Phrasing + Rich Context error:", err.message);
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
