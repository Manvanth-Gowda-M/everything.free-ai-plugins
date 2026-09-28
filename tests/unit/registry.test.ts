import { describe, it, expect } from "vitest";
import { CapabilityRegistry } from "../../src/core/registry.js";
import { JsonFormatterValidatorCapability } from "../../src/capabilities/data/json-formatter.js";
import { CapabilityError } from "../../src/core/errors.js";

describe("CapabilityRegistry", () => {
  it("should register and retrieve a capability", () => {
    const registry = new CapabilityRegistry();
    const cap = new JsonFormatterValidatorCapability();

    expect(registry.count()).toBe(0);
    registry.register(cap);
    expect(registry.count()).toBe(1);

    const retrieved = registry.get("json_formatter_validator");
    expect(retrieved).toBeDefined();
    expect(retrieved?.metadata.name).toBe("json_formatter_validator");
    expect(registry.has("json_formatter_validator")).toBe(true);
  });

  it("should throw when registering a duplicate capability name", () => {
    const registry = new CapabilityRegistry();
    const cap1 = new JsonFormatterValidatorCapability();
    const cap2 = new JsonFormatterValidatorCapability();

    registry.register(cap1);
    expect(() => registry.register(cap2)).toThrow(CapabilityError);
  });

  it("should return all registered capabilities", () => {
    const registry = new CapabilityRegistry();
    const cap = new JsonFormatterValidatorCapability();

    registry.register(cap);
    const all = registry.getAll();
    expect(all.length).toBe(1);
    expect(all[0].metadata.name).toBe("json_formatter_validator");
  });
});
