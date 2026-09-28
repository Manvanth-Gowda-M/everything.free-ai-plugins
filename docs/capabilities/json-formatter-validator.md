# JSON Formatter & Validator (`json_formatter_validator`)

## 1. Overview
The `json_formatter_validator` capability parses, formats (pretty-prints), minifies, validates, and structurally inspects JSON payloads with actionable syntax diagnostics.

* **Category**: `data`
* **Version**: `1.0.0`
* **Cost**: 100% Free (₹0 / $0)
* **Execution**: 100% Local (in-memory)
* **Privacy**: `local-only` (Zero retention, no content logging)
* **External Dependencies**: None

---

## 2. Supported Actions

| Action | Description | Output |
| :--- | :--- | :--- |
| `format` | Pretty-prints JSON with customizable indentation | Formatted JSON string |
| `minify` | Compresses JSON by stripping whitespace | Minified compact JSON string |
| `validate` | Checks JSON syntax and returns error details if invalid | `{ valid: boolean, syntaxError?: {...} }` |
| `inspect` | Performs structural analysis (root type, key count, depth, byte size) | Structured inspection metrics |

---

## 3. Input Schema

```typescript
{
  jsonString: string; // Required, 1 to 1,000,000 characters (max 1MB)
  action?: "format" | "minify" | "validate" | "inspect"; // Default: "format"
  indent?: number; // Optional, integer 1 to 8, default: 2
}
```

---

## 4. Usage Examples

### Example: Validation with Syntax Diagnostics
```json
{
  "jsonString": "{\n  \"name\": \"broken\",\n  \"value\": \n}",
  "action": "validate"
}
```
**Output:**
```json
{
  "valid": false,
  "action": "validate",
  "syntaxError": {
    "message": "Unexpected token } in JSON at line 4 column 1",
    "line": 4,
    "column": 1,
    "snippet": "   2:   \"name\": \"broken\",\n   3:   \"value\": \n > 4: }"
  }
}
```
