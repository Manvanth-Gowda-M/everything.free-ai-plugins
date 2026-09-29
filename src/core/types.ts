import { z } from "zod";

/**
 * High-level category vocabulary for capabilities.
 */
export type CapabilityCategory = "data" | "text" | "encoding" | "developer" | "utility";

/**
 * Standard Capability Pack classification.
 */
export type CapabilityPackName =
  "Data Pack" | "Text Pack" | "Encoding Pack" | "Utility Pack" | "Developer Pack";

/**
 * Standard Capability Pack descriptor.
 */
export interface CapabilityPackInfo {
  id: CapabilityCategory;
  name: CapabilityPackName;
  description: string;
}

/**
 * Machine-readable descriptor for a capability operation.
 */
export interface CapabilityOperationInfo {
  name: string;
  description: string;
  inputDescription?: string;
  outputDescription?: string;
}

/**
 * Machine-readable limits descriptor for capability bounded execution.
 */
export interface CapabilityLimits {
  maxInputBytes?: number;
  maxTextLength?: number;
  maxRows?: number;
  maxColumns?: number;
  maxArrayItems?: number;
  maxPatternLength?: number;
  timeoutMs?: number;
  [key: string]: number | string | undefined;
}

/**
 * Standard security classification for local-only capabilities.
 */
export interface CapabilitySecurityInfo {
  offlineOnly: true;
  zeroRetention: true;
  noExternalCalls: true;
  notes?: string;
}

/**
 * Explicit AI usage guidance to maximize tool selection accuracy.
 */
export interface CapabilityUsageGuidance {
  useWhen: string[];
  doNotUseWhen: string[];
  exampleRequests: string[];
}

/**
 * Metadata defining a capability's contract, discovery information, and safety constraints.
 */
export interface CapabilityMetadata {
  /** Unique snake_case identifier (e.g., 'json_formatter_validator') */
  name: string;
  /** Semantic version string */
  version: string;
  /** High-level category */
  category: CapabilityCategory;
  /** Primary organizational Capability Pack */
  pack: CapabilityPackName;
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
  /** Maximum allowed execution time in milliseconds (default: 3000ms) */
  timeoutMs?: number;
  /** List of supported operations */
  operations?: CapabilityOperationInfo[];
  /** Enforced capability limits */
  limits?: CapabilityLimits;
  /** Security and privacy guarantees */
  security?: CapabilitySecurityInfo;
  /** Explicit AI usage guidance to maximize tool selection accuracy */
  usageGuidance?: CapabilityUsageGuidance;
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
 * Standard interface that all Everything.Free capabilities must implement (Capability Contract v2).
 */
export interface Capability<TInputSchema extends z.ZodTypeAny = z.ZodTypeAny, TOutput = unknown> {
  readonly metadata: CapabilityMetadata;
  readonly inputSchema: TInputSchema;
  execute(input: z.infer<TInputSchema>): Promise<CapabilityResult<TOutput>>;
}
