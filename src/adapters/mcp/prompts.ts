import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface PromptArgumentDefinition {
  name: string;
  description: string;
  required: boolean;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: PromptArgumentDefinition[];
}

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    name: "analyze_json",
    description: "Guides the AI assistant to inspect, validate, format, or minify JSON data locally using json_formatter_validator.",
    arguments: [
      { name: "json", description: "The JSON string to analyze, format, or validate", required: true },
      { name: "operation", description: "Desired action (validate, format, minify, inspect)", required: false },
    ],
  },
  {
    name: "analyze_csv",
    description: "Guides the AI assistant to parse, inspect, filter, or convert CSV datasets locally using csv_processor.",
    arguments: [
      { name: "csv", description: "The raw CSV text to analyze", required: true },
      { name: "goal", description: "Desired goal or operation (inspect, filter, sort, to_json)", required: false },
    ],
  },
  {
    name: "analyze_text",
    description: "Guides the AI assistant to compare differences or extract Markdown structure locally using text_diff_analyzer or markdown_processor.",
    arguments: [
      { name: "text", description: "Primary text or Markdown content", required: true },
      { name: "secondaryText", description: "Modified text for diff comparison", required: false },
      { name: "focus", description: "Focus area (diff, structure, toc, headings)", required: false },
    ],
  },
  {
    name: "analyze_web_document",
    description: "Guides the AI assistant to inspect, extract, or sanitize offline HTML markup or analyze URLs without network access.",
    arguments: [
      { name: "documentText", description: "HTML content or URL string to analyze offline", required: true },
      { name: "focus", description: "Target analysis focus (headings, links, sanitize, url-components)", required: false },
    ],
  },
  {
    name: "developer_debug",
    description: "Guides the AI assistant to test regex, inspect JWT tokens, decompose URLs, analyze MIME types, or format SQL offline.",
    arguments: [
      { name: "content", description: "Payload, token, regex, or query to debug", required: true },
      { name: "artifactType", description: "Type of artifact (regex, jwt, url, mime, sql, xml)", required: false },
    ],
  },
  {
    name: "data_transform",
    description: "Guides the AI assistant to convert structured data between JSON, CSV, and XML formats offline.",
    arguments: [
      { name: "data", description: "Input data string to transform", required: true },
      { name: "sourceFormat", description: "Source data format (json, csv, xml)", required: true },
      { name: "targetFormat", description: "Target format for output (json, csv, xml)", required: true },
    ],
  },
  {
    name: "schedule_analysis",
    description: "Guides the AI assistant to explain, validate, or compute next run times for cron schedules using cron_analyzer.",
    arguments: [
      { name: "expression", description: "Cron expression string (e.g., '0 9 * * 1-5' or '@hourly')", required: true },
      { name: "baseTimestamp", description: "Optional ISO 8601 timestamp reference", required: false },
    ],
  },
];

export function buildAnalyzeJsonPrompt(args: { json: string; operation?: string }): string {
  return `Please analyze the following JSON payload using the 'json_formatter_validator' capability.
Requested Operation: ${args.operation || "validate"}

Capabilities to utilize:
- json_formatter_validator (for format, minify, validate, or inspect operations)

Instructions:
1. Validate JSON syntax and structure.
2. ${args.operation === "format" ? "Format the JSON with consistent indentation." : "Inspect the key schema and depth."}
3. Report any parsing errors or structural anomalies cleanly.

JSON Payload:
\`\`\`json
${args.json}
\`\`\`

Security Reminder: Processing is 100% local and offline. Do not send payload to external servers.`;
}

export function buildAnalyzeCsvPrompt(args: { csv: string; goal?: string }): string {
  return `Please analyze the provided CSV dataset using the 'csv_processor' capability.
Goal: ${args.goal || "inspect tabular schema and rows"}

Capabilities to utilize:
- csv_processor (supports inspect, filter, sort, and to_json conversions)

Instructions:
1. Parse the header line and verify column delimiters.
2. Inspect row counts, column types, and null/empty distributions.
3. Perform requested transformation locally without persisting data.

CSV Data:
\`\`\`csv
${args.csv}
\`\`\`

Security Reminder: Local processing only with zero data retention.`;
}

