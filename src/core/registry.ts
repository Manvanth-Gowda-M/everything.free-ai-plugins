import { Capability, CapabilityPackName } from "./types.js";
import { CapabilityError, ErrorCode } from "./errors.js";

/**
 * Summary structure for capability inventory.
 */
export interface CapabilityInventoryItem {
  name: string;
  displayName: string;
  version: string;
  category: string;
  pack: CapabilityPackName;
  description: string;
  operations: string[];
}

/**
 * Complete capability inventory descriptor.
 */
export interface CapabilityInventory {
  totalCount: number;
  packCounts: Record<CapabilityPackName, number>;
  capabilities: CapabilityInventoryItem[];
}

/**
 * In-memory Registry for managing, discovering, and querying capabilities.
 * Completely independent of any network or AI client protocol.
 */
export class CapabilityRegistry {
  private readonly capabilities: Map<string, Capability> = new Map();

  /**
   * Register a new capability into the registry.
   */
  public register(capability: Capability): void {
    if (!capability || !capability.metadata || !capability.metadata.name) {
      throw new CapabilityError(
        ErrorCode.VALIDATION_ERROR,
        "Cannot register a capability without valid metadata and name."
      );
    }

    const { name } = capability.metadata;

    if (this.capabilities.has(name)) {
      throw new CapabilityError(
        ErrorCode.VALIDATION_ERROR,
        `Capability with name '${name}' is already registered.`
      );
    }

    this.capabilities.set(name, capability);
  }

  /**
   * Get a capability by its unique name.
   */
  public get(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }

  /**
   * Return all registered capabilities.
   */
  public getAll(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Check if a capability exists.
   */
  public has(name: string): boolean {
    return this.capabilities.has(name);
  }

  /**
   * Return the total count of registered capabilities.
   */
  public count(): number {
    return this.capabilities.size;
  }

  /**
   * Get capabilities belonging to a specific pack.
   */
  public getByPack(packName: CapabilityPackName): Capability[] {
    return this.getAll().filter((c) => c.metadata.pack === packName);
  }

  /**
   * Return a structured, machine-readable inventory of all registered capabilities.
   */
  public getInventory(): CapabilityInventory {
    const caps = this.getAll();
    const packCounts: Record<CapabilityPackName, number> = {
      "Data Pack": 0,
      "Text Pack": 0,
      "Encoding Pack": 0,
      "Utility Pack": 0,
      "Developer Pack": 0,
    };

    const inventoryItems: CapabilityInventoryItem[] = caps.map((c) => {
      const { name, displayName, version, category, pack, description, operations } = c.metadata;
      if (pack && pack in packCounts) {
        packCounts[pack]++;
      }

      return {
        name,
        displayName,
        version,
        category,
        pack,
        description,
        operations: operations ? operations.map((op) => op.name) : [],
      };
    });

    return {
      totalCount: caps.length,
      packCounts,
      capabilities: inventoryItems,
    };
  }

  /**
   * Clear all registered capabilities (useful for test isolation).
   */
  public clear(): void {
    this.capabilities.clear();
  }
}
