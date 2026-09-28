import { CapabilityRegistry } from "../core/registry.js";
import { JsonFormatterValidatorCapability } from "./data/json-formatter.js";
import { TextDiffAnalyzerCapability } from "./text/text-diff.js";
import { HashAndEncodingCapability } from "./encoding/hash-encoding.js";
import { UnitTimeConverterCapability } from "./utility/unit-time-converter.js";
import { RegexTesterCapability } from "./developer/regex-tester.js";

/**
 * Creates and initializes a CapabilityRegistry populated with all active capabilities.
 */
export function createDefaultRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();

  // Register the standard suite of 5 100% free local capabilities
  registry.register(new JsonFormatterValidatorCapability());
  registry.register(new TextDiffAnalyzerCapability());
  registry.register(new HashAndEncodingCapability());
  registry.register(new UnitTimeConverterCapability());
  registry.register(new RegexTesterCapability());

  return registry;
}

export * from "./data/json-formatter.js";
export * from "./text/text-diff.js";
export * from "./encoding/hash-encoding.js";
export * from "./utility/unit-time-converter.js";
export * from "./developer/regex-tester.js";