export function buildAnalyzeTextPrompt(args: { text: string; secondaryText?: string; focus?: string }): string {
  const isDiff = Boolean(args.secondaryText);
  return `Please analyze the following text payload locally.
Focus: ${args.focus || (isDiff ? "diff" : "markdown structure")}

Capabilities to utilize:
- text_diff_analyzer (for line/word difference comparisons)
- markdown_processor (for headings, table of contents, and code blocks)

${isDiff ? `Compare the two versions below and summarize additions, deletions, and modifications:\n\nOriginal:\n\`\`\`text\n${args.text}\n\`\`\`\n\nModified:\n\`\`\`text\n${args.secondaryText}\n\`\`\`` : `Inspect the structure and formatting of the Markdown content below:\n\`\`\`markdown\n${args.text}\n\`\`\``}

Security Reminder: Strictly local processing.`;
}

export function buildAnalyzeWebDocumentPrompt(args: { documentText: string; focus?: string }): string {
  return `Please analyze the provided web document markup or URL locally.
Focus: ${args.focus || "inspect"}

Capabilities to utilize:
- html_processor (inspect tags, extract text, sanitize malicious elements)
- url_analyzer (parse protocol, hostname, query parameters)

Instructions:
1. Parse the supplied HTML/URL offline.
2. Do NOT attempt to fetch external web pages or initiate network requests.
3. Extract structure or sanitize according to safety parameters.

Document Input:
\`\`\`html
${args.documentText}
\`\`\`

Security Reminder: Zero outbound network traffic is permitted.`;
}

export function buildDeveloperDebugPrompt(args: { content: string; artifactType?: string }): string {
  return `Please debug the supplied developer artifact using Everything.Free local tools.
Artifact Type: ${args.artifactType || "auto-detect"}

Available Local Capabilities:
- regex_tester (test patterns, extract match groups, safe ReDoS boundaries)
- jwt_inspector (inspect JWT header and claims without signature verification)
- url_analyzer (decompose and validate URLs and query params)
- mime_analyzer (identify MIME type from extension or magic byte header)
- sql_processor (format, inspect, or validate SQL queries offline)
- hash_and_encoding (encode/decode base64, hex, or compute standard hashes)

Input to Debug:
\`\`\`text
${args.content}
\`\`\`

Security Reminder: All debugging tools operate offline and in-memory.`;
}

export function buildDataTransformPrompt(args: { data: string; sourceFormat: string; targetFormat: string }): string {
  return `Please convert the provided structured data from ${args.sourceFormat.toUpperCase()} to ${args.targetFormat.toUpperCase()}.

Capabilities to utilize:
- json_formatter_validator (for JSON formatting and transformation)
- csv_processor (for CSV-to-JSON and JSON-to-CSV)
- xml_processor (for XML-to-JSON conversions)
- sql_processor (for SQL schema inspections)

Source Format: ${args.sourceFormat}
Target Format: ${args.targetFormat}

Data to Convert:
\`\`\`${args.sourceFormat}
${args.data}
\`\`\`

Security Reminder: Perform bounded deterministic local conversion in volatile memory.`;
}

export function buildScheduleAnalysisPrompt(args: { expression: string; baseTimestamp?: string }): string {
  return `Please explain and analyze the cron expression '${args.expression}' using the 'cron_analyzer' capability.
Base Reference Timestamp: ${args.baseTimestamp || "2025-01-01T00:00:00.000Z"}

Capabilities to utilize:
- cron_analyzer (explain expression in natural language, validate syntax, compute upcoming run timestamps)

Instructions:
1. Verify 5-field standard cron syntax.
2. Explain schedule semantics clearly (minute, hour, day-of-month, month, day-of-week).
3. Compute the next deterministic schedule occurrences from the base timestamp.

Cron Expression: \`${args.expression}\`

Security Reminder: Deterministic local calculation only.`;
}

