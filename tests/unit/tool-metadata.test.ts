import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { z } from "zod";

describe("Capability Quality & AI Discoverability Metadata Tests", () => {
  const registry = createDefaultRegistry();
  const capabilities = registry.getAll();

  it("should have exactly 15 registered capabilities with unique names", () => {
    expect(capabilities.length).toBe(15);
    const names = capabilities.map((c) => c.metadata.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(15);
  });

  it("every capability should belong to a valid Capability Pack", () => {
    const validPacks = [
      "Data Pack",
      "Text Pack",
      "Encoding Pack",
      "Utility Pack",
      "Developer Pack",
    ];
    for (const cap of capabilities) {
      expect(cap.metadata.pack).toBeDefined();
      expect(validPacks).toContain(cap.metadata.pack);
    }
  });

  it("every capability should have high-signal, descriptive metadata for AI assistants", () => {
    for (const cap of capabilities) {
      const meta = cap.metadata;

      expect(meta.name).toMatch(/^[a-z0-9_]+$/);
      expect(meta.displayName.length).toBeGreaterThan(5);
      expect(meta.description.length).toBeGreaterThan(50);
      expect(meta.isFree).toBe(true);
      expect(meta.requiresExternalNetwork).toBe(false);
      expect(meta.privacy).toBe("local-only");

      // Verify standardized categories
      expect(["data", "text", "encoding", "developer", "utility"]).toContain(meta.category);

      // Verify AI usage guidance
      expect(meta.usageGuidance).toBeDefined();
      expect(meta.usageGuidance?.useWhen.length).toBeGreaterThanOrEqual(2);
      expect(meta.usageGuidance?.doNotUseWhen.length).toBeGreaterThanOrEqual(1);
      expect(meta.usageGuidance?.exampleRequests.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every capability input schema should have property descriptions", () => {
    for (const cap of capabilities) {
      expect(cap.inputSchema).toBeInstanceOf(z.ZodObject);
      const shape = (cap.inputSchema as z.ZodObject<Record<string, z.ZodTypeAny>>).shape;

      for (const [propName, propSchema] of Object.entries(shape)) {
        const schema = propSchema as z.ZodTypeAny;
        expect(
          schema.description,
          `Field '${propName}' in capability '${cap.metadata.name}' must have a description`
        ).toBeDefined();
        expect(schema.description?.length).toBeGreaterThan(5);
      }
    }
  });

  it("all 15 capabilities must operate 100% free and local-only without external network requirements", () => {
    for (const cap of capabilities) {
      expect(cap.metadata.requiresExternalNetwork).toBe(false);
      expect(cap.metadata.isFree).toBe(true);
      expect(cap.metadata.privacy).toBe("local-only");
      expect(cap.metadata.description.toLowerCase()).toContain("local");
    }
  });
});
