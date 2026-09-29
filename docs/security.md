# Security Policy & Production Threat Model

Everything.Free AI Plugins is designed from the ground up for safe, local-first, privacy-preserving AI assistant tooling.

---

## 1. Production Threat Model

| Threat Scenario | Risk Profile | Application-Level Defense | Deployment-Level Defense |
| :--- | :--- | :--- | :--- |
| **Oversized / DoS Payloads** | High | Request body size limit (`maxBodySizeBytes`, default 1 MB). Early 413 rejection before buffering. Capability input length limits. | Reverse proxy `client_max_body_size` & edge WAF. |
| **Concurrent Request Exhaustion** | High | Configurable concurrency limiter (`maxConcurrentRequests`, default 20) with 429 Too Many Requests response. | Reverse proxy rate limiting (e.g. `limit_req_zone` in Nginx). |
| **CPU / ReDoS Abuse** | High | ReDoS pattern validation, timeout bounding (default 3000ms), and algorithmic limits on regex & diff engines. | Process cgroups / container CPU limits (`--cpus=1.0`). |
| **Memory Exhaustion** | Medium | Strict input string length bounds, shallow max depth limits, stateless in-memory garbage collection. | Container memory limits (`--memory=512m`) and OOM killer guards. |
| **Arbitrary Code Execution** | Critical | 100% prohibited. Verified zero `eval`, `Function(`, or `child_process` across all capabilities. | Unprivileged non-root container execution (`USER node`). |
| **Server-Side Request Forgery (SSRF)** | Critical | Capabilities are completely offline. Zero outbound sockets or `fetch` calls. URL parsing operates purely offline via WHATWG parser. | Outbound firewall egress rules rejecting external internet access. |
| **XML External Entity (XXE) Injection** | Critical | Custom offline XML parser with zero external DTD, entity, or SYSTEM expansion support. | N/A (Fully mitigated at application layer). |
| **SQL Injection / DB Breach** | Critical | SQL processor is an offline grammar tokenizer and formatter. No database connections exist or are possible. | N/A (No database attached). |
| **Sensitive Data Exposure in Logs** | Medium | Strictly redacted log policy. Logs never contain request bodies, capability outputs, JWTs, or user text. | Centralized log ingestion with audit access control. |
| **Accidental Public Exposure** | High | Default loopback interface binding (`127.0.0.1`). | Reverse proxy with TLS termination, IP allowlisting, and VPN/mTLS. |

---

## 2. In-Memory Sandboxing Guarantees

Every capability operates under strict sandboxing invariants:
1. **Offline Only**: Capabilities process purely in-memory data provided directly by the caller.
2. **Zero File System Traversal**: No capability accesses the host filesystem (`node:fs` is strictly forbidden in capability handlers).
3. **Bounded Timeouts**: All capability invocations are wrapped by `ExecutionRunner.run()` enforcing explicit timeouts (default 3000ms).
4. **Normalized Error Taxonomy**: Errors never leak system file paths, stack traces, or environment variables.

---

## 3. Log Privacy Policy

Logs emitted by Everything.Free AI Plugins adhere to zero-retention rules:
* **Allowed Logs**: Server startup, port/host binding, clean shutdown events, HTTP response status codes, and normalized error categories.
* **Strictly Prohibited from Logs**:
  * Input arguments and JSON-RPC payloads
  * Transformed output strings
  * Passwords, tokens, or JWT strings
  * Extracted URLs or user document text

---

## 4. Reporting Security Vulnerabilities

If you discover a potential security issue in Everything.Free AI Plugins, please report it privately via GitHub Security Advisories or by contacting the maintainers directly.
