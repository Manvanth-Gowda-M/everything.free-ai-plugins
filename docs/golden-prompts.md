# Golden Prompts & AI Interaction Benchmark

This document defines canonical, real-world user prompts for **Everything.Free AI Plugins**, showing how an AI assistant (like ChatGPT) discovers, selects, and invokes each capability.

---

## 1. JSON Formatter & Validator (`json_formatter_validator`)

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

## 2. Text Diff Analyzer (`text_diff_analyzer`)

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

## 3. Hash & Encoding (`hash_and_encoding`)

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

## 4. Unit & Time Converter (`unit_time_converter`)

### User Request 1 (Physical Unit Conversion)
> "How many kilometers is 10 miles?"
* **Tool Selected**: `unit_time_converter`
* **Arguments**: `{ "mode": "unit", "value": 10, "fromUnit": "mi", "toUnit": "km" }`
* **Outcome**: Returns `16.09344 km`.

### User Request 2 (Timestamp & Timezone Conversion)
> "Convert the Unix timestamp 1700000000 into an ISO 8601 string and what date it represents in America/New_York."
* **Tool Selected**: `unit_time_converter`
* **Arguments**: `{ "mode": "time", "timeInput": 1700000000, "targetTimezone": "America/New_York" }`
* **Outcome**: Returns ISO `2023-11-14T22:13:20.000Z` and formatted date in New York.

---

## 5. Regex Tester (`regex_tester`)

### User Request 1 (Pattern Validation)
> "Test whether the string 'test@example.com' matches a standard email regular expression."
* **Tool Selected**: `regex_tester`
* **Arguments**: `{ "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", "text": "test@example.com", "operation": "test" }`
* **Outcome**: Returns `{ "matched": true }`.

### User Request 2 (Token Extraction)
> "Extract all version numbers like v1.0.0 from this changelog."
* **Tool Selected**: `regex_tester`
* **Arguments**: `{ "pattern": "v\\d+\\.\\d+\\.\\d+", "text": "...", "operation": "match" }`
* **Outcome**: Returns array of extracted version tokens.
