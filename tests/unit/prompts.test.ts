import { describe, it, expect } from "vitest";
import {
  PROMPT_DEFINITIONS,
  buildAnalyzeJsonPrompt,
  buildAnalyzeCsvPrompt,
  buildAnalyzeTextPrompt,
  buildAnalyzeWebDocumentPrompt,
  buildDeveloperDebugPrompt,
  buildDataTransformPrompt,
  buildScheduleAnalysisPrompt,
} from "../../src/adapters/mcp/prompts.js";

describe("MCP Prompts Unit Tests", () => {
  it("should define exactly 7 curated prompts", () => {
    expect(PROMPT_DEFINITIONS.length).toBe(7);
    const names = PROMPT_DEFINITIONS.map((p) => p.name).sort();
    expect(names).toEqual([
      "analyze_csv",
      "analyze_json",
      "analyze_text",
      "analyze_web_document",
      "data_transform",
      "developer_debug",
      "schedule_analysis",
    ]);
  });

  it("should have clear descriptions and argument definitions for all prompts", () => {
    for (const def of PROMPT_DEFINITIONS) {
      expect(def.name).toMatch(/^[a-z_]+$/);
      expect(def.description.length).toBeGreaterThan(20);
      expect(def.arguments.length).toBeGreaterThanOrEqual(1);

      for (const arg of def.arguments) {
        expect(arg.name).toBeDefined();
        expect(arg.description.length).toBeGreaterThan(5);
        expect(typeof arg.required).toBe("boolean");
      }
    }
  });

  describe("Prompt Content & Generation Builders", () => {
    it("generates analyze_json prompt with capability guidance", () => {
      const prompt = buildAnalyzeJsonPrompt({
        json: '{"id": 1, "name": "test"}',
        operation: "format",
      });
      expect(prompt).toContain("json_formatter_validator");
      expect(prompt).toContain('{"id": 1, "name": "test"}');
      expect(prompt).toContain("Format the JSON");
      expect(prompt).toContain("Security Reminder");
    });

    it("generates analyze_csv prompt with safe tabular guidance", () => {
      const prompt = buildAnalyzeCsvPrompt({
        csv: "id,name\n1,Alice",
        goal: "Convert to JSON",
      });
      expect(prompt).toContain("csv_processor");
      expect(prompt).toContain("id,name");
      expect(prompt).toContain("Convert to JSON");
    });

    it("generates analyze_text prompt with diff/markdown guidance", () => {
      const prompt = buildAnalyzeTextPrompt({
        text: "Sample text payload",
        secondaryText: "Modified payload",
        focus: "diff",
      });
      expect(prompt).toContain("text_diff_analyzer");
      expect(prompt).toContain("markdown_processor");
      expect(prompt).toContain("Sample text payload");
      expect(prompt).toContain("Modified payload");
    });

    it("generates analyze_web_document prompt with local HTML/URL offline constraints", () => {
      const prompt = buildAnalyzeWebDocumentPrompt({
        documentText: "<html><title>Sample</title><body>Hello</body></html>",
        focus: "inspect",
      });
      expect(prompt).toContain("html_processor");
      expect(prompt).toContain("url_analyzer");
      expect(prompt).toContain("Do NOT attempt to fetch external web pages");
    });

    it("generates developer_debug prompt for multi-tool debugging", () => {
      const prompt = buildDeveloperDebugPrompt({
        artifactType: "jwt",
        content: "eyJhbGciOi...",
      });
      expect(prompt).toContain("jwt_inspector");
      expect(prompt).toContain("regex_tester");
      expect(prompt).toContain("mime_analyzer");
      expect(prompt).toContain("sql_processor");
      expect(prompt).toContain("hash_and_encoding");
      expect(prompt).toContain("eyJhbGciOi...");
    });

    it("generates data_transform prompt for structured data conversions", () => {
      const prompt = buildDataTransformPrompt({
        sourceFormat: "xml",
        targetFormat: "json",
        data: "<item>value</item>",
      });
      expect(prompt).toContain("xml_processor");
      expect(prompt).toContain("csv_processor");
      expect(prompt).toContain("json_formatter_validator");
      expect(prompt).toContain("sql_processor");
      expect(prompt).toContain("<item>value</item>");
    });

    it("generates schedule_analysis prompt for cron parsing", () => {
      const prompt = buildScheduleAnalysisPrompt({
        expression: "*/15 * * * *",
        baseTimestamp: "2026-09-29T12:00:00Z",
      });
      expect(prompt).toContain("cron_analyzer");
      expect(prompt).toContain("*/15 * * * *");
      expect(prompt).toContain("2026-09-29T12:00:00Z");
    });
  });

  describe("Prompt Security & Privacy Guardrails", () => {
    it("ensures prompts never ask for API keys, external requests, or database storage", () => {
      const samples = [
        buildAnalyzeJsonPrompt({ json: "{}" }),
        buildAnalyzeCsvPrompt({ csv: "a,b" }),
        buildAnalyzeTextPrompt({ text: "hello" }),
        buildAnalyzeWebDocumentPrompt({ documentText: "<h1>Hi</h1>" }),
        buildDeveloperDebugPrompt({ artifactType: "sql", content: "select 1" }),
        buildDataTransformPrompt({ sourceFormat: "json", targetFormat: "csv", data: "[]" }),
        buildScheduleAnalysisPrompt({ expression: "* * * * *" }),
      ];

      for (const sample of samples) {
        expect(sample).not.toContain("api_key");
        expect(sample).not.toContain("http://external-api");
        expect(sample).not.toContain("store in database");
        expect(sample).toContain("local");
      }
    });
  });
});
