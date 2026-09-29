# URL Analyzer (`url_analyzer`)

## 1. Overview

The `url_analyzer` capability parses, decomposes, normalizes, and inspects URL strings completely offline using standard WHATWG parsing rules.

- **Pack**: `Developer Pack`
- **Category**: `developer`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (in-memory)
- **Privacy**: `local-only` (Zero network requests, zero DNS resolution)
- **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description                                                                    | Output                                                                                                                                             |
| :-------- | :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analyze` | Decomposes URL into constituent protocol, host, port, path, query params, hash | `{ url, components: { protocol, hostname, port, pathname, search, hash, origin, username, hasPassword, isIpAddress, queryParams, pathSegments } }` |

---

## 3. Input Schema

```typescript
{
  url: string; // Required, 1 to 4096 characters
}
```

---

## 4. Security & Safety (Anti-SSRF Guarantee)

1. **Zero Network Calls**: Zero `fetch()`, zero HTTP requests, zero socket connections.
2. **Zero DNS Resolution**: Hostnames are treated as strings; no DNS lookups are performed.
3. **SSRF Elimination**: Because this tool is strictly a static string parser, Server-Side Request Forgery is mathematically impossible.
