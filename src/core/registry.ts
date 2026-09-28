import { Capability } from "./types.js";
import { CapabilityError, ErrorCode } from "./errors.js";

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
   * Clear all registered capabilities (useful for test isolation).
   */
  public clear(): void {
    this.capabilities.clear();
  }
}
