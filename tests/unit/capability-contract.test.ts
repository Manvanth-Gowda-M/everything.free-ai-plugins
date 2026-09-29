import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { ExecutionRunner } from "../../src/core/execution.js";
import { z } from "zod";

describe("Capability Contract v2 Automated Test Suite", () => {
  const registry = createDefaultRegistry();
  const capabilities = registry.getAll();

  const VALID_CATEGORIES = ["data", "text", "encoding", "developer", "utility"];
  const VALID_PACKS = ["Data Pack", "Text Pack", "Encoding Pack", "Utility Pack", "Developer Pack"];

  it("should have exactly 15 registered capabilities in the default registry", () => {
    expect(capabilities.length).toBe(15);
    expect(registry.count()).toBe(15);
  });

  describe("Contract Invariants per Capability", () => {
    capabilities.forEach((capability) => {
      const {
        name,
        displayName,
        version,
        category,
        pack,
        description,
        isFree,
        requiresExternalNetwork,
        privacy,
        timeoutMs,
        operations,
        limits,
        security,
        usageGuidance,
      } = capability.metadata;

      describe(`Capability Contract: ${name}`, () => {
        it("adheres to metadata identification standards", () => {
          expect(name).toMatch(/^[a-z0-9_]+$/);
          expect(displayName).toBeDefined();
          expect(displayName.length).toBeGreaterThan(4);
          expect(version).toMatch(/^\d+\.\d+\.\d+$/);
          expect(VALID_CATEGORIES).toContain(category);
          expect(VALID_PACKS).toContain(pack);
          expect(description.length).toBeGreaterThan(40);
        });

        it("enforces ₹0 free, local-only, and zero-retention security guarantees", () => {
          expect(isFree).toBe(true);
          expect(requiresExternalNetwork).toBe(false);
          expect(privacy).toBe("local-only");
          expect(security).toBeDefined();
          expect(security?.offlineOnly).toBe(true);
          expect(security?.zeroRetention).toBe(true);
          expect(security?.noExternalCalls).toBe(true);
        });

        it("defines structured execution limits and timeouts", () => {
          expect(timeoutMs).toBeDefined();
          expect(timeoutMs).toBeGreaterThan(0);
          expect(timeoutMs).toBeLessThanOrEqual(10000);
          expect(limits).toBeDefined();
        });

        it("exposes structured machine-readable operations", () => {
          expect(operations).toBeDefined();
          expect(operations?.length).toBeGreaterThanOrEqual(1);
          for (const op of operations || []) {
            expect(op.name).toBeDefined();
            expect(op.name.length).toBeGreaterThan(0);
            expect(op.description).toBeDefined();
            expect(op.description.length).toBeGreaterThan(10);
          }
        });

        it("provides comprehensive AI usage guidance", () => {
          expect(usageGuidance).toBeDefined();
          expect(usageGuidance?.useWhen.length).toBeGreaterThanOrEqual(2);
          expect(usageGuidance?.doNotUseWhen.length).toBeGreaterThanOrEqual(1);
          expect(usageGuidance?.exampleRequests.length).toBeGreaterThanOrEqual(2);
        });

        it("defines strict Zod schema with property descriptions for all inputs", () => {
          expect(capability.inputSchema).toBeInstanceOf(z.ZodObject);
          const shape = (capability.inputSchema as z.ZodObject<Record<string, z.ZodTypeAny>>).shape;
          const propNames = Object.keys(shape);
          expect(propNames.length).toBeGreaterThanOrEqual(1);

          for (const propName of propNames) {
            const field = shape[propName];
            expect(
              field.description,
              `Field '${propName}' in '${name}' must have a description`
            ).toBeDefined();
            expect(field.description?.length).toBeGreaterThan(5);
          }
        });

        it("normalizes validation errors on invalid inputs without throwing unhandled exceptions", async () => {
          const result = await ExecutionRunner.run(capability, {
            __completely_invalid_param_12345__: 999999,
          });

          // If execution succeeds (due to default params) or fails with normalized error
          if (!result.success) {
            expect(result.error).toBeDefined();
            expect(result.error?.code).toBeDefined();
            expect(result.error?.message).toBeDefined();
            expect(result.error?.message.length).toBeGreaterThan(5);
          }
        });
      });
    });
  });

  describe("Registry Inventory & Pack Queries", () => {
    it("generates an accurate machine-readable inventory", () => {
      const inventory = registry.getInventory();
      expect(inventory.totalCount).toBe(15);
      expect(inventory.capabilities.length).toBe(15);

      let sumPacks = 0;
      for (const pack of VALID_PACKS) {
        const count = inventory.packCounts[pack as keyof typeof inventory.packCounts];
        expect(count).toBeGreaterThanOrEqual(1);
        sumPacks += count;
      }
      expect(sumPacks).toBe(15);
    });

    it("queries capabilities by pack accurately", () => {
      const dataCaps = registry.getByPack("Data Pack");
      expect(dataCaps.length).toBe(4);
      expect(dataCaps.map((c) => c.metadata.name).sort()).toEqual([
        "csv_processor",
        "json_formatter_validator",
        "sql_processor",
        "xml_processor",
      ]);

      const textCaps = registry.getByPack("Text Pack");
      expect(textCaps.length).toBe(3);
      expect(textCaps.map((c) => c.metadata.name).sort()).toEqual([
        "html_processor",
        "markdown_processor",
        "text_diff_analyzer",
      ]);

      const encodingCaps = registry.getByPack("Encoding Pack");
      expect(encodingCaps.length).toBe(1);
      expect(encodingCaps.map((c) => c.metadata.name).sort()).toEqual(["hash_and_encoding"]);

      const utilityCaps = registry.getByPack("Utility Pack");
      expect(utilityCaps.length).toBe(3);
      expect(utilityCaps.map((c) => c.metadata.name).sort()).toEqual([
        "color_converter",
        "cron_analyzer",
        "unit_time_converter",
      ]);

      const devCaps = registry.getByPack("Developer Pack");
      expect(devCaps.length).toBe(4);
      expect(devCaps.map((c) => c.metadata.name).sort()).toEqual([
        "jwt_inspector",
        "mime_analyzer",
        "regex_tester",
        "url_analyzer",
      ]);
    });
  });

  describe("MCP Resources & Prompts Contract Invariants", () => {
    it("guarantees unique and well-formed static resource URIs", async () => {
      const { RESOURCE_DEFINITIONS } = await import("../../src/adapters/mcp/resources.js");
      const uris = RESOURCE_DEFINITIONS.map((r) => r.uri);
      const uniqueUris = new Set(uris);
      expect(uniqueUris.size).toBe(uris.length);

      for (const uri of uris) {
        expect(uri).toMatch(/^everything-free:\/\/[a-z0-9_-]+$/);
      }
    });

    it("guarantees unique prompt names and valid metadata for all curated prompts", async () => {
      const { PROMPT_DEFINITIONS } = await import("../../src/adapters/mcp/prompts.js");
      const names = PROMPT_DEFINITIONS.map((p) => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);

      for (const prompt of PROMPT_DEFINITIONS) {
        expect(prompt.name).toMatch(/^[a-z_]+$/);
        expect(prompt.description.length).toBeGreaterThan(15);
        expect(prompt.arguments.length).toBeGreaterThanOrEqual(1);

        const argNames = prompt.arguments.map((a) => a.name);
        const uniqueArgs = new Set(argNames);
        expect(uniqueArgs.size).toBe(argNames.length);
      }
    });
  });
});
