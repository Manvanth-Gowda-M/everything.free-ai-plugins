# JWT Token Inspector (`jwt_inspector`)

## 1. Overview

The `jwt_inspector` capability parses, decodes, and inspects JSON Web Tokens (JWT) locally in memory. It extracts headers, payloads, standard claims (issuer, subject, audience, expiration), and calculates token expiration metrics.

- **Pack**: `Developer Pack`
- **Category**: `developer`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (in-memory)
- **Privacy**: `local-only` (Zero retention, never persisted or logged)
- **External Dependencies**: None

---

## 2. Decoded vs. Verified Notice

> **IMPORTANT**: JWT decoding is strictly a structural and claims inspection tool. It does **NOT** perform cryptographic signature verification. Successful decoding proves structural validity, not authenticity or trust.

---

## 3. Supported Operations

| Operation | Description                                     | Output                                                                                                             |
| :-------- | :---------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `inspect` | Decodes header, payload, claims, and timestamps | `{ validStructure, header, payload, subject, issuer, audience, timestamps, signaturePreview, verificationNotice }` |

---

## 4. Input Schema

```typescript
{
  token: string; // Required, 1 to 10,000 characters (max 10KB)
}
```

---

## 5. Security & Privacy

1. **Zero Retention**: Tokens are never persisted to disk, database, or logs.
2. **Signature Redaction**: Signature payload is truncated in output previews.
3. **No Secret Request**: The tool does not accept, require, or store cryptographic keys or secrets.
