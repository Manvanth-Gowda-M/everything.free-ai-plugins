import { z } from "zod";

/**
 * Metadata defining a capability's contract, discovery information, and safety constraints.
 */
export interface CapabilityMetadata {
  /** Unique snake_case identifier (e.g., 'json_formatter_validator') */
  name: string;
  /** Semantic version string */
  version: string;
  /** High-level category */
  category: "data" | "text" | "dev" | "math";
  /** Human-readable display name */
  displayName: string;
  /** Detailed description exposed to AI assistants for tool discovery */
  description: string;
  /** Invariant: Everything.Free capabilities are always 100% free */
  isFree: true;
  /** Whether the capability requires external network access (false for MVP) */
  requiresExternalNetwork: false;
  /** Hard execution timeout in milliseconds (default: 3000ms) */
  timeoutMs?: number;
}

/**
 * Standardized execution diagnostic / error structure.
 */
export interface CapabilityErrorDetails {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standardized result envelope returned by all capabilities.
 */
export interface CapabilityResult<TOutput = unknown> {
  success: boolean;
  data?: TOutput;
  error?: CapabilityErrorDetails;
  metrics?: {
    durationMs: number;
  };
}

/**
 * Standard interface that all Everything.Free capabilities must implement.
 */
export interface Capability<
  TInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput = unknown,
> {
  readonly metadata: CapabilityMetadata;
  readonly inputSchema: TInputSchema;
  execute(input: z.infer<TInputSchema>): Promise<CapabilityResult<TOutput>>;
}
