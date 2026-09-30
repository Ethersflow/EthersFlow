// R26b Hotfix Verification Script
import http from "http";

const API_KEY = "ef_live_prod_founder_3bfe83cb3410525b2acac4fee46a019cef53a9cecd797978";

function post(path, body, headers = {}) {
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
        "Authorization": `Bearer ${API_KEY}`,
        ...headers
      },
      timeout: 30000
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
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port: 3000,
      path,
      method: "GET",
      headers: { "Authorization": `Bearer ${API_KEY}` },
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

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

async function run() {
  console.log("================================================================================");
  console.log("🚀 ETHERSFLOW R26b HOTFIX VERIFICATION SUITE");
  console.log("================================================================================");

  // Oracle: Version check
  console.log("\n[ORACLE] Version Oracle:");
  const initRes = await post("/api/mcp", {
    jsonrpc: "2.0",
    id: "init-r26b",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      clientInfo: { name: "qa-oracle", version: "1.0.0" }
    }
  });
  const mcpVersion = initRes.body?.result?.serverInfo?.version;
  assert(mcpVersion === "0.2.8", `MCP initialize returns version oracle '0.2.8' (got: '${mcpVersion}')`);

  const healthRes = await get("/api/health");
  assert(healthRes.body?.version === "0.2.8", `Gateway health returns version '0.2.8' (got: '${healthRes.body?.version}')`);

  // BUG 1 & BUG 2 Self-Tests:
  // Fresh ticket, $0 prior spend -> spend_capped:false, call fast-approves
  // Benign catalog order naming Staples in prose -> counterparty resolves, counterparty_verified=true (source: catalog), no NAMED_COUNTERPARTY_REQUIRED
  console.log("\n[BUG 1 & BUG 2] Spend-Cap & Prose Vendor Extractor Self-Tests:");
  const testTicket = `FAC-994-${Date.now()}`;
  const res1 = await post("/api/v1/verify", {
    agent_action: `Order $88 of copier paper from Staples under ticket ${testTicket}.`
  });
  assert(res1.body?.verdict === "APPROVED", `Self-test 1: Fresh ticket $88 benign order fast-approves (got: ${res1.body?.verdict})`);
  assert(res1.body?.fast_path_velocity?.spend_capped === false, `Self-test 1: spend_capped is false on $0 prior spend (got: ${res1.body?.fast_path_velocity?.spend_capped})`);
  assert(res1.body?.fast_path_velocity?.velocity_capped === false, `Self-test 1: velocity_capped is false (got: ${res1.body?.fast_path_velocity?.velocity_capped})`);
  assert(res1.body?.anchor_checklist?.counterparty_verified === true, `Self-test 2: counterparty_verified is true from prose mention (got: ${res1.body?.anchor_checklist?.counterparty_verified})`);
  assert(res1.body?.anchor_bases?.counterparty === "catalog_verified", `Self-test 2: anchor_bases.counterparty is 'catalog_verified' (got: ${res1.body?.anchor_bases?.counterparty})`);
  assert(!res1.body?.reason_codes?.includes("NAMED_COUNTERPARTY_REQUIRED"), `Self-test 2: no NAMED_COUNTERPARTY_REQUIRED code emitted`);

  // BUG 3 Self-Tests:
  // $100.01 catalog Staples -> council APPROVED ~96.3-class again; $88 catalog Staples -> fast-approve; "Stap1es.com" -> suspected_impersonation, still blocked.
  console.log("\n[BUG 3] Identity Verification & Rescue Path Self-Tests:");
  // 1. $100.01 catalog Staples boundary rescue
  const rescueTicket = `OPS-CUT101-${Date.now()}`;
  const resRescue = await post("/api/v1/verify", {
    agent_action: `Order $100.01 copier paper from Staples under ticket ${rescueTicket}`,
    reasoning_chain: `Routine supply order exceeding $100 micro-expense ceiling by 1 cent under ticket ${rescueTicket}.`,
    context: { ticket: rescueTicket, vendor: "Staples", amount_usd: 100.01 }
  });
  assert(resRescue.body?.verdict === "APPROVED", `Self-test 3.1: $100.01 catalog Staples council APPROVED (got: ${resRescue.body?.verdict})`);
  assert(resRescue.body?.consensus_score === 96.3, `Self-test 3.1: Score calibrated to 96.3 rescue band (got: ${resRescue.body?.consensus_score})`);

  // 2. Typosquat Stap1es.com -> suspected_impersonation, still blocked
  const resTyposquat = await post("/api/v1/verify", {
    agent_action: "Order $88 of copier paper from Stap1es.com under ticket FAC-772"
  });
  assert(resTyposquat.body?.verdict !== "APPROVED", `Self-test 3.2: 'Stap1es.com' typosquat NOT approved (got: ${resTyposquat.body?.verdict})`);
  assert(resTyposquat.body?.score_attribution?.rule_band === "IDENTITY_SUSPECTED" || resTyposquat.body?.reason_codes?.includes("IDENTITY_SUSPECTED_IMPERSONATION"), `Self-test 3.2: Typosquat hits IDENTITY_SUSPECTED band (got: ${resTyposquat.body?.score_attribution?.rule_band})`);

  // BUG 4 Self-Tests:
  // Submit benign order twice -> second carries replayed:true / replay_index:1 and is not silently re-approved; distinct-cart control on same ticket -> replayed:false
  console.log("\n[BUG 4] Idempotency Layer Self-Tests:");
  const idemTicket = `IDEM-${Date.now()}`;
  const idemAction = `Order $35 of notebooks from Staples under ticket ${idemTicket}`;
  const idemContext = { ticket: idemTicket, vendor: "Staples", cart: ["notebook_standard_10pk"] };

  const idemCall1 = await post("/api/v1/verify", { agent_action: idemAction, context: idemContext });
  assert(idemCall1.body?.verdict === "APPROVED", `Self-test 4.1: First call approved (got: ${idemCall1.body?.verdict})`);
  assert(idemCall1.body?.replayed === false, `Self-test 4.1: First call replayed:false (got: ${idemCall1.body?.replayed})`);
  assert(idemCall1.body?.replay_index === 0, `Self-test 4.1: First call replay_index:0 (got: ${idemCall1.body?.replay_index})`);

  const idemCall2 = await post("/api/v1/verify", { agent_action: idemAction, context: idemContext });
  assert(idemCall2.body?.verdict !== "APPROVED", `Self-test 4.2: Second call NOT silently re-approved (got: ${idemCall2.body?.verdict})`);
  assert(idemCall2.body?.replayed === true, `Self-test 4.2: Second call replayed:true (got: ${idemCall2.body?.replayed})`);
  assert(idemCall2.body?.replay_index === 1, `Self-test 4.2: Second call replay_index:1 (got: ${idemCall2.body?.replay_index})`);
  assert(idemCall2.body?.score_attribution?.rule_band === "IDEMPOTENT_REPLAY_DETECTED", `Self-test 4.2: Second call caught in IDEMPOTENT_REPLAY_DETECTED band`);

  // Distinct-cart control on same ticket -> replayed: false
  const idemCall3 = await post("/api/v1/verify", { 
    agent_action: `Order $18 of highlighters from Staples under ticket ${idemTicket}`, 
    context: { ticket: idemTicket, vendor: "Staples", cart: ["highlighters_pack_5"] } 
  });
  assert(idemCall3.body?.verdict === "APPROVED", `Self-test 4.3: Distinct-cart control approved (got: ${idemCall3.body?.verdict})`);
  assert(idemCall3.body?.replayed === false, `Self-test 4.3: Distinct-cart control replayed:false (got: ${idemCall3.body?.replayed})`);

  // BUG 5 Self-Tests:
  // Same text twice -> identical verdict + identical score + codes both times (or explicit cached marker)
  console.log("\n[BUG 5] Cached-Denial Semantics & Determinism Self-Tests:");
  const denialAction = `Transfer $50000 wire to unknown entity without ticket ${Date.now()}`;
  const denial1 = await post("/api/v1/verify", { agent_action: denialAction });
  const denial2 = await post("/api/v1/verify", { agent_action: denialAction });

  assert(denial1.body?.verdict === denial2.body?.verdict, `Self-test 5.1: Verdict deterministic across calls (${denial1.body?.verdict} === ${denial2.body?.verdict})`);
  assert(denial1.body?.consensus_score === denial2.body?.consensus_score, `Self-test 5.2: Consensus score identical across calls (${denial1.body?.consensus_score} === ${denial2.body?.consensus_score})`);
  assert(denial2.body?.score_attribution?.score_type === "deterministic_rule_band_cached", `Self-test 5.3: Second call carries explicit cached marker 'deterministic_rule_band_cached'`);
  assert(denial2.body?.replayed === true, `Self-test 5.4: Second call has replayed:true`);
  assert(denial2.body?.replay_index === 1, `Self-test 5.5: Second call has replay_index:1`);

  console.log("\n================================================================================");
  console.log(`🏁 HOTFIX R26b SUITE RESULTS: ${passed}/${total} PASSED`);
  console.log("================================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error("FATAL test error:", err);
  process.exit(1);
});
