import { CapabilityRegistry } from "../core/registry.js";
import { CapabilityErrorDetails } from "../core/types.js";

/**
 * Standard normalized execution result format used across all platform adapters.
 */
export interface NormalizedExecutionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: CapabilityErrorDetails;
  durationMs?: number;
}

/**
 * Generic tool descriptor exposed by adapters.
 */
export interface GenericToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Common abstraction contract for AI platform adapters.
 */
export interface PlatformAdapter<TDeclaration = unknown, TResponse = unknown> {
  /** Identifier of the target platform (e.g., 'mcp', 'gemini', 'chatgpt') */
  readonly platformName: string;
  /** Reference to the capability registry */
  readonly registry: CapabilityRegistry;

  /** Returns all capability tool declarations formatted for the target platform */
  getToolDeclarations(): TDeclaration[];

  /** Executes a tool call using the platform-independent core capability engine */
  executeTool(toolName: string, rawArgs: unknown): Promise<TResponse>;
}
