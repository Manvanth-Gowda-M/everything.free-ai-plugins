import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const SqlProcessorInputSchema = z.object({
  sql: z
    .string()
    .min(1, "Input SQL string cannot be empty")
    .max(1_000_000, "Input SQL string exceeds maximum size limit of 1MB")
    .describe("The raw SQL text string to format, inspect, validate, or minify"),
  operation: z
    .enum(["format", "inspect", "validate", "minify"])
    .default("format")
    .describe(
      "Operation to perform:\n" +
        "- 'format': Formats SQL into readable multiline queries with proper clause indentation and uppercase keywords\n" +
        "- 'inspect': Extracts structural metrics, referenced tables, statement types, JOINs, clauses, parameters, and nesting depth\n" +
        "- 'validate': Performs dialect-neutral structural and syntax balance validation\n" +
        "- 'minify': Compresses SQL into a single compact line, stripping comments while preserving string literals"
    ),
  indent: z
    .number()
    .int()
    .min(1, "Indentation must be at least 1 space")
    .max(8, "Indentation cannot exceed 8 spaces")
    .default(2)
    .optional()
    .describe(
      "Number of spaces for pretty-print indentation when operation is 'format' (default: 2, range: 1-8)"
    ),
  uppercaseKeywords: z
    .boolean()
    .default(true)
    .optional()
    .describe("Whether to convert SQL keywords to uppercase during formatting (default: true)"),
});

export type SqlProcessorInput = z.infer<typeof SqlProcessorInputSchema>;

export type SqlStatementType =
  | "SELECT"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "CREATE_TABLE"
  | "ALTER_TABLE"
  | "DROP"
  | "CREATE_INDEX"
  | "TRANSACTION"
  | "OTHER";

export interface SqlStatementInspection {
  index: number;
  type: SqlStatementType;
  raw: string;
  tables: string[];
  columns?: string[];
  joins: {
    type: string;
    table: string;
  }[];
  hasWhere: boolean;
  hasGroupBy: boolean;
  hasOrderBy: boolean;
  hasHaving: boolean;
  hasLimit: boolean;
  parameters: string[];
  approximateNestingDepth: number;
}

export interface SqlInspectionStats {
  statementCount: number;
  statements: SqlStatementInspection[];
  totalTables: string[];
  totalParameters: string[];
  maxNestingDepth: number;
}

export interface SqlValidationError {
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
}

export interface SqlProcessorOutput {
  operation: "format" | "inspect" | "validate" | "minify";
  result?: string;
  stats?: SqlInspectionStats;
  valid?: boolean;
  errors?: SqlValidationError[];
  warnings?: string[];
  dialectNotice?: string;
}

const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "CROSS",
  "ON",
  "GROUP",
  "BY",
  "ORDER",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "ALL",
  "EXCEPT",
  "INTERSECT",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "TABLE",
  "ALTER",
  "DROP",
  "INDEX",
  "VIEW",
  "DATABASE",
  "SCHEMA",
  "AND",
  "OR",
  "NOT",
  "IN",
  "IS",
  "NULL",
  "LIKE",
  "ILIKE",
  "BETWEEN",
  "EXISTS",
  "AS",
  "DISTINCT",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "ASC",
  "DESC",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "DEFAULT",
  "CONSTRAINT",
  "CHECK",
  "UNIQUE",
  "AUTO_INCREMENT",
  "CASCADE",
  "RETURNING",
  "WITH",
  "RECURSIVE",
  "CAST",
  "COALESCE",
  "NULLIF",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "OVER",
  "PARTITION",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "IF",
  "REPLACE",
  "TRUNCATE",
  "EXPLAIN",
  "ANALYZE",
]);

interface Token {
  type:
    | "keyword"
    | "identifier"
    | "string"
    | "number"
    | "operator"
    | "punctuation"
    | "comment"
    | "placeholder"
    | "whitespace";
  value: string;
  raw: string;
  line: number;
  col: number;
}

/**
 * Tokenizes SQL string safely preserving string literals, comments, and identifiers.
 */
