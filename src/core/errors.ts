/**
 * Standard error codes across Everything.Free AI Plugins.
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  EXECUTION_ERROR = "EXECUTION_ERROR",
  CAPABILITY_NOT_FOUND = "CAPABILITY_NOT_FOUND",
  INTERNAL_ERROR = "INTERNAL_ERROR",
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
