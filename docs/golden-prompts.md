# Golden Prompts & AI Interaction Benchmark

This document defines canonical, real-world user prompts for **Everything.Free AI Plugins**, showing how an AI assistant (like ChatGPT) discovers, selects, and invokes each capability.

---

## 1. JSON Formatter & Validator (`json_formatter_validator`) — Data Pack

### User Request 1 (Validation)

> "Validate this JSON payload and tell me if there are any syntax errors."

```json
{
  "project": "Everything.Free",
  "enabled": true,
  "tags": ["free", "mcp"]
}
```

- **Tool Selected**: `json_formatter_validator`
- **Arguments**: `{ "jsonString": "...", "action": "validate" }`
- **Outcome**: Returns `{ "valid": true }`.

### User Request 2 (Pretty-Printing)

> "Format this minified JSON string with 2-space indentation."

```json
{ "name": "Quilonix", "roles": ["core", "lead"], "active": true }
```

- **Tool Selected**: `json_formatter_validator`
- **Arguments**: `{ "jsonString": "...", "action": "format", "indent": 2 }`
- **Outcome**: Returns formatted multiline JSON string.

---

## 2. CSV Processor (`csv_processor`) — Data Pack

### User Request 1 (Structure Inspection)

> "Inspect this CSV and tell me what columns and rows it contains."

```csv
id,name,age,active
1,Alice,30,true
2,Bob,24,false
```

- **Tool Selected**: `csv_processor`
- **Arguments**: `{ "csvText": "...", "operation": "inspect" }`
- **Outcome**: Returns row count (2), column list, empty cell count, and inferred types.

### User Request 2 (Filtering)

> "Filter this CSV to rows where age is greater than 25."

- **Tool Selected**: `csv_processor`
- **Arguments**: `{ "csvText": "...", "operation": "filter", "filterColumn": "age", "filterOperator": "greater_than", "filterValue": "25" }`
- **Outcome**: Returns filtered row set.

### User Request 3 (CSV to JSON)

> "Convert this CSV dataset into an array of JSON objects."

- **Tool Selected**: `csv_processor`
- **Arguments**: `{ "csvText": "...", "operation": "to_json" }`
- **Outcome**: Returns `{ "jsonData": [{ "id": 1, "name": "Alice", "age": 30, "active": true }, ...] }`.

---

## 3. SQL Text Processor (`sql_processor`) — Data Pack

### User Request 1 (SQL Pretty-Printing)

> "Format this messy SQL query with 2-space indentation and uppercase keywords."

```sql
select u.id, u.email, count(o.id) as total_orders from users u left join orders o on u.id = o.user_id where u.active = 1 group by u.id, u.email order by total_orders desc limit 10;
```

- **Tool Selected**: `sql_processor`
- **Arguments**: `{ "sql": "...", "operation": "format", "indent": 2, "uppercaseKeywords": true }`
- **Outcome**: Returns cleanly formatted multiline SQL query with aligned clauses.

### User Request 2 (Structural Inspection)

> "Inspect this SQL query and tell me what tables, JOINs, and parameters are referenced."

- **Tool Selected**: `sql_processor`
- **Arguments**: `{ "sql": "SELECT * FROM orders WHERE customer_id = $1 AND status = 'COMPLETED';", "operation": "inspect" }`
- **Outcome**: Returns statement count, referenced tables (`orders`), parameters (`$1`), and clause flags.

---

## 4. XML Document Processor (`xml_processor`) — Data Pack

### User Request 1 (XML to JSON Conversion)

> "Convert this XML configuration into a clean JSON structure."

```xml
<config environment="production">
  <database host="localhost" port="5432" />
  <features><enabled>auth</enabled><enabled>logging</enabled></features>
</config>
```

- **Tool Selected**: `xml_processor`
- **Arguments**: `{ "xmlString": "...", "operation": "to_json", "preserveAttributes": true }`
- **Outcome**: Returns structured JSON with `@attributes` and repeated tag arrays.

### User Request 2 (XML Structure Inspection)

> "Inspect this XML document and count its elements, namespaces, and maximum nesting depth."

- **Tool Selected**: `xml_processor`
- **Arguments**: `{ "xmlString": "...", "operation": "inspect" }`
- **Outcome**: Returns element counts, detected namespaces, comments count, and max depth.

---

## 5. Text Diff Analyzer (`text_diff_analyzer`) — Text Pack

### User Request 1 (Configuration Diff)

> "What changed between my previous .env file and the new one?"

- **Original**:
  ```env
  PORT=3000
  NODE_ENV=development
  DEBUG=true
  ```
- **Modified**:
  ```env
  PORT=8080
  NODE_ENV=production
  DEBUG=false
  ```
- **Tool Selected**: `text_diff_analyzer`
- **Arguments**: `{ "original": "...", "modified": "...", "mode": "line" }`
- **Outcome**: Returns 3 additions, 3 removals, and unified diff output.

---

## 6. Markdown Processor (`markdown_processor`) — Text Pack

### User Request 1 (Heading Extraction & Outline)

> "Extract all headings and hierarchy from this Markdown document."

