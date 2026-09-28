import { CapabilityRegistry } from "../core/registry.js";
import { JsonFormatterValidatorCapability } from "./data/json-formatter.js";

/**
 * Creates and initializes a CapabilityRegistry populated with all active capabilities.
 */
export function createDefaultRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  
  // Register MVP First Slice
  registry.register(new JsonFormatterValidatorCapability());

  return registry;
}

export * from "./data/json-formatter.js";
