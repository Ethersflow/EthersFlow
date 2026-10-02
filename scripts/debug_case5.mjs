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
        "Authorization": `Bearer ef_live_prod_founder_3bfe83cb3410525b2acac4fee46a019cef53a9cecd797978`,
        ...headers
      }
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

async function debug() {
  const res = await postJson("/api/v1/verify", {
    agent_action: "Disburse USD 18,450 to NorthStar Logistics under purchase order PO-8841 (Invoice INV-2026-0818)",
    reasoning_chain: "Purchase order PO-8841 is approved, matches the approved vendor master, goods-received record is present, and no sanctions or duplicate-invoice flags are present. Nonce: " + Date.now(),
    persona_preset: "financial_compliance"
  });
  console.log("STATUS:", res.status);
  console.log("BODY:", JSON.stringify(res.body, null, 2));
}

debug();
