# XML Document Processor (`xml_processor`)

## 1. Overview

The `xml_processor` capability safely parses, inspects, pretty-prints, minifies, and converts XML documents into JSON. It features strict **XXE prevention** and zero external entity resolution.

- **Pack**: `Data Pack`
- **Category**: `data`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (in-memory AST)
- **Privacy**: `local-only` (Zero retention, no network calls)
- **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description                                                                           | Output                            |
| :-------- | :------------------------------------------------------------------------------------ | :-------------------------------- |
| `inspect` | Returns root element, element count, attribute count, namespaces, comments, and depth | Detailed XML statistics           |
| `parse`   | Returns structured AST tree with tag names, attributes, and child nodes               | Safe in-memory AST node hierarchy |
| `format`  | Pretty-prints XML with customizable indentation                                       | Formatted multiline XML string    |
| `minify`  | Compresses XML into compact single-line string                                        | Minified compact XML string       |
| `to_json` | Converts XML hierarchy to JSON format with `@attr` and child arrays                   | Structured JSON document          |

---

## 3. Input Schema

```typescript
{
  xmlString: string; // Required, 1 to 1,000,000 characters (max 1MB)
  operation?: "inspect" | "parse" | "format" | "minify" | "to_json"; // Default: "inspect"
  indent?: number; // Optional, integer 1 to 8, default: 2
  preserveAttributes?: boolean; // Optional, default: true
}
```

---

## 4. Security & Limitations

- **Strict XXE Protection**: External entity declarations (`SYSTEM`, `PUBLIC`) and external DTD fetching are rejected.
- **Bounded Limits**: Maximum input size 1MB, max 50,000 elements, max depth 100.
- **JSON Mapping**: Attributes are mapped with `@` prefix; repeated tags are converted to JSON arrays.
