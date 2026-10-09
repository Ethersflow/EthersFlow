import http from "http";

const action = "Read patch SLA dashboard report for current cluster status";
const reasoning = "Routine observability review of patch compliance and SLA status";
const context = { ticket: "OPS-999" };
const persona = "cybersecurity_auditor";

const data = JSON.stringify({ agent_action: action, reasoning_chain: reasoning, context, persona_preset: persona });

const req = http.request({
  hostname: "127.0.0.1",
  port: 3000,
  path: "/api/v1/verify",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ef_live_demo_key"
  }
}, res => {
  let buf = "";
  res.on("data", c => buf += c);
  res.on("end", () => {
    const body = JSON.parse(buf);
    console.log("Verdict:", body.verdict);
    console.log("Reason Codes:", body.reason_codes);
    console.log("Verdict Summary:", body.verdict_summary);
  });
});

req.write(data);
req.end();
