import { Capability, CapabilityResult } from "./types.js";
import { ErrorCode, formatZodError } from "./errors.js";

export interface ExecutionOptions {
  /** Override timeout in ms */
  timeoutMs?: number;
}

/**
 * Executes a capability safely with Zod validation, timeout bounding, and error normalization.
 */
export class ExecutionRunner {
  /**
   * Run a capability with safety bounds.
   */
  public static async run<TOutput = unknown>(
    capability: Capability,
    rawInput: unknown,
    options?: ExecutionOptions
  ): Promise<CapabilityResult<TOutput>> {
    const startTime = Date.now();
    const timeoutMs =
      options?.timeoutMs ?? capability.metadata.timeoutMs ?? 3000;

    // 1. Validate Input Schema with Zod
    const parseResult = capability.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: ErrorCode.INVALID_INPUT,
          message: formatZodError(parseResult.error),
          details: {
            fieldErrors: parseResult.error.flatten().fieldErrors,
            formatted: parseResult.error.format(),
          },
        },
        metrics: {
          durationMs: Date.now() - startTime,
        },
      };
    }

    // 2. Execute with bounded timeout
    try {
      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const executionPromise = capability.execute(parseResult.data) as Promise<
        CapabilityResult<TOutput>
      >;

      const result = await Promise.race([executionPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      return {
        ...result,
        metrics: {
          durationMs: Date.now() - startTime,
        },
      };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown execution error";
      const isTimeout = errorMessage.includes("timed out");

      return {
        success: false,
        error: {
          code: isTimeout ? ErrorCode.TIMEOUT_ERROR : ErrorCode.EXECUTION_ERROR,
          message: errorMessage,
        },
        metrics: {
          durationMs: Date.now() - startTime,
        },
      };
    }
  }
}
