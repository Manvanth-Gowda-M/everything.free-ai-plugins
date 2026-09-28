import { describe, it, expect } from "vitest";
import { ExecutionRunner } from "../../src/core/execution.js";
import { JsonFormatterValidatorCapability } from "../../src/capabilities/data/json-formatter.js";
import { ErrorCode } from "../../src/core/errors.js";

describe("ExecutionRunner", () => {
  const capability = new JsonFormatterValidatorCapability();

  it("should validate inputs and execute successfully", async () => {
    const result = await ExecutionRunner.run(capability, {
      jsonString: '{"key": "value"}',
      action: "format",
      indent: 2,
    });

    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.data).toBeDefined();
  });

  it("should fail gracefully when input schema validation fails", async () => {
    const result = await ExecutionRunner.run(capability, {
      // Missing jsonString
      action: "invalid_action",
    });

    expect(result.success).toBe(false);
    expect([ErrorCode.INVALID_INPUT, ErrorCode.VALIDATION_ERROR]).toContain(result.error?.code);
    expect(result.error?.message).toContain("validation failed");
  });

  it("should reject inputs exceeding maximum size limits", async () => {
    const hugeString = "a".repeat(1_000_001);
    const result = await ExecutionRunner.run(capability, {
      jsonString: hugeString,
    });

    expect(result.success).toBe(false);
    expect([ErrorCode.INVALID_INPUT, ErrorCode.VALIDATION_ERROR]).toContain(result.error?.code);
  });
});
