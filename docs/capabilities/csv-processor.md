# CSV Processor (`csv_processor`)

## 1. Overview
The `csv_processor` capability provides high-performance, RFC 4180 compliant CSV parsing, structural inspection, safe row filtering, column sorting, column projection/selection, and JSON transformation entirely in-memory.

* **Pack**: `Data Pack`
* **Category**: `data`
* **Version**: `1.0.0`
* **Cost**: 100% Free (₹0 / $0)
* **Execution**: 100% Local (in-memory)
* **Privacy**: `local-only` (Zero retention, no content logging)
* **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description | Output |
| :--- | :--- | :--- |
| `parse` | Parses CSV into structured headers and raw 2D row array | `{ headers, rows, rowCount }` |
| `inspect` | Structural diagnostics (row/col counts, header names, empty cells, inferred column types) | `{ stats: { rowCount, columnCount, headers, emptyCellsCount, columnTypes } }` |
| `filter` | Filters rows using a safe structured condition (column, operator, value) | `{ headers, rows, rowCount }` |
| `sort` | Sorts rows by a specified column in ascending or descending order | `{ headers, rows, rowCount }` |
| `select_columns` | Returns a projected CSV / rows containing only selected columns | `{ headers, rows, rowCount, csvOutput }` |
| `to_json` | Converts CSV records into an array of JSON objects keyed by header names | `{ jsonData: [...] }` |

---

## 3. Safe Filtering Operators

Filtering is strictly restricted to controlled declarative operators (no arbitrary JS/eval execution):
* `equals`, `not_equals`
* `contains`, `starts_with`, `ends_with`
* `greater_than`, `less_than`, `greater_or_equal`, `less_or_equal`

---

## 4. Input Schema

```typescript
{
  csvText: string; // Required, 1 to 500,000 characters (max 500KB)
  operation?: "parse" | "inspect" | "filter" | "sort" | "select_columns" | "to_json"; // Default: "parse"
  hasHeader?: boolean; // Default: true
  delimiter?: string; // Default: ","
  filterColumn?: string; // Required for 'filter'
  filterOperator?: "equals" | "not_equals" | "contains" | "starts_with" | "ends_with" | "greater_than" | "less_than" | "greater_or_equal" | "less_or_equal";
  filterValue?: string; // Comparison value
  sortColumn?: string; // Column for 'sort'
  sortDirection?: "asc" | "desc"; // Default: "asc"
  selectedColumns?: string[]; // Required for 'select_columns'
}
```

---

## 5. Security & Invariant Rules

1. **Formula Injection**: Preserves formula-like values (`=SUM(...)`, `@`, `+`, `-`) as raw literal data without executing them.
2. **Resource Limits**: Max CSV size: 500KB; Max rows: 5,000; Max columns: 100; Max cell size: 10KB.
3. **Completely Local**: Zero filesystem access, zero external network requests.
