import { z } from "zod";

/**
 * Standard error codes across Everything.Free AI Plugins.
 */
export enum ErrorCode {
  INVALID_INPUT = "INVALID_INPUT",
  VALIDATION_ERROR = "VALIDATION_ERROR", // Backward-compatible alias
  UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION",
  LIMIT_EXCEEDED = "LIMIT_EXCEEDED",
  PARSE_ERROR = "PARSE_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  EXECUTION_ERROR = "EXECUTION_ERROR",
  CAPABILITY_NOT_FOUND = "CAPABILITY_NOT_FOUND",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Formats a Zod validation error into a clean, human- and AI-readable string.
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const pathStr = issue.path.length > 0 ? `'${issue.path.join(".")}'` : "input";
    return `Field ${pathStr}: ${issue.message}`;
  });

  return `Input validation failed (${issues.length} issue${issues.length > 1 ? "s" : ""}): ${issues.join("; ")}`;
}

/**
 * Base error class for all capability-related errors.
 */
export class CapabilityError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "CapabilityError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, CapabilityError.prototype);
  }
}
