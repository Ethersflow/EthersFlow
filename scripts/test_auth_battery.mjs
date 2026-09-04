// EthersFlow Auth Battery & Regression Test Suite
import http from "http";

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
    req.end();
  });
}

async function runAuthBattery() {
  console.log("================================================================================");
  console.log("⚡ ETHERSFLOW AUTH BATTERY & REGRESSION SUITE (P0 AUTH GATE VERIFICATION)");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  // Test 1: Missing Authorization Header
  total++;
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/verify",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, { agent_action: "Test benign action" });

    const is401 = res.status === 401;
    const hasErrorCode = res.body?.error_code === "MISSING_AUTHORIZATION" || res.body?.error === "Unauthorized";
    if (is401 && hasErrorCode) {
      console.log(`[PASS] Case 1 (Missing Auth): Status ${res.status}, error_code=${res.body?.error_code}`);
      passed++;
    } else {
      console.error(`[FAIL] Case 1 (Missing Auth): Status ${res.status}`, res.body);
    }
  } catch (err) {
    console.error(`[FAIL] Case 1 (Missing Auth): Network error`, err);
  }

  // Test 2: Garbage Token
  total++;
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/verify",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer xyz_garbage_bad_token"
      }
    }, { agent_action: "Test benign action" });

    const is401 = res.status === 401;
    const hasErrorCode = res.body?.error_code === "INVALID_API_KEY";
    if (is401 && hasErrorCode) {
      console.log(`[PASS] Case 2 (Garbage Token): Status ${res.status}, error_code=${res.body?.error_code}`);
      passed++;
    } else {
      console.error(`[FAIL] Case 2 (Garbage Token): Status ${res.status}`, res.body);
    }
  } catch (err) {
    console.error(`[FAIL] Case 2 (Garbage Token): Network error`, err);
  }

  // Test 3 (S02 Regression): Fabricated ef_live_ key (ef_live_INVALIDKEY0000000000000000)
  total++;
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/verify",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ef_live_INVALIDKEY0000000000000000"
      }
    }, { agent_action: "Disburse USD 18,450 to NorthStar Logistics under PO-8841" });

    const is401 = res.status === 401;
    const hasErrorCode = res.body?.error_code === "INVALID_API_KEY";
    if (is401 && hasErrorCode) {
      console.log(`[PASS] Case 3 (S02 Fabricated ef_live_ key): Status ${res.status}, error_code=${res.body?.error_code}`);
      passed++;
    } else {
      console.error(`[FAIL] Case 3 (S02 Fabricated ef_live_ key): Status ${res.status}`, res.body);
    }
  } catch (err) {
    console.error(`[FAIL] Case 3 (S02 Fabricated ef_live_ key): Network error`, err);
  }

  // Test 4: Fabricated ef_live_ key with empty action (should reject with 401 NOT 400)
  total++;
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/verify",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ef_live_FAKETHISKEYDOESNOTEXIST"
      }
    }, { agent_action: "" });

    const is401 = res.status === 401;
    const hasErrorCode = res.body?.error_code === "INVALID_API_KEY";
    if (is401 && hasErrorCode) {
      console.log(`[PASS] Case 4 (Fabricated ef_live_ with empty action -> 401): Status ${res.status}, error_code=${res.body?.error_code}`);
      passed++;
    } else {
      console.error(`[FAIL] Case 4: Status ${res.status} (expected 401, got ${res.status})`, res.body);
    }
  } catch (err) {
    console.error(`[FAIL] Case 4: Network error`, err);
  }

  // Test 5: Allowlisted Demo Key with benign action -> 200 APPROVED
  total++;
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/verify",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ef_live_demo"
      }
    }, {
      agent_action: "Disburse USD 18,450 to NorthStar Logistics under purchase order PO-8841 (Invoice INV-2026-0818)",
      reasoning_chain: "Purchase order PO-8841 is approved, matches the approved vendor master, goods-received record is present, and no sanctions or duplicate-invoice flags are present.",
      persona_preset: "financial_compliance"
    });

    const is200 = res.status === 200;
    const isApproved = res.body?.verdict === "APPROVED" && res.body?.action_eligible === true;
    if (is200 && isApproved) {
      console.log(`[PASS] Case 5 (Allowlisted Demo Key): Status ${res.status}, verdict=${res.body?.verdict}, verified=${res.body?.verified}`);
      passed++;
    } else {
      console.error(`[FAIL] Case 5 (Allowlisted Demo Key): Status ${res.status}`, res.body);
    }
  } catch (err) {
    console.error(`[FAIL] Case 5 (Allowlisted Demo Key): Network error`, err);
  }

  // Test 6: Check /api/v1/test-regression endpoint
  total++;
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/v1/test-regression",
      method: "GET"
    });

    const isPass = res.status === 200 && res.body?.status === "PASS" && res.body?.passed_scenarios >= 11;
    if (isPass) {
      console.log(`[PASS] Case 6 (Regression Endpoint S01-S11): Status ${res.body?.status}, passed ${res.body?.passed_scenarios}/${res.body?.total_scenarios}`);
      passed++;
    } else {
      console.error(`[FAIL] Case 6 (Regression Endpoint):`, res.body);
    }
  } catch (err) {
    console.error(`[FAIL] Case 6 (Regression Endpoint): Network error`, err);
  }

  console.log("================================================================================");
  console.log(`SUMMARY: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runAuthBattery();
