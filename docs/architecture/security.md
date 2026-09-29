# Security Architecture & Policies

## 1. Core Security Principles

Security is a foundational constraint for Everything.Free AI Plugins. In keeping with our **100% Free and Minimal** philosophy:

1. **Zero Shell / Zero Dynamic Code Execution**: No `eval`, `child_process`, or arbitrary script runners.
2. **Strict Zod Input Validation**: Every capability input is strictly parsed and bounded (string length limits, type validation).
3. **Hard Execution Timeouts**: All local computations are bounded by execution timeouts to prevent CPU lockups or ReDoS.
4. **Zero Cloud Dependencies**: The MVP operates completely in-memory with zero external service attack surfaces.
5. **Sanitized Outputs**: Error messages are structured and clean; raw stack traces are never leaked to AI clients.

---

## 2. Threat Model & Safeguards

| Threat Vector                            | Mitigation Strategy in Everything.Free MVP                                                                   |
| :--------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Payload Bloat / Memory Exhaustion**    | Strict 1MB payload size limits enforced at both HTTP and Zod validation layers.                              |
| **ReDoS / Parsing Hangs**                | Bounded timeouts (default 3,000ms max for local computation).                                                |
| **Malicious JSON / Prototype Pollution** | Safe `JSON.parse` with prototype-pollution guard and recursive depth bounds.                                 |
| **Information Disclosure**               | Error messages sanitized to return user-friendly line/column diagnostics without revealing server internals. |
