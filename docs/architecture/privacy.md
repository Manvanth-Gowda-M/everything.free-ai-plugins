# Privacy Architecture & Principles

## 1. Core Privacy Philosophy

**Everything.Free AI Plugins** adheres to a strict **Privacy-First, Zero-Retention** design. Users interacting with AI assistants should not have their data harvested, profiled, or retained when utilizing Everything.Free capabilities.

---

## 2. Fundamental Privacy Rules

### 1. Zero Data Persistence (Stateless by Default)
* The Everything.Free server does not persist user prompts, tool arguments, or execution results to disk or databases.
* All processing occurs entirely in ephemeral in-memory buffers during the lifecycle of the single request.

### 2. No Content Logging
* Server request logs contain only metadata (timestamp, HTTP status, capability name, execution duration).
* **Payload content, tool arguments, and output text are strictly excluded from server logs.**

### 3. Local-First Execution
* Whenever possible, capabilities execute locally using deterministic JavaScript/WASM algorithms (e.g., formatting, encoding, math calculations, diffing).
* User data is **never transmitted to external third-party servers** unless the capability explicitly and unambiguously requires external public data (e.g. fetching public exchange rates).

### 4. Transparent Capability Privacy Notice
* Every capability definition includes explicit metadata disclosing its network and data behavior:
  * `requiresExternalNetwork`: `boolean`
  * `privacyNotice`: clear description of any external data transmission.

### 5. Telemetry & Analytics Policy
* Everything.Free does not embed third-party tracking scripts, trackers, or marketing analytics.
* Any future aggregate metrics (e.g., total invocation counts) will be strictly anonymous and devoid of user identifiers or payload contents.

---

## 3. Privacy Boundary Diagram

```
User Input ───► ChatGPT ───► Everything.Free Server
                                │
                                ├─► In-Memory Execution (Local computation)
                                │   └─► Output generated (No disk write)
                                │
                                ├─► Logging: [200 OK] json_formatter (1.2ms)
                                │   (Payload NEVER logged)
                                │
                                └─► Response back to ChatGPT ───► User
```
