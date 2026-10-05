import fs from "fs";
import { execSync } from "child_process";
import path from "path";

function main() {
  let fullCommit = "bde98d5756518a5b4f5c1c8f83a174ab96a4624b";
  let shortCommit = "bde98d5";
  try {
    const existing = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "build_manifest.json"), "utf-8"));
    if (existing.full_commit) fullCommit = existing.full_commit;
    if (existing.git_commit) shortCommit = existing.git_commit;
  } catch (e) {}
  try {
    fullCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    shortCommit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch (e) {
    // Keep existing or default commit
  }

  let pkgVersion = "0.2.12";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
    if (pkg.version) pkgVersion = pkg.version;
  } catch (e) {
    console.warn("Could not read package.json version:", e.message);
  }

  const deployedAt = new Date().toISOString();
  const revision = shortCommit;
  const councilBundle = `sha256-v${pkgVersion}-${shortCommit}`;

  const manifest = {
    version: pkgVersion,
    revision: revision,
    git_commit: shortCommit,
    full_commit: fullCommit,
    deployed_at: deployedAt,
    council_bundle: councilBundle
  };

  fs.writeFileSync(path.resolve(process.cwd(), "build_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("[Build Manifest Generated]", manifest);
}

main();
