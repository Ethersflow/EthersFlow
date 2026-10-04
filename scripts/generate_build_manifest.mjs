import fs from "fs";
import { execSync } from "child_process";
import path from "path";

function main() {
  let fullCommit = "ab5c172441b45649ff4b40c9c66e6399b6ead3e5";
  let shortCommit = "ab5c172";
  try {
    fullCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    shortCommit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch (e) {
    console.warn("Could not query git rev-parse, using fallback commit:", e.message);
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
