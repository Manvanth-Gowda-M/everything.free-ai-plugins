import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import {
  RESOURCE_DEFINITIONS,
  buildCapabilityCatalog,
  buildCapabilityDoc,
  getArchitectureDoc,
  getSecurityDoc,
  getPrivacyDoc,
  STATIC_DOCS,
} from "../../src/adapters/mcp/resources.js";

describe("MCP Resources Unit Tests", () => {
  const registry = createDefaultRegistry();
  const capabilities = registry.getAll();

  it("should define stable static resource definitions", () => {
    expect(RESOURCE_DEFINITIONS.length).toBe(4);
    const uris = RESOURCE_DEFINITIONS.map((r) => r.uri);
    expect(uris).toContain("everything-free://capabilities");
    expect(uris).toContain("everything-free://architecture");
    expect(uris).toContain("everything-free://security");
    expect(uris).toContain("everything-free://privacy");

    for (const def of RESOURCE_DEFINITIONS) {
      expect(def.uri.startsWith("everything-free://")).toBe(true);
      expect(def.mimeType).toBeDefined();
      expect(def.name).toBeDefined();
      expect(def.description.length).toBeGreaterThan(10);
    }
  });

  it("should generate a valid machine-readable capability catalog", () => {
    const catalogJson = buildCapabilityCatalog(registry);
    expect(typeof catalogJson).toBe("string");

    const catalog = JSON.parse(catalogJson);
    expect(catalog.service).toBe("everything-free-ai-plugins");
    expect(catalog.version).toBeDefined();
    expect(catalog.totalCapabilities).toBe(15);
    expect(catalog.capabilities).toHaveLength(15);

    for (const cap of catalog.capabilities) {
      expect(cap.id).toBeDefined();
      expect(cap.displayName).toBeDefined();
      expect(cap.pack).toBeDefined();
      expect(cap.category).toBeDefined();
      expect(cap.description).toBeDefined();
      expect(cap.operations).toBeInstanceOf(Array);
      expect(cap.limits).toBeDefined();
      expect(cap.security).toBeDefined();
      expect(cap.usageGuidance).toBeDefined();
      expect(cap.documentationUri).toBe(`everything-free://capabilities/${cap.id}`);
    }
  });

  it("should generate detailed documentation for every registered capability", () => {
    for (const cap of capabilities) {
      const doc = buildCapabilityDoc(cap);
      expect(doc).toContain(`# ${cap.metadata.displayName}`);
      expect(doc).toContain(`**Capability ID:** \`${cap.metadata.name}\``);
      expect(doc).toContain(`**Pack:** ${cap.metadata.pack}`);
      expect(doc).toContain(`**Category:** ${cap.metadata.category}`);
      expect(doc).toContain("## Overview");
      expect(doc).toContain("## Security & Privacy");
      expect(doc).toContain("## Operational Limits");
      expect(doc).toContain("## Supported Operations");
      expect(doc).toContain("## Usage Guidance");
    }
  });

  it("should expose static architecture, security, and privacy documentation", () => {
    const arch = getArchitectureDoc();
    expect(arch).toContain("# Everything.Free AI Plugins Architecture");
    expect(arch).toContain("Execution Flow");
    expect(arch).toContain("Capability Contract v2");

    const sec = getSecurityDoc();
    expect(sec).toContain("# Everything.Free Security Model");
    expect(sec).toContain("Zero Data Retention");
    expect(sec).toContain("Offline Only");

    const priv = getPrivacyDoc();
    expect(priv).toContain("# Everything.Free Privacy Model");
    expect(priv).toContain("100% Local In-Memory Processing");
    expect(priv).toContain("Zero Telemetry");

    expect(STATIC_DOCS["architecture"]).toBe(arch);
    expect(STATIC_DOCS["security"]).toBe(sec);
    expect(STATIC_DOCS["privacy"]).toBe(priv);
  });

  it("should adhere to read-only, local-only, and deterministic URI scheme", () => {
    for (const def of RESOURCE_DEFINITIONS) {
      expect(def.uri).not.toMatch(/^[a-zA-Z]:\\/); // No Windows drive paths
      expect(def.uri).not.toMatch(/^\//); // No POSIX absolute paths
      expect(def.uri).not.toMatch(/^https?:\/\//); // No external URLs
      expect(def.uri).toMatch(/^everything-free:\/\/[a-z0-9_-]+$/);
    }
  });
});
