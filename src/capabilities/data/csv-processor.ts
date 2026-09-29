import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const CsvFilterOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "less_than",
  "greater_or_equal",
  "less_or_equal",
]);

export const CsvProcessorInputSchema = z.object({
  csvText: z
    .string()
    .min(1, "CSV text cannot be empty")
    .max(500_000, "CSV text exceeds maximum size limit of 500KB")
    .describe("The raw CSV formatted text string to process"),
  operation: z
    .enum(["parse", "inspect", "filter", "sort", "select_columns", "to_json"])
    .default("parse")
    .describe(
      "Operation to perform:\n" +
        "- 'parse': Parses CSV into structured headers and raw 2D row array\n" +
        "- 'inspect': Reports structural analysis (row/col counts, header names, empty cell counts, inferred column types)\n" +
        "- 'filter': Filters rows using a safe structured condition (column, operator, value)\n" +
        "- 'sort': Sorts rows by a specified column in ascending or descending order\n" +
        "- 'select_columns': Returns a projected CSV containing only the specified columns\n" +
        "- 'to_json': Converts CSV records into an array of JSON objects keyed by header names"
    ),
  hasHeader: z
    .boolean()
    .default(true)
    .optional()
    .describe("Whether the first row represents column headers (default: true)"),
  delimiter: z
    .string()
    .max(2)
    .default(",")
    .optional()
    .describe("Column delimiter character (default: ',')"),
  // Filter options
  filterColumn: z
    .string()
    .optional()
    .describe(
      "Column name or 0-based column index to filter on (required when operation is 'filter')"
    ),
  filterOperator: CsvFilterOperatorSchema.optional().describe(
    "Safe comparison operator for filtering: 'equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal'"
  ),
  filterValue: z.string().optional().describe("Comparison value for filter condition"),
  // Sort options
  sortColumn: z
    .string()
    .optional()
    .describe("Column name or 0-based index to sort by (required when operation is 'sort')"),
  sortDirection: z
    .enum(["asc", "desc"])
    .default("asc")
    .optional()
    .describe("Sort order: 'asc' (ascending) or 'desc' (descending)"),
  // Column selection options
  selectedColumns: z
    .array(z.string())
    .max(50)
    .optional()
    .describe("Array of column names or indexes to select when operation is 'select_columns'"),
});

export type CsvProcessorInput = z.infer<typeof CsvProcessorInputSchema>;

export interface CsvInspectStats {
  rowCount: number;
  columnCount: number;
  headers: string[];
  emptyCellsCount: number;
  columnTypes: Record<string, "number" | "boolean" | "string">;
}

export interface CsvProcessorOutput {
  operation: "parse" | "inspect" | "filter" | "sort" | "select_columns" | "to_json";
  headers?: string[];
  rowCount?: number;
  rows?: string[][];
  stats?: CsvInspectStats;
  jsonData?: Array<Record<string, string | number | boolean | null>>;
  csvOutput?: string;
}

/**
 * Robust RFC 4180 compliant CSV parser that handles quoted commas, quotes, and newlines.
 */
function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  const len = text.length;
  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0].trim() === ""));
}

/**
 * Format 2D array back to CSV string.
 */
function serializeCsv(headers: string[], rows: string[][], delimiter = ","): string {
  const allRows = headers.length > 0 ? [headers, ...rows] : rows;
  return allRows
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(delimiter) || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(delimiter)
    )
    .join("\n");
}