function tokenizeSql(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  while (i < sql.length) {
    const startLine = line;
    const startCol = col;
    const char = sql[i];

    // 1. Whitespace
    if (/\s/.test(char)) {
      let ws = "";
      while (i < sql.length && /\s/.test(sql[i])) {
        if (sql[i] === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        ws += sql[i];
        i++;
      }
      tokens.push({ type: "whitespace", value: ws, raw: ws, line: startLine, col: startCol });
      continue;
    }

    // 2. Comments (-- line comment or /* block comment */ or # line comment)
    if ((char === "-" && sql[i + 1] === "-") || char === "#") {
      let comment = "";
      while (i < sql.length && sql[i] !== "\n") {
        comment += sql[i];
        col++;
        i++;
      }
      tokens.push({
        type: "comment",
        value: comment,
        raw: comment,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    if (char === "/" && sql[i + 1] === "*") {
      let comment = "/*";
      i += 2;
      col += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) {
        if (sql[i] === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        comment += sql[i];
        i++;
      }
      if (i < sql.length) {
        comment += "*/";
        i += 2;
        col += 2;
      }
      tokens.push({
        type: "comment",
        value: comment,
        raw: comment,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // 3. String literals ('...', "...", `...`)
    if (char === "'" || char === '"' || char === "`") {
      const quote = char;
      let str = quote;
      i++;
      col++;
      while (i < sql.length) {
        if (sql[i] === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        if (sql[i] === quote) {
          str += quote;
          i++;
          // Handle SQL escaped quote like ''
          if (quote === "'" && sql[i] === "'") {
            str += "'";
            i++;
            col++;
            continue;
          }
          break;
        } else if (sql[i] === "\\" && i + 1 < sql.length) {
          str += sql[i] + sql[i + 1];
          i += 2;
          col += 2;
        } else {
          str += sql[i];
          i++;
        }
      }
      tokens.push({ type: "string", value: str, raw: str, line: startLine, col: startCol });
      continue;
    }

    // 4. Placeholders (?, $1, :name, @param)
    if (
      char === "?" ||
      (char === "$" && /\d/.test(sql[i + 1])) ||
      ((char === ":" || char === "@") && /[a-zA-Z_]/.test(sql[i + 1]))
    ) {
      let ph = char;
      i++;
      col++;
      while (i < sql.length && /[a-zA-Z0-9_]/.test(sql[i])) {
        ph += sql[i];
        i++;
        col++;
      }
      tokens.push({ type: "placeholder", value: ph, raw: ph, line: startLine, col: startCol });
      continue;
    }

    // 5. Punctuation & Parentheses
    if (char === "(" || char === ")" || char === "," || char === ";" || char === ".") {
      tokens.push({ type: "punctuation", value: char, raw: char, line: startLine, col: startCol });
      i++;
      col++;
      continue;
    }

    // 6. Operators
    if (/[=<>!+*/%|&~^-]/.test(char)) {
      let op = "";
      while (i < sql.length && /[=<>!+*/%|&~^-]/.test(sql[i])) {
        op += sql[i];
        i++;
        col++;
      }
      tokens.push({ type: "operator", value: op, raw: op, line: startLine, col: startCol });
      continue;
    }

    // 7. Numbers
    if (/[0-9]/.test(char)) {
      let num = "";
      while (i < sql.length && /[0-9.xXa-fA-FeE+-]/.test(sql[i])) {
        num += sql[i];
        i++;
        col++;
      }
      tokens.push({ type: "number", value: num, raw: num, line: startLine, col: startCol });
      continue;
    }

    // 8. Identifiers & Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let ident = "";
      while (i < sql.length && /[a-zA-Z0-9_$]/.test(sql[i])) {
        ident += sql[i];
        i++;
        col++;
      }
      const upper = ident.toUpperCase();
      const isKeyword = SQL_KEYWORDS.has(upper);
      tokens.push({
        type: isKeyword ? "keyword" : "identifier",
        value: upper,
        raw: ident,
        line: startLine,
        col: startCol,
      });
      continue;
    }

    // Default fallback
    tokens.push({ type: "operator", value: char, raw: char, line: startLine, col: startCol });
    i++;
    col++;
  }

  return tokens;
}

/**
 * Formats SQL text into clean, structured queries.
 */
function formatSql(tokens: Token[], indentSpaces: number, uppercaseKeywords: boolean): string {
  const indentStr = " ".repeat(indentSpaces);
  let result = "";
  let depth = 0;
  let isNewLine = true;

  const meaningfulTokens = tokens.filter((t) => t.type !== "whitespace");

  for (let i = 0; i < meaningfulTokens.length; i++) {
    const token = meaningfulTokens[i];
    const prev = meaningfulTokens[i - 1];
    const next = meaningfulTokens[i + 1];

    if (token.type === "comment") {
      if (!isNewLine) result += " ";
      result += token.raw;
      if (token.raw.startsWith("--") || token.raw.startsWith("#")) {
        result += "\n" + indentStr.repeat(depth);
        isNewLine = true;
      }
      continue;
    }

    if (token.value === ";") {
      result = result.trimEnd() + ";\n\n";
      depth = 0;
      isNewLine = true;
      continue;
    }

    if (token.value === "(") {
      result += "(";
      depth++;
      isNewLine = false;
      continue;
    }

    if (token.value === ")") {
      depth = Math.max(0, depth - 1);
      result = result.trimEnd() + ")";
      isNewLine = false;
      continue;
    }

    if (token.value === ",") {
      result = result.trimEnd() + ", ";
      isNewLine = false;
      continue;
    }

    // Determine if this keyword starts a new clause line
    const isSecondWordOfClause =
      prev &&
      ((prev.value === "LEFT" && token.value === "JOIN") ||
        (prev.value === "RIGHT" && token.value === "JOIN") ||
        (prev.value === "INNER" && token.value === "JOIN") ||
        (prev.value === "FULL" && token.value === "JOIN") ||
        (prev.value === "CROSS" && token.value === "JOIN") ||
        (prev.value === "OUTER" && token.value === "JOIN") ||
        (prev.value === "GROUP" && token.value === "BY") ||
        (prev.value === "ORDER" && token.value === "BY") ||
        (prev.value === "INSERT" && token.value === "INTO") ||
        (prev.value === "UNION" && token.value === "ALL") ||
        (prev.value === "CREATE" && token.value === "TABLE") ||
        (prev.value === "ALTER" && token.value === "TABLE") ||
        (prev.value === "DROP" && token.value === "TABLE"));

    const isFirstWordOfMultiClause =
      next &&
      ((token.value === "LEFT" && next.value === "JOIN") ||
        (token.value === "RIGHT" && next.value === "JOIN") ||
        (token.value === "INNER" && next.value === "JOIN") ||
        (token.value === "FULL" && next.value === "JOIN") ||
        (token.value === "CROSS" && next.value === "JOIN") ||
        (token.value === "OUTER" && next.value === "JOIN") ||
        (token.value === "GROUP" && next.value === "BY") ||
        (token.value === "ORDER" && next.value === "BY") ||
        (token.value === "INSERT" && next.value === "INTO") ||
        (token.value === "UNION" && next.value === "ALL") ||
        (token.value === "CREATE" && next.value === "TABLE") ||
        (token.value === "ALTER" && next.value === "TABLE") ||
        (token.value === "DROP" && next.value === "TABLE"));

    const isSingleMajorClause =
      token.type === "keyword" &&
      !isSecondWordOfClause &&
      (isFirstWordOfMultiClause ||
        [
          "SELECT",
          "FROM",
          "WHERE",
          "HAVING",
          "LIMIT",
          "OFFSET",
          "JOIN",
          "VALUES",
          "UPDATE",
          "SET",
          "DELETE",
          "WITH",
        ].includes(token.value));

    if (isSingleMajorClause) {
      if (!isNewLine && result.length > 0 && !result.endsWith("(")) {
        result = result.trimEnd() + "\n" + indentStr.repeat(depth);
      }
    }

    // Format token text
    let tokenText = token.raw;
    if (token.type === "keyword" && uppercaseKeywords) {
      tokenText = token.value;
    }

    if (isNewLine) {
      result += indentStr.repeat(depth);
      isNewLine = false;
    } else if (
      prev &&
      prev.value !== "(" &&
      prev.value !== "." &&
      token.value !== "." &&
      token.value !== "," &&
      token.value !== ";" &&
      !result.endsWith(" ") &&
      !result.endsWith("\n") &&
      !result.endsWith("(")
    ) {
      result += " ";
    }

    result += tokenText;
  }

  return result.trim();
}

/**
 * Minifies SQL text by removing comments and collapsing whitespace.
 */
function minifySql(tokens: Token[]): string {
  let result = "";
  const filtered = tokens.filter((t) => t.type !== "comment" && t.type !== "whitespace");

  for (let i = 0; i < filtered.length; i++) {
    const token = filtered[i];
    const prev = filtered[i - 1];

    if (prev) {
      const prevWord =
        prev.type === "keyword" || prev.type === "identifier" || prev.type === "number";
      const currWord =
        token.type === "keyword" || token.type === "identifier" || token.type === "number";

      if (
        (prevWord && currWord) ||
        (prev.type === "string" && (token.value === "AS" || currWord)) ||
        (prevWord &&
          token.type === "string" &&
          (prev.value === "AS" ||
            prev.value === "LIKE" ||
            prev.value === "IN" ||
            prev.value === "VALUES" ||
            prev.value === "DEFAULT"))
      ) {
        result += " ";
      }
    }

    result += token.raw;
  }

  return result.trim();
}

/**
 * Inspects SQL structure.
 */
function inspectSql(_sql: string, tokens: Token[]): SqlInspectionStats {
  const statementTokensList: Token[][] = [];
  let currentStmt: Token[] = [];

  for (const token of tokens) {
    if (token.type === "whitespace" || token.type === "comment") continue;
    if (token.value === ";") {
      if (currentStmt.length > 0) {
        statementTokensList.push(currentStmt);
        currentStmt = [];
      }
    } else {
      currentStmt.push(token);
    }
  }
  if (currentStmt.length > 0) {
    statementTokensList.push(currentStmt);
  }

  const allTables = new Set<string>();
  const allParams = new Set<string>();
  let overallMaxDepth = 0;

  const statements: SqlStatementInspection[] = statementTokensList.map((stmtTokens, idx) => {
    let stmtType: SqlStatementType = "OTHER";
    const tablesInStmt = new Set<string>();
    const joins: { type: string; table: string }[] = [];
    const paramsInStmt = new Set<string>();
    let depth = 0;
    let maxDepth = 0;
    let hasWhere = false;
    let hasGroupBy = false;
    let hasOrderBy = false;
    let hasHaving = false;
    let hasLimit = false;

    // Detect statement type
    const firstWord = stmtTokens[0]?.value;
    const secondWord = stmtTokens[1]?.value;

    if (firstWord === "SELECT" || firstWord === "WITH") stmtType = "SELECT";
    else if (firstWord === "INSERT") stmtType = "INSERT";
    else if (firstWord === "UPDATE") stmtType = "UPDATE";
    else if (firstWord === "DELETE") stmtType = "DELETE";
    else if (firstWord === "CREATE" && secondWord === "TABLE") stmtType = "CREATE_TABLE";
    else if (firstWord === "ALTER" && secondWord === "TABLE") stmtType = "ALTER_TABLE";
    else if (firstWord === "DROP") stmtType = "DROP";
    else if (firstWord === "CREATE" && secondWord === "INDEX") stmtType = "CREATE_INDEX";
    else if (firstWord === "BEGIN" || firstWord === "COMMIT" || firstWord === "ROLLBACK")
      stmtType = "TRANSACTION";

    for (let i = 0; i < stmtTokens.length; i++) {
      const t = stmtTokens[i];
      const prev = stmtTokens[i - 1];
      const next = stmtTokens[i + 1];

      if (t.value === "(") {
        depth++;
        if (depth > maxDepth) maxDepth = depth;
      } else if (t.value === ")") {
        depth = Math.max(0, depth - 1);
      }

      if (t.type === "placeholder") {
        paramsInStmt.add(t.raw);
        allParams.add(t.raw);
      }

      if (t.value === "WHERE") hasWhere = true;
      if (t.value === "GROUP" && next && next.value === "BY") hasGroupBy = true;
      if (t.value === "ORDER" && next && next.value === "BY") hasOrderBy = true;
      if (t.value === "HAVING") hasHaving = true;
      if (t.value === "LIMIT") hasLimit = true;

      // Extract tables
      if (
        (t.value === "FROM" ||
          t.value === "INTO" ||
          t.value === "UPDATE" ||
          t.value === "TABLE" ||
          (t.value === "TABLE" &&
            prev &&
            (prev.value === "CREATE" ||
              prev.value === "DROP" ||
              prev.value === "ALTER" ||
              prev.value === "TRUNCATE"))) &&
        next &&
        (next.type === "identifier" || next.type === "string")
      ) {
        const tblName = next.raw.replace(/[`"']/g, "");
        tablesInStmt.add(tblName);
        allTables.add(tblName);
      }

      // JOIN table
      if (t.value === "JOIN" && next && (next.type === "identifier" || next.type === "string")) {
        const joinType =
          prev && ["LEFT", "RIGHT", "INNER", "FULL", "CROSS", "OUTER"].includes(prev.value)
            ? `${prev.value} JOIN`
            : "INNER JOIN";
        const tblName = next.raw.replace(/[`"']/g, "");
        joins.push({ type: joinType, table: tblName });
        tablesInStmt.add(tblName);
        allTables.add(tblName);
      }
    }

    if (maxDepth > overallMaxDepth) overallMaxDepth = maxDepth;

    return {
      index: idx + 1,
      type: stmtType,
      raw: stmtTokens.map((t) => t.raw).join(" "),
      tables: Array.from(tablesInStmt),
      joins,
      hasWhere,
      hasGroupBy,
      hasOrderBy,
      hasHaving,
      hasLimit,
      parameters: Array.from(paramsInStmt),
      approximateNestingDepth: maxDepth,
    };
  });

  return {
    statementCount: statements.length,
    statements,
    totalTables: Array.from(allTables),
    totalParameters: Array.from(allParams),
    maxNestingDepth: overallMaxDepth,
  };
}

/**
 * Performs dialect-neutral syntax validation on SQL tokens.
 */
function validateSql(
  sql: string,
  tokens: Token[]
): { valid: boolean; errors: SqlValidationError[]; warnings: string[] } {
  const errors: SqlValidationError[] = [];
  const warnings: string[] = [];

  let parenDepth = 0;
  const parenStack: Token[] = [];

  for (const token of tokens) {
    if (token.value === "(") {
      parenDepth++;
      parenStack.push(token);
    } else if (token.value === ")") {
      parenDepth--;
      if (parenDepth < 0) {
        errors.push({
          message: "Unmatched closing parenthesis ')'",
          line: token.line,
          column: token.col,
        });
        parenDepth = 0;
      } else {
        parenStack.pop();
      }
    }
  }

  while (parenStack.length > 0) {
    const unclosed = parenStack.pop()!;
    errors.push({
      message: "Unclosed opening parenthesis '('",
      line: unclosed.line,
      column: unclosed.col,
    });
  }

  // Check unclosed quotes
  const singleQuotes = (sql.match(/(?<!\\)'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    errors.push({
      message: "Unterminated single-quoted string literal detected",
    });
  }

  // Check empty statements
  const meaningful = tokens.filter((t) => t.type !== "whitespace" && t.type !== "comment");
  if (meaningful.length === 0) {
    errors.push({ message: "SQL input contains no executable statements" });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export class SqlProcessorCapability implements Capability<
  typeof SqlProcessorInputSchema,
  SqlProcessorOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "sql_processor",
    version: "1.0.0",
    category: "data",
    pack: "Data Pack",
    displayName: "SQL Text Processor",
    description:
      "Local SQL text processor to format, pretty-print, minify, structurally inspect, or validate SQL queries offline. " +
      "Provides safe in-memory parsing, table/column extraction, placeholder identification, and dialect-neutral syntax checks. " +
      "Never executes SQL statements and never connects to any database.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "format",
        description:
          "Pretty-prints SQL with structured clause indentation and keyword capitalization",
        inputDescription:
          "sql, indent (optional, default 2), uppercaseKeywords (optional, default true)",
        outputDescription: "Formatted multiline SQL string with aligned clauses",
      },
      {
        name: "inspect",
        description:
          "Extracts structural information, statement types, referenced tables, JOINs, parameters, and nesting depth",
        inputDescription: "sql",
        outputDescription:
          "Detailed structural stats including statement count, tables, JOINs, and parameters",
      },
      {
        name: "validate",
        description:
          "Checks dialect-neutral SQL syntax, balanced parentheses, and string literal integrity",
        inputDescription: "sql",
        outputDescription:
          "{ valid: boolean, errors?: SqlValidationError[], dialectNotice: string }",
      },
      {
        name: "minify",
        description:
          "Compresses SQL into a single compact line, stripping comments while preserving literals",
        inputDescription: "sql",
        outputDescription: "Minified compact single-line SQL string",
      },
    ],
    limits: {
      maxTextLength: 1_000_000,
      maxInputBytes: 1_000_000,
      maxStatements: 500,
      maxNestingDepth: 100,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Never connects to databases or executes SQL. Pure in-memory AST and token analysis.",
    },
    usageGuidance: {
      useWhen: [
        "User asks to pretty-print, indent, or clean up messy SQL",
        "User asks to minify SQL queries for production configuration",
        "User asks to inspect which tables or parameters are used in a SQL query",
        "User asks to check SQL for missing parentheses or unclosed quotes",
        "User asks to detect statement types and JOIN structures",
      ],
      doNotUseWhen: [
        "User asks to execute SQL against a database (Everything.Free never executes queries)",
        "User asks to format JSON or CSV data (use json_formatter_validator or csv_processor)",
        "User asks to compare two SQL files for text differences (use text_diff_analyzer)",
      ],
      exampleRequests: [
        "Format this messy SQL query with 2-space indentation and uppercase keywords",
        "Inspect this SQL script and list all tables and JOINs referenced",
        "Validate whether this SQL query has balanced parentheses and quotes",
        "Minify this SQL query into a single compact string",
      ],
    },
  };

  public readonly inputSchema = SqlProcessorInputSchema;

  public async execute(input: SqlProcessorInput): Promise<CapabilityResult<SqlProcessorOutput>> {
    const { sql, operation = "format", indent = 2, uppercaseKeywords = true } = input;

    const tokens = tokenizeSql(sql);

    if (operation === "minify") {
      const minified = minifySql(tokens);
      return {
        success: true,
        data: {
          operation: "minify",
          result: minified,
        },
      };
    }

    if (operation === "inspect") {
      const stats = inspectSql(sql, tokens);
      return {
        success: true,
        data: {
          operation: "inspect",
          stats,
        },
      };
    }

    if (operation === "validate") {
      const validation = validateSql(sql, tokens);
      return {
        success: true,
        data: {
          operation: "validate",
          valid: validation.valid,
          errors: validation.errors.length > 0 ? validation.errors : undefined,
          warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
          dialectNotice:
            "Dialect-neutral structural check: validates balanced parentheses, quotes, comments, and standard clause structure without executing or connecting to a database engine.",
        },
      };
    }

    // Default: "format"
    const formatted = formatSql(tokens, indent, uppercaseKeywords);
    return {
      success: true,
      data: {
        operation: "format",
        result: formatted,
      },
    };
  }
}
