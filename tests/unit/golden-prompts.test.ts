import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { ExecutionRunner } from "../../src/core/execution.js";
import { JsonFormatterOutput } from "../../src/capabilities/data/json-formatter.js";
import { TextDiffOutput } from "../../src/capabilities/text/text-diff.js";
import { HashAndEncodingOutput } from "../../src/capabilities/encoding/hash-encoding.js";
import { UnitTimeConverterOutput } from "../../src/capabilities/utility/unit-time-converter.js";
import { RegexTesterOutput } from "../../src/capabilities/developer/regex-tester.js";
import { CsvProcessorOutput } from "../../src/capabilities/data/csv-processor.js";
import { MarkdownProcessorOutput } from "../../src/capabilities/text/markdown-processor.js";
import { JwtInspectionOutput } from "../../src/capabilities/developer/jwt-inspector.js";
import { UrlAnalyzerOutput } from "../../src/capabilities/developer/url-analyzer.js";
import { ColorConverterOutput } from "../../src/capabilities/utility/color-converter.js";
import { SqlProcessorOutput } from "../../src/capabilities/data/sql-processor.js";
import { XmlProcessorOutput } from "../../src/capabilities/data/xml-processor.js";
import { HtmlProcessorOutput } from "../../src/capabilities/text/html-processor.js";
import { CronAnalyzerOutput } from "../../src/capabilities/utility/cron-analyzer.js";
import { MimeAnalyzerOutput } from "../../src/capabilities/developer/mime-analyzer.js";

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

  describe("CSV Processor Golden Prompts (csv_processor)", () => {
    const cap = registry.get("csv_processor")!;
    const sampleCsv = "id,name,age,active\n1,Alice,30,true\n2,Bob,24,false\n3,Charlie,35,true";

    it("Golden 1: Inspect CSV structure and column types", async () => {
      const res = await ExecutionRunner.run<CsvProcessorOutput>(cap, {
        csvText: sampleCsv,
        operation: "inspect",
      });
      expect(res.success).toBe(true);
      expect(res.data?.stats?.rowCount).toBe(3);
      expect(res.data?.stats?.headers).toEqual(["id", "name", "age", "active"]);
      expect(res.data?.stats?.columnTypes?.age).toBe("number");
    });

    it("Golden 2: Filter CSV to rows where age is greater than 25", async () => {
      const res = await ExecutionRunner.run<CsvProcessorOutput>(cap, {
        csvText: sampleCsv,
        operation: "filter",
        filterColumn: "age",
        filterOperator: "greater_than",
        filterValue: "25",
      });
      expect(res.success).toBe(true);
      expect(res.data?.rows).toHaveLength(2);
      expect(res.data?.rows?.map((r) => r[1])).toEqual(["Alice", "Charlie"]);
    });

    it("Golden 3: Convert CSV to JSON records", async () => {
      const res = await ExecutionRunner.run<CsvProcessorOutput>(cap, {
        csvText: sampleCsv,
        operation: "to_json",
      });
      expect(res.success).toBe(true);
      expect(res.data?.jsonData).toHaveLength(3);
      expect(res.data?.jsonData?.[0]).toEqual({
        id: 1,
        name: "Alice",
        age: 30,
        active: true,
      });
    });
  });

  describe("Markdown Processor Golden Prompts (markdown_processor)", () => {
    const cap = registry.get("markdown_processor")!;
    const sampleMd = `# Main Architecture

## Core Engine
Description of core engine.

### Memory Layout
Details on memory.

\`\`\`typescript
const x: number = 42;
\`\`\`

[Documentation](https://quilonix.dev)`;

    it("Golden 1: Extract heading hierarchy", async () => {
      const res = await ExecutionRunner.run<MarkdownProcessorOutput>(cap, {
        markdownText: sampleMd,
        operation: "headings",
      });
      expect(res.success).toBe(true);
      expect(res.data?.headings).toHaveLength(3);
      expect(res.data?.headings?.[0].text).toBe("Main Architecture");
    });

    it("Golden 2: Generate Table of Contents (TOC)", async () => {
      const res = await ExecutionRunner.run<MarkdownProcessorOutput>(cap, {
        markdownText: sampleMd,
        operation: "toc",
      });
      expect(res.success).toBe(true);
      expect(res.data?.toc).toContain("- [Main Architecture](#main-architecture)");
      expect(res.data?.toc).toContain("  - [Core Engine](#core-engine)");
    });

    it("Golden 3: Extract code blocks and language identifiers", async () => {
      const res = await ExecutionRunner.run<MarkdownProcessorOutput>(cap, {
        markdownText: sampleMd,
        operation: "code_blocks",
      });
      expect(res.success).toBe(true);
      expect(res.data?.codeBlocks).toHaveLength(1);
      expect(res.data?.codeBlocks?.[0].language).toBe("typescript");
    });
  });

  describe("JWT Inspector Golden Prompts (jwt_inspector)", () => {
    const cap = registry.get("jwt_inspector")!;
    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    it("Golden 1: Inspect JWT header, claims, and payload", async () => {
      const res = await ExecutionRunner.run<JwtInspectionOutput>(cap, {
        token: sampleJwt,
      });
      expect(res.success).toBe(true);
      expect(res.data?.validStructure).toBe(true);
      expect(res.data?.header.alg).toBe("HS256");
      expect(res.data?.subject).toBe("1234567890");
      expect(res.data?.payload.admin).toBe(true);
    });
  });

  describe("URL Analyzer Golden Prompts (url_analyzer)", () => {
    const cap = registry.get("url_analyzer")!;

    it("Golden 1: Decompose complex URL structure with query params and port", async () => {
      const res = await ExecutionRunner.run<UrlAnalyzerOutput>(cap, {
        url: "https://api.quilonix.dev:8443/v1/search?query=mcp&filter=free&filter=fast#results",
      });
      expect(res.success).toBe(true);
      expect(res.data?.components.protocol).toBe("https");
      expect(res.data?.components.hostname).toBe("api.quilonix.dev");
      expect(res.data?.components.port).toBe("8443");
      expect(res.data?.components.pathname).toBe("/v1/search");
      expect(res.data?.components.queryParams.filter).toEqual(["free", "fast"]);
      expect(res.data?.components.hash).toBe("results");
    });
  });

  describe("Color Converter Golden Prompts (color_converter)", () => {
    const cap = registry.get("color_converter")!;

    it("Golden 1: Convert #D4AF37 to RGB, HSL, and calculate luminance", async () => {
      const res = await ExecutionRunner.run<ColorConverterOutput>(cap, {
        color: "#D4AF37",
      });
      expect(res.success).toBe(true);
      expect(res.data?.formats.rgb).toBe("rgb(212, 175, 55)");
      expect(res.data?.formats.hsl).toContain("hsl(46");
      expect(res.data?.metrics.relativeLuminance).toBeGreaterThan(0.3);
    });
  });

  describe("SQL Processor Golden Prompts (sql_processor)", () => {
    const cap = registry.get("sql_processor")!;

    it("Golden 1: Format unformatted SQL query with JOIN and WHERE", async () => {
      const res = await ExecutionRunner.run<SqlProcessorOutput>(cap, {
        sql: "select u.id, u.email from users u inner join accounts a on u.id = a.user_id where a.balance > 1000 order by u.id asc;",
        operation: "format",
      });
      expect(res.success).toBe(true);
      expect(res.data?.result).toContain("SELECT");
      expect(res.data?.result).toContain("INNER JOIN");
      expect(res.data?.result).toContain("ORDER BY");
    });

    it("Golden 2: Inspect tables and placeholders referenced in query", async () => {
      const res = await ExecutionRunner.run<SqlProcessorOutput>(cap, {
        sql: "SELECT * FROM orders WHERE customer_id = $1 AND status = 'COMPLETED';",
        operation: "inspect",
      });
      expect(res.success).toBe(true);
      expect(res.data?.stats?.totalTables).toContain("orders");
      expect(res.data?.stats?.totalParameters).toContain("$1");
    });
  });

  describe("XML Processor Golden Prompts (xml_processor)", () => {
    const cap = registry.get("xml_processor")!;

    it("Golden 1: Convert XML to JSON", async () => {
      const res = await ExecutionRunner.run<XmlProcessorOutput>(cap, {
        xmlString: `<catalog><item id="1"><title>Widget</title><price>9.99</price></item></catalog>`,
        operation: "to_json",
      });
      expect(res.success).toBe(true);
      expect(res.data?.jsonData?.catalog).toBeDefined();
    });

    it("Golden 2: Inspect XML hierarchy and element count", async () => {
      const res = await ExecutionRunner.run<XmlProcessorOutput>(cap, {
        xmlString: `<root xmlns="http://example.com"><child1/><child2/></root>`,
        operation: "inspect",
      });
      expect(res.success).toBe(true);
      expect(res.data?.stats?.elementCount).toBe(3);
      expect(res.data?.stats?.rootElement).toBe("root");
    });
  });

  describe("HTML Processor Golden Prompts (html_processor)", () => {
    const cap = registry.get("html_processor")!;

    it("Golden 1: Extract links, headings, and clean text from HTML document", async () => {
      const res = await ExecutionRunner.run<HtmlProcessorOutput>(cap, {
        htmlText: `<html><body><h1>API Docs</h1><p>Read the <a href="https://quilonix.dev">docs</a></p></body></html>`,
        operation: "extract",
      });
      expect(res.success).toBe(true);
      expect(res.data?.extracted?.headings?.[0].text).toBe("API Docs");
      expect(res.data?.extracted?.links?.[0].href).toBe("https://quilonix.dev");
      expect(res.data?.extracted?.text).toContain("API Docs");
    });

    it("Golden 2: Clean dangerous script tags and inline onclick handlers", async () => {
      const res = await ExecutionRunner.run<HtmlProcessorOutput>(cap, {
        htmlText: `<div onclick="evil()"><h3>Safe</h3><script>alert(1)</script></div>`,
        operation: "clean",
      });
      expect(res.success).toBe(true);
      expect(res.data?.cleanResult?.cleanedHtml).not.toContain("<script>");
      expect(res.data?.cleanResult?.cleanedHtml).not.toContain("onclick=");
      expect(res.data?.cleanResult?.cleanedHtml).toContain("<h3>Safe</h3>");
    });
  });

  describe("Cron Analyzer Golden Prompts (cron_analyzer)", () => {
    const cap = registry.get("cron_analyzer")!;

    it("Golden 1: Explain cron expression in plain English", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(cap, {
        expression: "0 9 * * 1-5",
        operation: "explain",
      });
      expect(res.success).toBe(true);
      expect(res.data?.explanation).toContain("09:00");
      expect(res.data?.explanation).toContain("Monday through Friday");
    });

    it("Golden 2: Calculate next 3 matching occurrences from deterministic base time", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(cap, {
        expression: "0 0 1 * *",
        operation: "next_matches",
        baseTime: "2025-01-01T00:00:00.000Z",
        count: 3,
      });
      expect(res.success).toBe(true);
      expect(res.data?.matches).toHaveLength(3);
      expect(res.data?.matches?.[0].iso).toBe("2025-02-01T00:00:00.000Z");
      expect(res.data?.matches?.[1].iso).toBe("2025-03-01T00:00:00.000Z");
      expect(res.data?.matches?.[2].iso).toBe("2025-04-01T00:00:00.000Z");
    });
  });

  describe("MIME Analyzer Golden Prompts (mime_analyzer)", () => {
    const cap = registry.get("mime_analyzer")!;

    it("Golden 1: Detect PNG image from Hex magic bytes", async () => {
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(cap, {
        byteSample: "89504E470D0A1A0A0000000D49484452",
      });
      expect(res.success).toBe(true);
      expect(res.data?.detectedMimeType).toBe("image/png");
      expect(res.data?.category).toBe("image");
      expect(res.data?.confidence).toBe("high");
    });

    it("Golden 2: Identify extension and declared MIME mismatch", async () => {
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(cap, {
        filename: "document.pdf",
        declaredMimeType: "image/png",
      });
      expect(res.success).toBe(true);
      expect(res.data?.mismatchDetected).toBe(true);
    });
  });

  describe("Cross-Capability Selection & Tool Disambiguation", () => {
    it("Disambiguation 1: JSON compare vs JSON format -> text_diff_analyzer", async () => {
      const diffCap = registry.get("text_diff_analyzer")!;
      const res = await ExecutionRunner.run<TextDiffOutput>(diffCap, {
        original: '{"port": 3000, "debug": true}',
        modified: '{"port": 8080, "debug": false}',
        mode: "line",
      });
      expect(res.success).toBe(true);
      expect(res.data?.identical).toBe(false);
    });

    it("Disambiguation 2: CSV to JSON vs JSON format -> csv_processor", async () => {
      const csvCap = registry.get("csv_processor")!;
      const res = await ExecutionRunner.run<CsvProcessorOutput>(csvCap, {
        csvText: "name,role\nAlice,Admin\nBob,Member",
        operation: "to_json",
      });
      expect(res.success).toBe(true);
      expect(res.data?.jsonData).toHaveLength(2);
    });

    it("Disambiguation 3: JWT claims inspection vs general hash -> jwt_inspector", async () => {
      const jwtCap = registry.get("jwt_inspector")!;
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiaWF0IjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o";
      const res = await ExecutionRunner.run<JwtInspectionOutput>(jwtCap, {
        token,
      });
      expect(res.success).toBe(true);
      expect(res.data?.subject).toBe("1234567890");
    });

    it("Disambiguation 4: Static URL decomposition vs regex extraction -> url_analyzer", async () => {
      const urlCap = registry.get("url_analyzer")!;
      const res = await ExecutionRunner.run<UrlAnalyzerOutput>(urlCap, {
        url: "https://example.com:3000/api/v1/resource?filter=active",
      });
      expect(res.success).toBe(true);
      expect(res.data?.components.port).toBe("3000");
    });

    it("Disambiguation 5: SQL text format vs database execution -> sql_processor", async () => {
      const sqlCap = registry.get("sql_processor")!;
      const res = await ExecutionRunner.run<SqlProcessorOutput>(sqlCap, {
        sql: "select count(*) from logs where created_at > now() - interval '1 day';",
        operation: "format",
      });
      expect(res.success).toBe(true);
      expect(res.data?.result).toContain("SELECT");
    });

    it("Disambiguation 6: XML to JSON vs CSV to JSON -> xml_processor", async () => {
      const xmlCap = registry.get("xml_processor")!;
      const res = await ExecutionRunner.run<XmlProcessorOutput>(xmlCap, {
        xmlString: "<config><env>production</env></config>",
        operation: "to_json",
      });
      expect(res.success).toBe(true);
      expect(res.data?.jsonData?.config).toBeDefined();
    });

    it("Disambiguation 7: HTML extraction vs Markdown processing -> html_processor", async () => {
      const htmlCap = registry.get("html_processor")!;
      const res = await ExecutionRunner.run<HtmlProcessorOutput>(htmlCap, {
        htmlText: "<h2>Release Notes</h2><p>V1 is live</p>",
        operation: "extract",
      });
      expect(res.success).toBe(true);
      expect(res.data?.extracted?.headings?.[0].text).toBe("Release Notes");
    });

    it("Disambiguation 8: Cron explanation vs time conversion -> cron_analyzer", async () => {
      const cronCap = registry.get("cron_analyzer")!;
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(cronCap, {
        expression: "*/30 * * * *",
        operation: "explain",
      });
      expect(res.success).toBe(true);
      expect(res.data?.explanation).toBe("Every 30 minutes");
    });

    it("Disambiguation 9: Magic byte detection vs cryptographic hash -> mime_analyzer", async () => {
      const mimeCap = registry.get("mime_analyzer")!;
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(mimeCap, {
        byteSample: "47494638396101000100800000000000",
      });
      expect(res.success).toBe(true);
      expect(res.data?.detectedMimeType).toBe("image/gif");
    });
  });
});
