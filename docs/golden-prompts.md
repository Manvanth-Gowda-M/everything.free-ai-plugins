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
* **Tool Selected**: `json_formatter_validator`
* **Arguments**: `{ "jsonString": "...", "action": "validate" }`
* **Outcome**: Returns `{ "valid": true }`.

### User Request 2 (Pretty-Printing)
> "Format this minified JSON string with 2-space indentation."
```json
{"name":"Quilonix","roles":["core","lead"],"active":true}
```
* **Tool Selected**: `json_formatter_validator`
* **Arguments**: `{ "jsonString": "...", "action": "format", "indent": 2 }`
* **Outcome**: Returns formatted multiline JSON string.

---

## 2. CSV Processor (`csv_processor`) — Data Pack

### User Request 1 (Structure Inspection)
> "Inspect this CSV and tell me what columns and rows it contains."
```csv
id,name,age,active
1,Alice,30,true
2,Bob,24,false
```
* **Tool Selected**: `csv_processor`
* **Arguments**: `{ "csvText": "...", "operation": "inspect" }`
* **Outcome**: Returns row count (2), column list, empty cell count, and inferred types.

### User Request 2 (Filtering)
> "Filter this CSV to rows where age is greater than 25."
* **Tool Selected**: `csv_processor`
* **Arguments**: `{ "csvText": "...", "operation": "filter", "filterColumn": "age", "filterOperator": "greater_than", "filterValue": "25" }`
* **Outcome**: Returns filtered row set.

### User Request 3 (CSV to JSON)
> "Convert this CSV dataset into an array of JSON objects."
* **Tool Selected**: `csv_processor`
* **Arguments**: `{ "csvText": "...", "operation": "to_json" }`
* **Outcome**: Returns `{ "jsonData": [{ "id": 1, "name": "Alice", "age": 30, "active": true }, ...] }`.

---

## 3. Text Diff Analyzer (`text_diff_analyzer`) — Text Pack

### User Request 1 (Configuration Diff)
> "What changed between my previous .env file and the new one?"
* **Original**:
  ```env
  PORT=3000
  NODE_ENV=development
  DEBUG=true
  ```
* **Modified**:
  ```env
  PORT=8080
  NODE_ENV=production
  DEBUG=false
  ```
* **Tool Selected**: `text_diff_analyzer`
* **Arguments**: `{ "original": "...", "modified": "...", "mode": "line" }`
* **Outcome**: Returns 3 additions, 3 removals, and unified diff output.

---

## 4. Markdown Processor (`markdown_processor`) — Text Pack

### User Request 1 (Heading Extraction & Outline)
> "Extract all headings and hierarchy from this Markdown document."
* **Tool Selected**: `markdown_processor`
* **Arguments**: `{ "markdownText": "...", "operation": "headings" }`
* **Outcome**: Returns list of headings with levels (H1-H6), anchor slugs, and line numbers.

### User Request 2 (Table of Contents Generation)
> "Generate a markdown Table of Contents from this document."
* **Tool Selected**: `markdown_processor`
* **Arguments**: `{ "markdownText": "...", "operation": "toc" }`
* **Outcome**: Returns hierarchical markdown list of anchor links.

---

## 5. Hash & Encoding (`hash_and_encoding`) — Encoding Pack

### User Request 1 (SHA-256 Checksum)
> "Calculate the SHA-256 checksum of 'Everything.Free AI Plugins'."
* **Tool Selected**: `hash_and_encoding`
* **Arguments**: `{ "operation": "sha256", "input": "Everything.Free AI Plugins" }`
* **Outcome**: Returns 64-character hex hash.

### User Request 2 (Base64 Encoding)
> "Encode the string 'hello:world' into Base64 format."
* **Tool Selected**: `hash_and_encoding`
* **Arguments**: `{ "operation": "base64_encode", "input": "hello:world" }`
* **Outcome**: Returns `"aGVsbG86d29ybGQ="`.

---

## 6. Unit & Time Converter (`unit_time_converter`) — Utility Pack

### User Request 1 (Physical Unit Conversion)
> "How many kilometers is 10 miles?"
* **Tool Selected**: `unit_time_converter`
* **Arguments**: `{ "mode": "unit", "value": 10, "fromUnit": "mi", "toUnit": "km" }`
* **Outcome**: Returns `16.09344 km`.

### User Request 2 (Timestamp & Timezone Conversion)
> "Convert the Unix timestamp 1700000000 into an ISO 8601 string in UTC."
* **Tool Selected**: `unit_time_converter`
* **Arguments**: `{ "mode": "time", "timeInput": 1700000000, "targetTimezone": "UTC" }`
* **Outcome**: Returns ISO `2023-11-14T22:13:20.000Z`.

---

## 7. Color Converter (`color_converter`) — Utility Pack

### User Request 1 (Color Conversion & Luminance)
> "Convert #D4AF37 to RGB and HSL, and tell me its relative luminance."
* **Tool Selected**: `color_converter`
* **Arguments**: `{ "color": "#D4AF37" }`
* **Outcome**: Returns RGB `rgb(212, 175, 55)`, HSL `hsl(46, 65%, 52%)`, HWB, OKLCH, and WCAG luminance `0.4439`.

---

## 8. Regex Tester (`regex_tester`) — Developer Pack

### User Request 1 (Pattern Validation)
> "Test whether the string 'test@example.com' matches a standard email regular expression."
* **Tool Selected**: `regex_tester`
* **Arguments**: `{ "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", "text": "test@example.com", "operation": "test" }`
* **Outcome**: Returns `{ "matched": true }`.

---

## 9. JWT Token Inspector (`jwt_inspector`) — Developer Pack

### User Request 1 (Token Claims Inspection)
> "Inspect this JWT token and show me what claims, issuer, and expiration timestamps it contains."
* **Tool Selected**: `jwt_inspector`
* **Arguments**: `{ "token": "eyJhbGciOi..." }`
* **Outcome**: Returns decoded header, payload claims, subject, expiration date, and security notice.

---

## 10. URL Analyzer (`url_analyzer`) — Developer Pack

### User Request 1 (URL Decomposition)
> "Analyze this URL and break down its protocol, hostname, port, and query parameters."
* **Tool Selected**: `url_analyzer`
* **Arguments**: `{ "url": "https://api.quilonix.dev:8443/v1/search?query=mcp&filter=free#results" }`
* **Outcome**: Returns structured URL components without making any network requests.
