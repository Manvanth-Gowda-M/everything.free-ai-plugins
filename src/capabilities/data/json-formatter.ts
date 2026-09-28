import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const JsonFormatterInputSchema = z.object({
  jsonString: z
    .string()
    .min(1, "Input JSON string cannot be empty")
    .max(1_000_000, "Input JSON string exceeds maximum size limit of 1MB"),
  action: z
    .enum(["format", "minify", "validate", "inspect"])
    .default("format")
    .describe("Action to perform: format (pretty-print), minify, validate (check syntax), or inspect (structural analysis)"),
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .optional()
    .describe("Indentation spaces for formatting (default: 2)"),
});

export type JsonFormatterInput = z.infer<typeof JsonFormatterInputSchema>;

export interface JsonInspectionStats {
  rootType: "object" | "array" | "string" | "number" | "boolean" | "null";
  byteSize: number;
  keyCount?: number;
  itemCount?: number;
  maxDepth: number;
}

export interface JsonFormatterOutput {
  valid: boolean;
  action: "format" | "minify" | "validate" | "inspect";
  result?: string;
  stats?: JsonInspectionStats;
  syntaxError?: {
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
  };
}

/**
 * Calculates max nesting depth of a parsed JSON object.
 */
function calculateDepth(obj: unknown, currentDepth = 1): number {
  if (obj === null || typeof obj !== "object") {
    return currentDepth;
  }
  let max = currentDepth;
  const values = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>);
  for (const val of values) {
    if (val !== null && typeof val === "object") {
      const depth = calculateDepth(val, currentDepth + 1);
      if (depth > max) max = depth;
    }
  }
  return max;
}

/**
 * Extracts line, column, and snippet from a JSON.parse syntax error.
 */
function parseJsonSyntaxError(jsonStr: string, errorMsg: string) {
  let line = 1;
  let column = 1;

  // Try extracting position from standard V8 error: "Unexpected token X in JSON at position 42" or "at line X column Y"
  const posMatch = errorMsg.match(/at position (\d+)/i);
  const lineColMatch = errorMsg.match(/line (\d+) column (\d+)/i);

  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
  } else if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const lines = jsonStr.slice(0, pos).split("\n");
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  }

  // Create context snippet
  const allLines = jsonStr.split("\n");
  const startLine = Math.max(0, line - 2);
  const endLine = Math.min(allLines.length, line + 1);
  const snippet = allLines
    .slice(startLine, endLine)
    .map((l, idx) => {
      const currLineNum = startLine + idx + 1;
      const marker = currLineNum === line ? " > " : "   ";
      return `${marker}${currLineNum}: ${l}`;
    })
    .join("\n");

  return {
    message: errorMsg,
    line,
    column,
    snippet,
  };
}

export class JsonFormatterValidatorCapability
  implements Capability<typeof JsonFormatterInputSchema, JsonFormatterOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "json_formatter_validator",
    version: "1.0.0",
    category: "data",
    displayName: "JSON Formatter & Validator",
    description:
      "Validates, formats (pretty-prints), minifies, and inspects JSON data with detailed syntax error diagnostics and structural analysis. 100% local, free, and privacy-safe.",
    isFree: true,
    requiresExternalNetwork: false,
    timeoutMs: 3000,
  };

  public readonly inputSchema = JsonFormatterInputSchema;

  public async execute(
    input: JsonFormatterInput
  ): Promise<CapabilityResult<JsonFormatterOutput>> {
    const { jsonString, action = "format", indent = 2 } = input;

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Invalid JSON syntax";
      const syntaxError = parseJsonSyntaxError(jsonString, errorMsg);

      return {
        success: true,
        data: {
          valid: false,
          action,
          syntaxError,
        },
      };
    }

    // JSON is valid
    if (action === "validate") {
      return {
        success: true,
        data: {
          valid: true,
          action: "validate",
        },
      };
    }

    if (action === "minify") {
      return {
        success: true,
        data: {
          valid: true,
          action: "minify",
          result: JSON.stringify(parsed),
        },
      };
    }

    if (action === "inspect") {
      const rootType = (
        parsed === null
          ? "null"
          : Array.isArray(parsed)
            ? "array"
            : typeof parsed
      ) as JsonInspectionStats["rootType"];

      const stats: JsonInspectionStats = {
        rootType,
        byteSize: Buffer.byteLength(jsonString, "utf8"),
        maxDepth: calculateDepth(parsed),
      };

      if (rootType === "object" && parsed !== null) {
        stats.keyCount = Object.keys(parsed as Record<string, unknown>).length;
      } else if (rootType === "array") {
        stats.itemCount = (parsed as unknown[]).length;
      }

      return {
        success: true,
        data: {
          valid: true,
          action: "inspect",
          stats,
        },
      };
    }

    // Default action: "format"
    return {
      success: true,
      data: {
        valid: true,
        action: "format",
        result: JSON.stringify(parsed, null, indent),
      },
    };
  }
}
