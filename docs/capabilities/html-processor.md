# HTML Document Processor (`html_processor`)

## 1. Overview

The `html_processor` capability analyzes HTML markup, extracts plain text, headings, links, images, and metadata, strips unsafe elements (scripts, iframes, inline event handlers), and formats/minifies HTML documents offline.

- **Pack**: `Text Pack`
- **Category**: `text`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (in-memory document tree)
- **Privacy**: `local-only` (Zero network, zero tracking)
- **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description                                                                                    | Output                                             |
| :-------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| `inspect` | Counts elements, headings, links, images, forms, scripts, styles, and depth                    | Document structural metrics & meta tags            |
| `extract` | Extracts structured text, headings hierarchy, hyperlinks, images, or metadata                  | `{ text?, headings?, links?, images?, metadata? }` |
| `clean`   | Strips `<script>`, `<iframe>`, `<object>`, inline `on*` event handlers, and `javascript:` URLs | Cleaned HTML markup & removed counts               |
| `format`  | Normalizes and pretty-prints HTML with structured indentation                                  | Formatted multiline HTML string                    |
| `minify`  | Compresses HTML, collapses inter-tag whitespace, and removes comments                          | Minified compact HTML string                       |

---

## 3. Input Schema

```typescript
{
  htmlText: string; // Required, 1 to 1,000,000 characters (max 1MB)
  operation?: "inspect" | "extract" | "clean" | "format" | "minify"; // Default: "inspect"
  extractTarget?: "all" | "text" | "links" | "headings" | "images" | "metadata"; // Default: "all"
  indent?: number; // Optional, integer 1 to 8, default: 2
}
```

---

## 4. Security & Limitations

- **Zero Execution**: Never executes JavaScript, fetches remote URLs, or launches browser engines (no Puppeteer/Playwright).
- **Sanitization Notice**: The `clean` operation provides text-processing sanitization and document preparation, not a browser security execution boundary.
