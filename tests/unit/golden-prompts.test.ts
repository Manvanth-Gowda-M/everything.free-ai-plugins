import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { ExecutionRunner } from "../../src/core/execution.js";
import { JsonFormatterOutput } from "../../src/capabilities/data/json-formatter.js";
import { TextDiffOutput } from "../../src/capabilities/text/text-diff.js";
import { HashAndEncodingOutput } from "../../src/capabilities/encoding/hash-encoding.js";
import { UnitTimeConverterOutput } from "../../src/capabilities/utility/unit-time-converter.js";
import { RegexTesterOutput } from "../../src/capabilities/developer/regex-tester.js";

describe("Golden Prompt Test Cases (Simulated Real-World ChatGPT Invocations)", () => {
  const registry = createDefaultRegistry();

  describe("JSON Golden Prompts (json_formatter_validator)", () => {
    const cap = registry.get("json_formatter_validator")!;

    it("Golden 1: Validate messy JSON syntax", async () => {
      const res = await ExecutionRunner.run<JsonFormatterOutput>(cap, {
        jsonString: '{"status": "ok", "items": [1, 2, 3]}',
        action: "validate",
      });
      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(true);
    });

    it("Golden 2: Pretty-print unformatted JSON", async () => {
      const res = await ExecutionRunner.run<JsonFormatterOutput>(cap, {
        jsonString: '{"a":1,"b":{"c":2}}',
        action: "format",
        indent: 2,
      });
      expect(res.success).toBe(true);
      expect(res.data?.result).toBe('{\n  "a": 1,\n  "b": {\n    "c": 2\n  }\n}');
    });

    it("Golden 3: Minify formatted JSON payload", async () => {
      const res = await ExecutionRunner.run<JsonFormatterOutput>(cap, {
        jsonString: '{\n  "name": "Everything.Free",\n  "version": 1\n}',
        action: "minify",
      });
      expect(res.success).toBe(true);
      expect(res.data?.result).toBe('{"name":"Everything.Free","version":1}');
    });

    it("Golden 4: Inspect structural metrics and depth", async () => {
      const res = await ExecutionRunner.run<JsonFormatterOutput>(cap, {
        jsonString: '{"user": {"profile": {"name": "Alice"}}, "roles": ["admin"]}',
        action: "inspect",
      });
      expect(res.success).toBe(true);
      expect(res.data?.stats?.maxDepth).toBe(3);
      expect(res.data?.stats?.keyCount).toBe(2);
    });
  });

  describe("Diff Golden Prompts (text_diff_analyzer)", () => {
    const cap = registry.get("text_diff_analyzer")!;

    it("Golden 1: What changed between these two configuration files?", async () => {
      const res = await ExecutionRunner.run<TextDiffOutput>(cap, {
        original: "PORT=3000\nENV=development\nDEBUG=true",
        modified: "PORT=8080\nENV=production\nDEBUG=false",
        mode: "line",
      });
      expect(res.success).toBe(true);
      expect(res.data?.identical).toBe(false);
      expect(res.data?.addedCount).toBe(3);
      expect(res.data?.removedCount).toBe(3);
      expect(res.data?.diff).toContain("- PORT=3000");
      expect(res.data?.diff).toContain("+ PORT=8080");
    });

    it("Golden 2: Inline word diff between draft versions", async () => {
      const res = await ExecutionRunner.run<TextDiffOutput>(cap, {
        original: "The project is good.",
        modified: "The project is outstanding.",
        mode: "word",
      });
      expect(res.success).toBe(true);
      expect(res.data?.diff).toContain("[-good.-]");
      expect(res.data?.diff).toContain("[+outstanding.+]");
    });
  });

  describe("Hash & Encoding Golden Prompts (hash_and_encoding)", () => {
    const cap = registry.get("hash_and_encoding")!;

    it("Golden 1: Calculate SHA-256 hash of text", async () => {
      const res = await ExecutionRunner.run<HashAndEncodingOutput>(cap, {
        operation: "sha256",
        input: "Quilonix Everything.Free",
      });
      expect(res.success).toBe(true);
      expect(res.data?.output).toHaveLength(64);
    });

    it("Golden 2: Encode and decode Base64 payload", async () => {
      const encodeRes = await ExecutionRunner.run<HashAndEncodingOutput>(cap, {
        operation: "base64_encode",
        input: "Authorization: Bearer token123",
      });
      expect(encodeRes.success).toBe(true);

      const decodeRes = await ExecutionRunner.run<HashAndEncodingOutput>(cap, {
        operation: "base64_decode",
        input: encodeRes.data?.output,
      });
      expect(decodeRes.data?.output).toBe("Authorization: Bearer token123");
    });

    it("Golden 3: Generate a random UUIDv4", async () => {
      const res = await ExecutionRunner.run<HashAndEncodingOutput>(cap, {
        operation: "uuid_v4",
      });
      expect(res.success).toBe(true);
      expect(res.data?.output).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe("Unit & Time Converter Golden Prompts (unit_time_converter)", () => {
    const cap = registry.get("unit_time_converter")!;

    it("Golden 1: Convert 10 miles to kilometers", async () => {
      const res = await ExecutionRunner.run<UnitTimeConverterOutput>(cap, {
        mode: "unit",
        value: 10,
        fromUnit: "mi",
        toUnit: "km",
      });
      expect(res.success).toBe(true);
      expect(res.data?.unitResult?.toValue).toBeCloseTo(16.09344, 4);
    });

    it("Golden 2: Convert 98.6 Fahrenheit to Celsius", async () => {
      const res = await ExecutionRunner.run<UnitTimeConverterOutput>(cap, {
        mode: "unit",
        value: 98.6,
        fromUnit: "F",
        toUnit: "C",
      });
      expect(res.success).toBe(true);
      expect(res.data?.unitResult?.toValue).toBeCloseTo(37, 1);
    });

    it("Golden 3: Convert Unix timestamp 1700000000 to ISO 8601 in UTC", async () => {
      const res = await ExecutionRunner.run<UnitTimeConverterOutput>(cap, {
        mode: "time",
        timeInput: 1700000000,
        targetTimezone: "UTC",
      });
      expect(res.success).toBe(true);
      expect(res.data?.timeResult?.iso).toBe("2023-11-14T22:13:20.000Z");
    });
  });

  describe("Regex Tester Golden Prompts (regex_tester)", () => {
    const cap = registry.get("regex_tester")!;

    it("Golden 1: Test email address validation regex", async () => {
      const res = await ExecutionRunner.run<RegexTesterOutput>(cap, {
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        text: "support@quilonix.dev",
        operation: "test",
      });
      expect(res.success).toBe(true);
      expect(res.data?.matched).toBe(true);
    });

    it("Golden 2: Extract all version tags from text", async () => {
      const res = await ExecutionRunner.run<RegexTesterOutput>(cap, {
        pattern: "v\\d+\\.\\d+\\.\\d+",
        text: "Upgrading from v1.0.0 to v1.2.3 and later v2.0.0",
        operation: "match",
      });
      expect(res.success).toBe(true);
      expect(res.data?.matches).toEqual(["v1.0.0", "v1.2.3", "v2.0.0"]);
    });
  });
});
