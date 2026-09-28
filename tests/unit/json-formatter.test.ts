import { describe, it, expect } from "vitest";
import { JsonFormatterValidatorCapability } from "../../src/capabilities/data/json-formatter.js";

describe("JsonFormatterValidatorCapability", () => {
  const capability = new JsonFormatterValidatorCapability();

  it("should format compact JSON into pretty-printed string", async () => {
    const res = await capability.execute({
      jsonString: '{"a":1,"b":[2,3]}',
      action: "format",
      indent: 2,
    });

    expect(res.success).toBe(true);
    expect(res.data?.valid).toBe(true);
    expect(res.data?.result).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it("should minify indented JSON", async () => {
    const res = await capability.execute({
      jsonString: '{\n  "a": 1\n}',
      action: "minify",
    });

    expect(res.success).toBe(true);
    expect(res.data?.valid).toBe(true);
    expect(res.data?.result).toBe('{"a":1}');
  });

  it("should validate correct JSON", async () => {
    const res = await capability.execute({
      jsonString: '{"valid": true}',
      action: "validate",
    });

    expect(res.success).toBe(true);
    expect(res.data?.valid).toBe(true);
    expect(res.data?.syntaxError).toBeUndefined();
  });

  it("should provide line, column, and snippet diagnostics for invalid JSON", async () => {
    const invalidJson = '{\n  "name": "test",\n  "broken": \n}';
    const res = await capability.execute({
      jsonString: invalidJson,
      action: "validate",
    });

    expect(res.success).toBe(true);
    expect(res.data?.valid).toBe(false);
    expect(res.data?.syntaxError).toBeDefined();
    expect(res.data?.syntaxError?.snippet).toBeDefined();
    expect(res.data?.syntaxError?.line).toBeGreaterThan(0);
  });

  it("should inspect JSON structure and return accurate stats", async () => {
    const res = await capability.execute({
      jsonString: '{"user": {"name": "Alice", "tags": ["admin", "dev"]}, "age": 30}',
      action: "inspect",
    });

    expect(res.success).toBe(true);
    expect(res.data?.valid).toBe(true);
    expect(res.data?.stats?.rootType).toBe("object");
    expect(res.data?.stats?.keyCount).toBe(2);
    expect(res.data?.stats?.maxDepth).toBe(3);
    expect(res.data?.stats?.byteSize).toBeGreaterThan(0);
  });
});
