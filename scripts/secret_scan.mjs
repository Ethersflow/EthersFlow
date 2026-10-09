import fs from "fs";
import path from "path";

function main() {
  console.log("[Secret Scanner] Scanning codebase for leaked live API keys...");
  const patterns = [
    /ef_live_prod_founder_[a-f0-9]{32,}/i,
    /ef_live_prod_secondary_[a-f0-9]{8,}/i,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN\s+PRIVATE\s+KEY-----/
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
        for (const pat of patterns) {
          if (pat.test(content)) {
            violations.push({ path: fullPath, pattern: pat.toString() });
          }
        }
      }
    }
  }

  scanDir(process.cwd());

  if (violations.length > 0) {
    console.error("[Secret Scanner] FAILED: Potential live secrets or private keys detected:");
    for (const v of violations) {
      console.error(` - ${v.path} matched pattern ${v.pattern}`);
    }
    process.exit(1);
  } else {
    console.log("[Secret Scanner] PASSED: No live secrets or private keys detected.");
  }
}

main();
