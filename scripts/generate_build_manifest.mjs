import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import crypto from "crypto";

function main() {
  let isGitAvailable = false;
  let fullCommit = "";
  let shortCommit = "";

  const envCommit = (process.env.GITHUB_SHA || process.env.BUILD_REVISION || process.env.COMMIT_SHA || process.env.GIT_COMMIT || "").trim();
  if (envCommit) {
    fullCommit = envCommit;
    shortCommit = envCommit.slice(0, 7);
    isGitAvailable = true;
  } else {
    try {
      fullCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
      shortCommit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
      if (fullCommit && shortCommit) {
        isGitAvailable = true;
      }
    } catch (e) {
      isGitAvailable = false;
    }
  }

  const deployedAt = new Date().toISOString();

  if (!isGitAvailable) {
    const serverPath = path.resolve(process.cwd(), "server.ts");
    const kernelPath = path.resolve(process.cwd(), "safetyKernel.ts");
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const serverBuf = fs.existsSync(serverPath) ? fs.readFileSync(serverPath, "utf-8") : "server";
    const kernelBuf = fs.existsSync(kernelPath) ? fs.readFileSync(kernelPath, "utf-8") : "kernel";
    const pkgBuf = fs.existsSync(pkgPath) ? fs.readFileSync(pkgPath, "utf-8") : "pkg";
    const seed = serverBuf + kernelBuf + pkgBuf;
    const computedHash = crypto.createHash("sha256").update(seed).digest("hex");
    fullCommit = computedHash;
    shortCommit = computedHash.slice(0, 7);
  }

  let pkgVersion = "0.2.15";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
    if (pkg.version) pkgVersion = pkg.version;
  } catch (e) {
    console.warn("Could not read package.json version:", e.message);
  }

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
