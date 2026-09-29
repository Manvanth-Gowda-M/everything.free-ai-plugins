import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { GeminiAdapter } from "../../src/adapters/gemini/adapter.js";

describe("Gemini Adapter Unit Tests", () => {
  const registry = createDefaultRegistry();
  const adapter = new GeminiAdapter(registry);

  it("should have correct platformName", () => {
    expect(adapter.platformName).toBe("gemini");
  });

  it("should generate tool declarations for all 15 capabilities", () => {
    const tools = adapter.getToolDeclarations();
    expect(tools).toHaveLength(1);
    expect(tools[0].functionDeclarations).toHaveLength(15);

    const names = tools[0].functionDeclarations.map((fn) => fn.name).sort();
    expect(names).toEqual([
      "color_converter",
      "cron_analyzer",
      "csv_processor",
      "hash_and_encoding",
      "html_processor",
      "json_formatter_validator",
      "jwt_inspector",
      "markdown_processor",
      "mime_analyzer",
      "regex_tester",
      "sql_processor",
      "text_diff_analyzer",
      "unit_time_converter",
      "url_analyzer",
      "xml_processor",
    ]);

    for (const fn of tools[0].functionDeclarations) {
      expect(fn.name).toBeDefined();
      expect(fn.description.length).toBeGreaterThan(20);
      expect(fn.parameters.type).toBe("OBJECT");
      expect(fn.parameters.properties).toBeDefined();
    }
  });

  it("should execute json_formatter_validator via Gemini executeTool", async () => {
    const res = await adapter.executeTool("json_formatter_validator", {
      jsonString: '{"hello": "world"}',
      action: "format",
      indent: 2,
    });

    expect(res.name).toBe("json_formatter_validator");
    expect(res.response.ok).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = res.response.result as any;
    expect(result.valid).toBe(true);
    expect(result.result).toContain('"hello": "world"');
  });

  it("should execute unit_time_converter via Gemini executeTool", async () => {
    const res = await adapter.executeTool("unit_time_converter", {
      mode: "unit",
      value: 10,
      fromUnit: "km",
      toUnit: "m",
    });

    expect(res.response.ok).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = res.response.result as any;
    expect(result.unitResult.toValue).toBe(10000);
  });

  it("should return normalized error structure for invalid inputs", async () => {
    const res = await adapter.executeTool("unit_time_converter", {
      mode: "unit",
      value: 10,
      fromUnit: "invalid_unit_xyz",
      toUnit: "m",
    });

    expect(res.response.ok).toBe(false);
    expect(res.response.error).toBeDefined();
    expect(res.response.error?.code).toBeDefined();
  });

  it("should return CAPABILITY_NOT_FOUND error for non-existent tools", async () => {
    const res = await adapter.executeTool("non_existent_tool_999", {});

    expect(res.response.ok).toBe(false);
    expect(res.response.error?.code).toBe("CAPABILITY_NOT_FOUND");
    expect(res.response.error?.message).toContain("non_existent_tool_999");
  });

  it("should handle raw Gemini functionCall parts seamlessly", async () => {
    const part = {
      functionCall: {
        name: "color_converter",
        args: {
          color: "#00FF00",
        },
      },
    };

    const responsePart = await adapter.handleFunctionCall(part);
    expect(responsePart.functionResponse).toBeDefined();
    expect(responsePart.functionResponse?.name).toBe("color_converter");
    expect(responsePart.functionResponse?.response.ok).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = responsePart.functionResponse?.response.result as any;
    expect(result.formats.rgb).toBe("rgb(0, 255, 0)");
  });
});