export class CsvProcessorCapability implements Capability<
  typeof CsvProcessorInputSchema,
  CsvProcessorOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "csv_processor",
    version: "1.0.0",
    category: "data",
    pack: "Data Pack",
    displayName: "CSV Data Processor",
    description:
      "Use when the user asks to parse, inspect, filter, sort, column-select, or convert CSV data to JSON. " +
      "Processes RFC 4180 CSV locally with zero remote execution and zero data storage. " +
      "Do NOT use for remote CSV URLs or modifying external SQL databases.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "parse",
        description: "Parses CSV text into structured headers and raw 2D array of rows",
        inputDescription: "csvText, delimiter (default ','), hasHeader (default true)",
        outputDescription: "{ headers, rows, rowCount }",
      },
      {
        name: "inspect",
        description:
          "Performs structural diagnostic analysis (row/col count, header list, empty cells, inferred types)",
        inputDescription: "csvText, delimiter (default ',')",
        outputDescription:
          "{ stats: { rowCount, columnCount, headers, emptyCellsCount, columnTypes } }",
      },
      {
        name: "filter",
        description:
          "Filters CSV rows using a safe declarative condition (column, operator, value)",
        inputDescription: "csvText, filterColumn, filterOperator, filterValue",
        outputDescription: "{ headers, rows, rowCount }",
      },
      {
        name: "sort",
        description: "Sorts CSV rows by specified column in ascending or descending order",
        inputDescription: "csvText, sortColumn, sortDirection ('asc' | 'desc')",
        outputDescription: "{ headers, rows, rowCount }",
      },
      {
        name: "select_columns",
        description: "Projects CSV to retain only specified columns",
        inputDescription: "csvText, selectedColumns: string[]",
        outputDescription: "{ headers, rows, rowCount, csvOutput }",
      },
      {
        name: "to_json",
        description: "Transforms CSV records into an array of JSON objects keyed by headers",
        inputDescription: "csvText, hasHeader (default true)",
        outputDescription: "{ jsonData: Array<Record<string, unknown>> }",
      },
    ],
    limits: {
      maxTextLength: 500_000,
      maxInputBytes: 500_000,
      maxRows: 5000,
      maxColumns: 100,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Deterministic in-memory CSV parser; formulas preserved as raw text without execution",
    },
    usageGuidance: {
      useWhen: [
        "User asks to parse a CSV text string into structured rows",
        "User asks to inspect CSV structure, column counts, or data types",
        "User asks to filter CSV rows based on a column condition",
        "User asks to sort CSV data by a column",
        "User asks to convert CSV table into JSON objects",
      ],
      doNotUseWhen: [
        "User asks to fetch a CSV file from a live web URL",
        "User asks to execute arbitrary SQL or code on a database",
        "User asks to format JSON (use json_formatter_validator)",
      ],
      exampleRequests: [
        "Inspect this CSV and tell me what columns and rows it contains",
        "Filter this CSV to rows where status equals 'active'",
        "Convert this CSV table into an array of JSON records",
        "Sort this CSV data by price descending",
      ],
    },
  };

  public readonly inputSchema = CsvProcessorInputSchema;

  public async execute(input: CsvProcessorInput): Promise<CapabilityResult<CsvProcessorOutput>> {
    const {
      csvText,
      operation = "parse",
      hasHeader = true,
      delimiter = ",",
      filterColumn,
      filterOperator,
      filterValue = "",
      sortColumn,
      sortDirection = "asc",
      selectedColumns,
    } = input;

    const parsedRows = parseCsv(csvText, delimiter);

    if (parsedRows.length === 0) {
      return {
        success: true,
        data: {
          operation,
          headers: [],
          rowCount: 0,
          rows: [],
        },
      };
    }

    const headers = hasHeader
      ? parsedRows[0].map((h, i) => (h.trim().length > 0 ? h.trim() : `col_${i + 1}`))
      : parsedRows[0].map((_, i) => `col_${i + 1}`);

    const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;

    // 1. Operation: parse
    if (operation === "parse") {
      return {
        success: true,
        data: {
          operation: "parse",
          headers,
          rowCount: dataRows.length,
          rows: dataRows,
        },
      };
    }

    // 2. Operation: inspect
    if (operation === "inspect") {
      let emptyCellsCount = 0;
      const colTypes: Record<string, "number" | "boolean" | "string"> = {};

      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const colName = headers[colIdx];
        let isNum = true;
        let isBool = true;
        let nonEmptyCount = 0;

        for (const row of dataRows) {
          const val = row[colIdx] !== undefined ? row[colIdx].trim() : "";
          if (val === "") {
            emptyCellsCount++;
            continue;
          }
          nonEmptyCount++;
          if (isNaN(Number(val))) isNum = false;
          if (!["true", "false", "0", "1", "yes", "no"].includes(val.toLowerCase())) isBool = false;
        }

        if (nonEmptyCount === 0) {
          colTypes[colName] = "string";
        } else if (isNum) {
          colTypes[colName] = "number";
        } else if (isBool) {
          colTypes[colName] = "boolean";
        } else {
          colTypes[colName] = "string";
        }
      }

      return {
        success: true,
        data: {
          operation: "inspect",
          stats: {
            rowCount: dataRows.length,
            columnCount: headers.length,
            headers,
            emptyCellsCount,
            columnTypes: colTypes,
          },
        },
      };
    }

    // Helper to resolve column index
    const getColIndex = (colSpec?: string): number => {
      if (!colSpec) return -1;
      const idx = headers.indexOf(colSpec);
      if (idx !== -1) return idx;
      const numIdx = parseInt(colSpec, 10);
      if (!isNaN(numIdx) && numIdx >= 0 && numIdx < headers.length) return numIdx;
      return -1;
    };

    // 3. Operation: filter
    if (operation === "filter") {
      if (!filterColumn || !filterOperator) {
        return {
          success: false,
          error: {
            code: "MISSING_ARGUMENTS",
            message:
              "Filter operation requires 'filterColumn' and 'filterOperator'. " +
              `Supported operators: ${CsvFilterOperatorSchema.options.join(", ")}`,
          },
        };
      }

      const colIdx = getColIndex(filterColumn);
      if (colIdx === -1) {
        return {
          success: false,
          error: {
            code: "COLUMN_NOT_FOUND",
            message: `Column '${filterColumn}' not found in CSV. Available columns: ${headers.join(", ")}`,
          },
        };
      }

      const filtered = dataRows.filter((row) => {
        const cell = row[colIdx] ?? "";
        const cellNum = Number(cell);
        const valNum = Number(filterValue);
        const isNumeric = !isNaN(cellNum) && !isNaN(valNum);

        switch (filterOperator) {
          case "equals":
            return isNumeric
              ? cellNum === valNum
              : cell.toLowerCase() === filterValue.toLowerCase();
          case "not_equals":
            return isNumeric
              ? cellNum !== valNum
              : cell.toLowerCase() !== filterValue.toLowerCase();
          case "contains":
            return cell.toLowerCase().includes(filterValue.toLowerCase());
          case "starts_with":
            return cell.toLowerCase().startsWith(filterValue.toLowerCase());
          case "ends_with":
            return cell.toLowerCase().endsWith(filterValue.toLowerCase());
          case "greater_than":
            return isNumeric ? cellNum > valNum : cell > filterValue;
          case "less_than":
            return isNumeric ? cellNum < valNum : cell < filterValue;
          case "greater_or_equal":
            return isNumeric ? cellNum >= valNum : cell >= filterValue;
          case "less_or_equal":
            return isNumeric ? cellNum <= valNum : cell <= filterValue;
        }
      });

      return {
        success: true,
        data: {
          operation: "filter",
          headers,
          rowCount: filtered.length,
          rows: filtered,
          csvOutput: serializeCsv(headers, filtered, delimiter),
        },
      };
    }

    // 4. Operation: sort
    if (operation === "sort") {
      if (!sortColumn) {
        return {
          success: false,
          error: {
            code: "MISSING_ARGUMENTS",
            message: `Sort operation requires 'sortColumn'. Available columns: ${headers.join(", ")}`,
          },
        };
      }

      const colIdx = getColIndex(sortColumn);
      if (colIdx === -1) {
        return {
          success: false,
          error: {
            code: "COLUMN_NOT_FOUND",
            message: `Column '${sortColumn}' not found in CSV. Available columns: ${headers.join(", ")}`,
          },
        };
      }

      const sorted = [...dataRows].sort((a, b) => {
        const valA = a[colIdx] ?? "";
        const valB = b[colIdx] ?? "";
        const numA = Number(valA);
        const numB = Number(valB);

        let cmp = 0;
        if (!isNaN(numA) && !isNaN(numB)) {
          cmp = numA - numB;
        } else {
          cmp = valA.localeCompare(valB);
        }
        return sortDirection === "desc" ? -cmp : cmp;
      });

      return {
        success: true,
        data: {
          operation: "sort",
          headers,
          rowCount: sorted.length,
          rows: sorted,
          csvOutput: serializeCsv(headers, sorted, delimiter),
        },
      };
    }

    // 5. Operation: select_columns
    if (operation === "select_columns") {
      if (!selectedColumns || selectedColumns.length === 0) {
        return {
          success: false,
          error: {
            code: "MISSING_ARGUMENTS",
            message: `Column selection requires 'selectedColumns' array. Available columns: ${headers.join(", ")}`,
          },
        };
      }

      const colIndices = selectedColumns
        .map((col) => ({ col, idx: getColIndex(col) }))
        .filter((c) => c.idx !== -1);

      if (colIndices.length === 0) {
        return {
          success: false,
          error: {
            code: "COLUMNS_NOT_FOUND",
            message: `None of the requested columns [${selectedColumns.join(", ")}] were found. Available: ${headers.join(", ")}`,
          },
        };
      }

      const newHeaders = colIndices.map((c) => headers[c.idx]);
      const newRows = dataRows.map((row) => colIndices.map((c) => row[c.idx] ?? ""));

      return {
        success: true,
        data: {
          operation: "select_columns",
          headers: newHeaders,
          rowCount: newRows.length,
          rows: newRows,
          csvOutput: serializeCsv(newHeaders, newRows, delimiter),
        },
      };
    }

    // 6. Operation: to_json
    const jsonData = dataRows.map((row) => {
      const record: Record<string, string | number | boolean | null> = {};
      headers.forEach((header, idx) => {
        const val = row[idx] ?? "";
        if (val === "") {
          record[header] = null;
        } else if (
          !isNaN(Number(val)) &&
          !val.startsWith("0x") &&
          !(val.startsWith("0") && val.length > 1 && !val.includes("."))
        ) {
          record[header] = Number(val);
        } else if (val.toLowerCase() === "true") {
          record[header] = true;
        } else if (val.toLowerCase() === "false") {
          record[header] = false;
        } else {
          record[header] = val;
        }
      });
      return record;
    });

    return {
      success: true,
      data: {
        operation: "to_json",
        headers,
        rowCount: jsonData.length,
        jsonData,
      },
    };
  }
}
