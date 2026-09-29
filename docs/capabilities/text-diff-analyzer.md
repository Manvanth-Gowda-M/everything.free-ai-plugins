# Text Diff Analyzer (`text_diff_analyzer`)

## 1. Overview

The `text_diff_analyzer` capability compares two text inputs using a deterministic Longest Common Subsequence (LCS) diff algorithm with line-by-line or word-by-word granularity.

- **Category**: `text`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (in-memory)
- **Privacy**: `local-only` (Zero retention, no content logging)
- **External Dependencies**: None

---

## 2. Comparison Modes

| Mode             | Description                         | Presentation Output                                       |
| :--------------- | :---------------------------------- | :-------------------------------------------------------- |
| `line` (default) | Compares line by line               | Unified diff presentation with `+`, `-`, and ` ` prefixes |
| `word`           | Compares whitespace-delimited words | Inline marked diff with `[+added+]` and `[-removed-]`     |

---

## 3. Input Schema

```typescript
{
  original: string; // Required, max 100,000 characters (100KB)
  modified: string; // Required, max 100,000 characters (100KB)
  mode?: "line" | "word"; // Optional, default: "line"
}
```

---

## 4. Usage Example

### Line Diff Example

```json
{
  "original": "Apple\nBanana\nCherry",
  "modified": "Apple\nBlueberry\nCherry\nDate",
  "mode": "line"
}
```

**Output:**

```json
{
  "identical": false,
  "mode": "line",
  "addedCount": 2,
  "removedCount": 1,
  "unchangedCount": 2,
  "summary": "2 additions, 1 removal",
  "diff": "   Apple\n+ Blueberry\n- Banana\n   Cherry\n+ Date"
}
```