- **Tool Selected**: `markdown_processor`
- **Arguments**: `{ "markdownText": "...", "operation": "headings" }`
- **Outcome**: Returns list of headings with levels (H1-H6), anchor slugs, and line numbers.

### User Request 2 (Table of Contents Generation)

> "Generate a markdown Table of Contents from this document."

- **Tool Selected**: `markdown_processor`
- **Arguments**: `{ "markdownText": "...", "operation": "toc" }`
- **Outcome**: Returns hierarchical markdown list of anchor links.

---

## 7. HTML Document Processor (`html_processor`) — Text Pack

### User Request 1 (Extract Links and Headings)

> "Extract all hyperlinks and headings from this HTML document without rendering it."

- **Tool Selected**: `html_processor`
- **Arguments**: `{ "htmlText": "...", "operation": "extract", "extractTarget": "all" }`
- **Outcome**: Returns structured array of headings, hyperlinks (href & text), images, and OpenGraph metadata.

### User Request 2 (Sanitize Unsafe HTML)

> "Clean this HTML snippet by removing all scripts, iframes, and inline onclick event handlers."

- **Tool Selected**: `html_processor`
- **Arguments**: `{ "htmlText": "<div onclick=\"evil()\"><h3>Safe</h3><script>alert(1)</script></div>", "operation": "clean" }`
- **Outcome**: Returns cleaned HTML markup with dangerous elements removed.

---

## 8. Hash & Encoding (`hash_and_encoding`) — Encoding Pack

### User Request 1 (SHA-256 Checksum)

> "Calculate the SHA-256 checksum of 'Everything.Free AI Plugins'."

- **Tool Selected**: `hash_and_encoding`
- **Arguments**: `{ "operation": "sha256", "input": "Everything.Free AI Plugins" }`
- **Outcome**: Returns 64-character hex hash.

### User Request 2 (Base64 Encoding)

> "Encode the string 'hello:world' into Base64 format."

- **Tool Selected**: `hash_and_encoding`
- **Arguments**: `{ "operation": "base64_encode", "input": "hello:world" }`
- **Outcome**: Returns `"aGVsbG86d29ybGQ="`.

---

## 9. Unit & Time Converter (`unit_time_converter`) — Utility Pack

### User Request 1 (Physical Unit Conversion)

> "How many kilometers is 10 miles?"

- **Tool Selected**: `unit_time_converter`
- **Arguments**: `{ "mode": "unit", "value": 10, "fromUnit": "mi", "toUnit": "km" }`
- **Outcome**: Returns `16.09344 km`.

### User Request 2 (Timestamp & Timezone Conversion)

> "Convert the Unix timestamp 1700000000 into an ISO 8601 string in UTC."

- **Tool Selected**: `unit_time_converter`
- **Arguments**: `{ "mode": "time", "timeInput": 1700000000, "targetTimezone": "UTC" }`
- **Outcome**: Returns ISO `2023-11-14T22:13:20.000Z`.

---

## 10. Color Converter (`color_converter`) — Utility Pack

### User Request 1 (Color Conversion & Luminance)

> "Convert #D4AF37 to RGB and HSL, and tell me its relative luminance."

- **Tool Selected**: `color_converter`
- **Arguments**: `{ "color": "#D4AF37" }`
- **Outcome**: Returns RGB `rgb(212, 175, 55)`, HSL `hsl(46, 65%, 52%)`, HWB, OKLCH, and WCAG luminance `0.4439`.

---

## 11. Cron Expression Analyzer (`cron_analyzer`) — Utility Pack

### User Request 1 (Schedule Explanation)

> "Explain what the cron expression '0 9 * * 1-5' means in plain English."

- **Tool Selected**: `cron_analyzer`
- **Arguments**: `{ "expression": "0 9 * * 1-5", "operation": "explain" }`
- **Outcome**: Returns `"At 09:00 (09:00 AM), Monday through Friday"`.

### User Request 2 (Next Occurrence Calculation)

> "Calculate the next 5 run times for '@weekly' starting from 2025-01-01."

- **Tool Selected**: `cron_analyzer`
- **Arguments**: `{ "expression": "@weekly", "operation": "next_matches", "baseTime": "2025-01-01T00:00:00.000Z", "count": 5 }`
- **Outcome**: Returns array of the next 5 matching ISO timestamps.

---

## 12. Regex Tester (`regex_tester`) — Developer Pack

### User Request 1 (Pattern Validation)

> "Test whether the string 'test@example.com' matches a standard email regular expression."

- **Tool Selected**: `regex_tester`
- **Arguments**: `{ "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", "text": "test@example.com", "operation": "test" }`
- **Outcome**: Returns `{ "matched": true }`.

---

## 13. JWT Token Inspector (`jwt_inspector`) — Developer Pack

### User Request 1 (Token Claims Inspection)

> "Inspect this JWT token and show me what claims, issuer, and expiration timestamps it contains."

- **Tool Selected**: `jwt_inspector`
- **Arguments**: `{ "token": "eyJhbGciOi..." }`
- **Outcome**: Returns decoded header, payload claims, subject, expiration date, and security notice.

---

## 14. URL Analyzer (`url_analyzer`) — Developer Pack

