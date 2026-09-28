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
  category: "data" | "text" | "encoding" | "developer" | "utility";
  /** Human-readable display name */
  displayName: string;
  /** Detailed description exposed to AI assistants for tool discovery */
  description: string;
  /** Invariant: Everything.Free capabilities are always 100% free */
  isFree: true;
  /** Whether the capability requires external network access (false for local capabilities) */
  requiresExternalNetwork: false;
  /** Privacy classification (always 'local-only' for local capabilities) */
  privacy?: "local-only";
  /** External dependencies (empty array for built-in capabilities) */
  externalDependencies?: string[];
  /** Primary organizational Capability Pack (e.g., 'Data Pack', 'Text Pack') */
  pack?: "Data Pack" | "Text Pack" | "Encoding Pack" | "Utility Pack" | "Developer Pack";
  /** Maximum allowed execution time in milliseconds (default: 5000ms) */
  timeoutMs?: number;
  /** Explicit AI usage guidance to maximize tool selection accuracy */
  usageGuidance?: {
    useWhen: string[];
    doNotUseWhen: string[];
    exampleRequests: string[];
  };
}

/**
 * Standard Capability Pack descriptor.
 */
export interface CapabilityPackInfo {
  id: "data" | "text" | "encoding" | "developer" | "utility";
  name: "Data Pack" | "Text Pack" | "Encoding Pack" | "Utility Pack" | "Developer Pack";
  description: string;
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
