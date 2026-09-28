# Regex Tester & Extractor (`regex_tester`)

## 1. Overview
The `regex_tester` capability safely evaluates regular expressions against text strings, extracting matches and named/numbered capture groups while enforcing strict input bounds and timeout guards against ReDoS attacks.

* **Category**: `developer`
* **Version**: `1.0.0`
* **Cost**: 100% Free (₹0 / $0)
* **Execution**: 100% Local (bounded V8 RegExp engine)
* **Privacy**: `local-only` (Zero retention, no content logging)
* **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description | Output |
| :--- | :--- | :--- |
| `test` (default) | Boolean validation of whether pattern matches text | `{ matched: boolean, matchCount: 0 | 1 }` |
| `match` | Returns array of all matching substrings in text | `{ matched: boolean, matchCount: number, matches: string[] }` |
| `extract` | Extracts full match objects with named and numbered capture groups | `{ matched: boolean, details: [{ index, match, groups }] }` |

---

## 3. Input Schema & Security Limits

```typescript
{
  pattern: string; // Required, 1 to 500 characters
  text: string;    // Required, max 50,000 characters (50KB)
  flags?: string;  // Optional, default: "g" (only d, g, i, m, s, u, v, y allowed)
  operation?: "test" | "match" | "extract"; // Default: "test"
}
```

### Security Safeguards
* **Pattern Length Cap**: Maximum 500 characters.
* **Text Length Cap**: Maximum 50KB.
* **Zero Loop Lockup Guard**: Automatic cursor incrementing prevents infinite loops on zero-length matches.
* **Execution Timeout**: Protected by 2,000ms hard timeout via `ExecutionRunner`.
