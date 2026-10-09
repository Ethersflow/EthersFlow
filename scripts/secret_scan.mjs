import fs from "fs";
import path from "path";

function main() {
  console.log("[Secret Scanner] Scanning codebase for leaked live API keys, hardcoded secrets, and unsafe secret fallbacks...");
  const patterns = [
    { name: "Live Founder Key", regex: /ef_live_prod_founder_[a-f0-9]{32,}/i },
    { name: "Live Secondary Key", regex: /ef_live_prod_secondary_[a-f0-9]{8,}/i },
    { name: "AWS Key ID", regex: /AKIA[0-9A-Z]{16}/ },
    { name: "PEM Private Key", regex: /-----BEGIN\s+PRIVATE\s+KEY-----/ },
    { name: "Hardcoded Attestation Fallback Secret", regex: /process\.env\.ETHERSFLOW_ATTESTATION_SECRET\s*\|\|\s*["'][^"']*["']/i },
    { name: "Hardcoded Secret / Passcode Fallback Pattern", regex: /process\.env\.[A-Z0-9_]*(?:SECRET|PRIVATE_KEY|TOKEN|PASSCODE|PASSWORD|API_KEY)\s*\|\|\s*["'][^"']{3,}["']/i }
  ];

  let violations = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === "dist" || e.name === "secret_scan.mjs") continue;
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        scanDir(fullPath);
      } else if (e.isFile()) {
        const content = fs.readFileSync(fullPath, "utf8");
        for (const p of patterns) {
          const match = content.match(p.regex);
          if (match) {
            const lineNo = content.slice(0, match.index).split("\n").length;
            violations.push({ path: fullPath, patternName: p.name, pattern: p.regex.toString(), matchText: match[0], lineNo });
          }
        }
      }
    }
  }

  scanDir(process.cwd());

  if (violations.length > 0) {
    console.error("[Secret Scanner] FAILED: Potential live secrets, private keys, or unsafe fallback defaults detected:");
    for (const v of violations) {
      console.error(` - ${v.path}:${v.lineNo} [${v.patternName}] matched '${v.matchText}'`);
    }
    process.exit(1);
  } else {
    console.log("[Secret Scanner] PASSED: No live secrets, private keys, or unsafe fallback defaults detected.");
  }
}

main();
