import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function getAllTsFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("Security Invariants & Static Code Audit", () => {
  const capabilitiesDir = path.resolve(__dirname, "../../src/capabilities");
  const coreDir = path.resolve(__dirname, "../../src/core");
  const capabilityFiles = getAllTsFiles(capabilitiesDir);
  const coreFiles = getAllTsFiles(coreDir);
  const allScopedFiles = [...capabilityFiles, ...coreFiles];

  it("found all capability implementation files for audit", () => {
    expect(capabilityFiles.length).toBeGreaterThanOrEqual(15);
  });

  it("verifies zero dynamic code evaluation (eval / Function constructor)", () => {
    for (const file of allScopedFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toMatch(/\beval\s*\(/);
      expect(content).not.toMatch(/new\s+Function\s*\(/);
    }
  });

  it("verifies zero child process spawning in capabilities and core", () => {
    for (const file of allScopedFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toContain("child_process");
      expect(content).not.toContain("execSync");
      expect(content).not.toContain("spawnSync");
      expect(content).not.toContain("execFile");
    }
  });

  it("verifies zero arbitrary filesystem access in capabilities", () => {
    for (const file of capabilityFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toContain("node:fs");
      expect(content).not.toContain("'fs'");
      expect(content).not.toContain('"fs"');
      expect(content).not.toContain("fs/promises");
      expect(content).not.toContain("readFile");
      expect(content).not.toContain("writeFile");
    }
  });

  it("verifies zero outbound network calls in capabilities", () => {
    for (const file of capabilityFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toMatch(/\bfetch\s*\(/);
      expect(content).not.toContain("node:http");
      expect(content).not.toContain("node:https");
      expect(content).not.toContain("node:net");
      expect(content).not.toContain("node:dgram");
      expect(content).not.toContain("axios");
    }
  });

  it("verifies zero telemetry, analytics, or tracking SDK packages imported", () => {
    const srcDir = path.resolve(__dirname, "../../src");
    const allSrcFiles = getAllTsFiles(srcDir);

    const bannedSdkImports = [
      "@segment/analytics",
      "mixpanel",
      "@posthog",
      "@datadog",
      "@sentry",
      "google-analytics",
      "amplitude-js",
      "telemetry-sdk",
    ];

    for (const file of allSrcFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const banned of bannedSdkImports) {
        expect(content).not.toContain(`"${banned}`);
        expect(content).not.toContain(`'${banned}`);
      }
    }
  });
});
