# Markdown Processor (`markdown_processor`)

## 1. Overview
The `markdown_processor` capability provides structural Markdown parsing, heading hierarchy extraction, link and image extraction, fenced code block extraction, automated Table of Contents (TOC) generation, and conservative Markdown normalization.

* **Pack**: `Text Pack`
* **Category**: `text`
* **Version**: `1.0.0`
* **Cost**: 100% Free (₹0 / $0)
* **Execution**: 100% Local (in-memory)
* **Privacy**: `local-only` (Zero retention, no content logging)
* **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description | Output |
| :--- | :--- | :--- |
| `inspect` | Reports document structure metrics (headings, links, code blocks, lists, words, lines) | `{ stats: { headingCount, linkCount, codeBlockCount, paragraphCount, listCount, wordCount, lineCount } }` |
| `headings` | Extracts heading hierarchy with levels (H1-H6), text, line numbers, and anchor slugs | `{ headings: [{ level, text, id, line }] }` |
| `links` | Extracts all markdown hyperlinks and images | `{ links: [{ text, url, isImage, line }] }` |
| `code_blocks` | Extracts fenced code blocks with language identifiers and line count | `{ codeBlocks: [{ language, code, lineCount, line }] }` |
| `toc` | Generates a clickable markdown Table of Contents from headings | `{ toc: string }` |
| `normalize` | Normalizes heading spacing, list bullet formatting, and trailing spaces | `{ normalizedMarkdown: string }` |

---

## 3. Input Schema

```typescript
{
  markdownText: string; // Required, 1 to 100,000 characters (max 100KB)
  operation?: "inspect" | "headings" | "links" | "code_blocks" | "toc" | "normalize"; // Default: "inspect"
}
```

---

## 4. Security & Safety

1. **Untrusted Input**: Markdown documents are treated as untrusted text.
2. **HTML Handling**: Embedded HTML is treated as plain text strings without DOM rendering or remote script execution.
3. **Completely Local**: Zero remote URL resolution, zero command execution, zero filesystem access.
