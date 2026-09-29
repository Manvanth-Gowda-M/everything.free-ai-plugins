# SQL Text Processor (`sql_processor`)

## 1. Overview
The `sql_processor` capability provides local SQL text processing, formatting, structural inspection, dialect-neutral syntax validation, and minification. It operates entirely offline and in-memory with **zero database execution**.

* **Pack**: `Data Pack`
* **Category**: `data`
* **Version**: `1.0.0`
* **Cost**: 100% Free (₹0 / $0)
* **Execution**: 100% Local (in-memory AST & tokenizer)
* **Privacy**: `local-only` (Zero retention, no persistent storage)
* **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description | Output |
| :--- | :--- | :--- |
| `format` | Pretty-prints SQL with structured clause indentation and keyword casing | Formatted multiline SQL string |
| `inspect` | Extracts statement counts, statement types, referenced tables, JOINs, parameters, and nesting depth | Structured inspection metadata |
| `validate` | Checks dialect-neutral syntax, balanced parentheses, and string literal integrity | `{ valid: boolean, errors?: [...], dialectNotice: string }` |
| `minify` | Compresses SQL into a single compact line, stripping comments while preserving literals | Minified compact SQL string |

---

## 3. Input Schema

```typescript
{
  sql: string; // Required, 1 to 1,000,000 characters (max 1MB)
  operation?: "format" | "inspect" | "validate" | "minify"; // Default: "format"
  indent?: number; // Optional, integer 1 to 8, default: 2
  uppercaseKeywords?: boolean; // Optional, default: true
}
```

---

## 4. Security & Limitations

* **No Execution**: Never connects to SQLite, PostgreSQL, MySQL, or executes queries.
* **Dialect Neutral**: Performs structural parsing; does not substitute a full database query planner.
* **Bounded Limits**: Maximum SQL input size of 1MB, maximum 500 statements, and 100 nesting levels.
