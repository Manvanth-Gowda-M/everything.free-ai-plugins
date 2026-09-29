# Hash & Encoding Utilities (`hash_and_encoding`)

## 1. Overview

The `hash_and_encoding` capability executes standard cryptographic hashing and encoding/decoding operations using Node.js native `node:crypto` and buffer implementations.

- **Category**: `encoding`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (built-in Node crypto)
- **Privacy**: `local-only` (Zero retention, no content logging)
- **External Dependencies**: None

---

## 2. Supported Operations

| Operation          | Description                                           |
| :----------------- | :---------------------------------------------------- |
| `sha256`           | Generates 256-bit SHA-2 hash (64 hex characters)      |
| `sha512`           | Generates 512-bit SHA-2 hash (128 hex characters)     |
| `base64_encode`    | Encodes UTF-8 string to standard Base64               |
| `base64_decode`    | Decodes standard Base64 string to UTF-8               |
| `base64url_encode` | Encodes string to URL-safe Base64URL                  |
| `base64url_decode` | Decodes Base64URL string to UTF-8                     |
| `hex_encode`       | Encodes UTF-8 string to Hexadecimal string            |
| `hex_decode`       | Decodes Hexadecimal string to UTF-8                   |
| `url_encode`       | URL percentage encoding (`encodeURIComponent`)        |
| `url_decode`       | URL percentage decoding (`decodeURIComponent`)        |
| `uuid_v4`          | Generates a cryptographically random RFC 4122 UUID v4 |

---

## 3. Input Schema

```typescript
{
  operation: "sha256" | "sha512" | "base64_encode" | "base64_decode" |
             "base64url_encode" | "base64url_decode" | "hex_encode" |
             "hex_decode" | "url_encode" | "url_decode" | "uuid_v4";
  input?: string; // Optional (not required for uuid_v4), max 100,000 characters (100KB)
}
```
