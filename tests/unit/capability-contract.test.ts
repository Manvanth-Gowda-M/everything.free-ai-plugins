import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { ExecutionRunner } from "../../src/core/execution.js";
import { z } from "zod";

describe("Capability Contract v2 Automated Test Suite", () => {
  const registry = createDefaultRegistry();
  const capabilities = registry.getAll();

  const VALID_CATEGORIES = ["data", "text", "encoding", "developer", "utility"];
  const VALID_PACKS = [
    "Data Pack",
    "Text Pack",
    "Encoding Pack",
    "Utility Pack",
    "Developer Pack",
  ];

  it("should have exactly 10 registered capabilities in the default registry", () => {
    expect(capabilities.length).toBe(10);
    expect(registry.count()).toBe(10);
  });

  describe("Contract Invariants per Capability", () => {
    capabilities.forEach((capability) => {
      const { name, displayName, version, category, pack, description, isFree, requiresExternalNetwork, privacy, timeoutMs, operations, limits, security, usageGuidance } = capability.metadata;

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
            expect(field.description, `Field '${propName}' in '${name}' must have a description`).toBeDefined();
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
      expect(inventory.totalCount).toBe(10);
      expect(inventory.capabilities.length).toBe(10);

      let sumPacks = 0;
      for (const pack of VALID_PACKS) {
        const count = inventory.packCounts[pack as keyof typeof inventory.packCounts];
        expect(count).toBeGreaterThanOrEqual(1);
        sumPacks += count;
      }
      expect(sumPacks).toBe(10);
    });

    it("queries capabilities by pack accurately", () => {
      const dataCaps = registry.getByPack("Data Pack");
      expect(dataCaps.length).toBe(2);
      expect(dataCaps.map((c) => c.metadata.name).sort()).toEqual(["csv_processor", "json_formatter_validator"]);

      const devCaps = registry.getByPack("Developer Pack");
      expect(devCaps.length).toBe(3);
      expect(devCaps.map((c) => c.metadata.name).sort()).toEqual(["jwt_inspector", "regex_tester", "url_analyzer"]);
    });
  });
});