### User Request 1 (URL Decomposition)

> "Analyze this URL and break down its protocol, hostname, port, and query parameters."

- **Tool Selected**: `url_analyzer`
- **Arguments**: `{ "url": "https://api.quilonix.dev:8443/v1/search?query=mcp&filter=free#results" }`
- **Outcome**: Returns structured URL components without making any network requests.

---

## 15. MIME & File Type Analyzer (`mime_analyzer`) — Developer Pack

### User Request 1 (Magic Byte Detection)

> "What file format do these header magic bytes '89504E470D0A1A0A' represent?"

- **Tool Selected**: `mime_analyzer`
- **Arguments**: `{ "byteSample": "89504E470D0A1A0A", "sampleEncoding": "hex" }`
- **Outcome**: Returns `{ "detectedMimeType": "image/png", "category": "image", "confidence": "high", "magicSignature": { "matched": true, "signatureName": "PNG" } }`.

### User Request 2 (File Extension & Content Mismatch)

> "Check if this file named 'invoice.pdf' with PNG magic header bytes has a mismatch."

- **Tool Selected**: `mime_analyzer`
- **Arguments**: `{ "filename": "invoice.pdf", "byteSample": "89504E470D0A1A0A" }`
- **Outcome**: Returns `{ "mismatchDetected": true, "mismatchDetails": "File extension '.pdf' implies 'application/pdf', but magic byte header indicates 'image/png'" }`.

---

## 16. Cross-Capability Tool Disambiguation

When user requests involve overlapping domains, AI assistants use explicit usage guidance to select the optimal capability:

| User Scenario                                   | Correct Tool         | Incorrect Tool             | Rationale                                                                            |
| :---------------------------------------------- | :------------------- | :------------------------- | :----------------------------------------------------------------------------------- |
| Compare two JSON configurations for changes     | `text_diff_analyzer` | `json_formatter_validator` | User wants difference analysis, not single-file validation                           |
| Convert tabular CSV rows into JSON objects      | `csv_processor`      | `json_formatter_validator` | Requires RFC 4180 tabular parsing into JSON records                                  |
| Format or inspect SQL queries                   | `sql_processor`      | `text_diff_analyzer`       | Specific SQL grammar tokenization, formatting, and clause inspection                 |
| Convert XML configuration into JSON             | `xml_processor`      | `csv_processor`            | Hierarchical XML tree conversion with attribute handling and XXE safety              |
| Extract links/headings or clean HTML markup     | `html_processor`     | `markdown_processor`       | HTML DOM tree parsing and tag sanitization vs Markdown AST                           |
| Explain or compute cron execution times         | `cron_analyzer`      | `unit_time_converter`      | Cron dialect parsing and recurrence evaluation vs simple date/unit conversion        |
| Detect true media type from binary header bytes | `mime_analyzer`      | `hash_and_encoding`        | Binary magic signature matching vs cryptographic hashing                             |
| Extract claims from auth token                  | `jwt_inspector`      | `hash_and_encoding`        | Requires structured JWT payload decomposition                                        |
| Deconstruct URL parameters and origin           | `url_analyzer`       | `regex_tester`             | WHATWG parser handles edge cases and encoding automatically                          |
| Convert hex color and calculate luminance       | `color_converter`    | `unit_time_converter`      | `unit_time_converter` handles physical units; `color_converter` handles color spaces |

---

## 17. Curated MCP Prompts Catalog

The server exposes 7 pre-built MCP Prompt templates (`prompts/list`, `prompts/get`) to structure AI interactions:

| Prompt Name                | Primary Arguments                           | Target Capabilities                                               | Description                                                                              |
| :------------------------- | :------------------------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **`analyze_json`**         | `json` (required), `operation`              | `json_formatter_validator`                                        | Guides the AI assistant to validate syntax, format, minify, or inspect keys/depth.       |
| **`analyze_csv`**          | `csv` (required), `goal`                    | `csv_processor`                                                   | Guides the AI assistant to parse tabular schemas, filter rows, sort, or convert to JSON. |
| **`analyze_text`**         | `text` (required), `secondaryText`, `focus` | `text_diff_analyzer`, `markdown_processor`                        | Guides the AI assistant to compute diffs or extract Markdown structure.                  |
| **`analyze_web_document`** | `documentText` (required), `focus`          | `html_processor`, `url_analyzer`                                  | Guides the AI assistant to analyze offline HTML markup or URLs without network access.   |
| **`developer_debug`**      | `content` (required), `artifactType`        | `regex_tester`, `jwt_inspector`, `mime_analyzer`, `sql_processor` | Guides the AI assistant to debug regexes, JWT tokens, MIME bytes, or SQL syntax.         |
| **`data_transform`**       | `data`, `sourceFormat`, `targetFormat`      | `csv_processor`, `xml_processor`, `json_formatter_validator`      | Guides the AI assistant to convert between JSON, CSV, and XML offline.                   |
| **`schedule_analysis`**    | `expression` (required), `baseTimestamp`    | `cron_analyzer`                                                   | Guides the AI assistant to explain cron expressions and calculate next occurrences.      |