/**
 * Registers curated MCP Prompts onto the McpServer instance.
 */
export function registerPrompts(server: McpServer): void {
  // 1. analyze_json
  server.prompt(
    "analyze_json",
    "Inspect, validate, format, or minify JSON data locally",
    {
      json: z.string().describe("The JSON string to analyze, format, or validate"),
      operation: z.enum(["validate", "format", "minify", "inspect"]).optional().describe("Desired action (default: validate)"),
    },
    async (args) => ({
      description: "Analyze JSON data using json_formatter_validator",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildAnalyzeJsonPrompt(args),
          },
        },
      ],
    })
  );

  // 2. analyze_csv
  server.prompt(
    "analyze_csv",
    "Parse, inspect, filter, or convert tabular CSV data locally",
    {
      csv: z.string().describe("The raw CSV text to analyze"),
      goal: z.string().optional().describe("Desired CSV goal or operation (default: inspect)"),
    },
    async (args) => ({
      description: "Analyze CSV data using csv_processor",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildAnalyzeCsvPrompt(args),
          },
        },
      ],
    })
  );

  // 3. analyze_text
  server.prompt(
    "analyze_text",
    "Compare text diffs or extract Markdown structure locally",
    {
      text: z.string().describe("Primary text or Markdown content to analyze"),
      secondaryText: z.string().optional().describe("Modified text when performing a diff comparison"),
      focus: z.string().optional().describe("Focus area (diff, structure, toc, headings)"),
    },
    async (args) => ({
      description: args.secondaryText ? "Compute text diff" : "Analyze Markdown document",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildAnalyzeTextPrompt(args),
          },
        },
      ],
    })
  );

  // 4. analyze_web_document
  server.prompt(
    "analyze_web_document",
    "Inspect, extract, or sanitize offline HTML markup or URLs without network requests",
    {
      documentText: z.string().describe("HTML markup string or URL string to inspect or clean"),
      focus: z.string().optional().describe("Target analysis focus (headings, links, sanitize, url-components)"),
    },
    async (args) => ({
      description: "Analyze HTML markup or URL using html_processor or url_analyzer",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildAnalyzeWebDocumentPrompt(args),
          },
        },
      ],
    })
  );

  // 5. developer_debug
  server.prompt(
    "developer_debug",
    "Debug regex, inspect JWT tokens, decompose URLs, or analyze MIME byte headers",
    {
      content: z.string().describe("Payload, token, regex, or query to debug"),
      artifactType: z.enum(["regex", "jwt", "url", "mime", "sql", "xml"]).optional().describe("Specific debugging artifact type"),
    },
    async (args) => ({
      description: "Developer debugging workflow",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildDeveloperDebugPrompt(args),
          },
        },
      ],
    })
  );

  // 6. data_transform
  server.prompt(
    "data_transform",
    "Convert structured data between JSON, CSV, and XML formats offline",
    {
      data: z.string().describe("Input data string to transform"),
      sourceFormat: z.enum(["csv", "xml", "json"]).describe("Source format of input data"),
      targetFormat: z.enum(["json", "csv", "xml"]).describe("Target format for output"),
    },
    async (args) => ({
      description: "Data transformation workflow",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildDataTransformPrompt(args),
          },
        },
      ],
    })
  );

  // 7. schedule_analysis
  server.prompt(
    "schedule_analysis",
    "Explain, validate, or compute next run times for cron schedules",
    {
      expression: z.string().describe("Cron expression string (e.g. '0 9 * * 1-5' or '@daily')"),
      baseTimestamp: z.string().optional().describe("Optional ISO 8601 base timestamp for deterministic recurrence calculation"),
    },
    async (args) => ({
      description: "Analyze cron schedule expression",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: buildScheduleAnalysisPrompt(args),
          },
        },
      ],
    })
  );
}
