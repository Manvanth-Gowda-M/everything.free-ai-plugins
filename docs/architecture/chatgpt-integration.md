# ChatGPT Integration Architecture & Testing Guide

## 1. Overview & Official MCP Transport

OpenAI connects ChatGPT to external developer tools using the **Model Context Protocol (MCP)** standard.

### Transport Strategy

1. **Primary & Production: Streamable HTTP (`/mcp`)**
   - ChatGPT sends JSON-RPC requests via `POST /mcp` with `Accept: application/json, text/event-stream`.
   - Hosted using native Node.js HTTP (`node:http`) with `@modelcontextprotocol/sdk`.
   - Responses are delivered in standard JSON or Streamable SSE message events.
2. **Local & Testing: Stdio Transport**
   - Uses standard I/O (`process.stdin` / `process.stdout`) for zero-network testing with MCP Inspector (`@modelcontextprotocol/inspector`).

---

## 2. Real ChatGPT End-to-End Connection Guide

### Step 1: Start the Local MCP Server

```bash
npm run dev
```

- The server starts listening on `http://localhost:3000/mcp`.
- You can verify the health endpoint at `http://localhost:3000/health`.

### Step 2: Expose an HTTPS Tunnel (₹0, No Account Needed)

Open a separate terminal window and run:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Cloudflare Quick Tunnels will output an ephemeral public HTTPS URL, for example:
`https://random-subdomain.trycloudflare.com`

Your MCP endpoint is:
`https://random-subdomain.trycloudflare.com/mcp`

### Step 3: Configure ChatGPT Developer Mode

1. In ChatGPT Web, open **Settings** (bottom left profile icon).
2. Go to **Security & login** (or **Developer settings**).
3. Toggle **Developer mode** to **ON**.
4. Under **Apps / Plugins** settings, click **Add App** / **Create Developer App**.
5. Enter the MCP Server URL:
   `https://random-subdomain.trycloudflare.com/mcp`
6. Authentication: Select **No Authentication** (or No Auth).
7. Save and enable the app.

---

## 3. Real ChatGPT Test Cases & Verification

Once connected, test the following prompt interactions in a ChatGPT session:

### Test Case 1: Valid JSON Validation

- **Prompt**:
  > Use Everything.Free to validate this JSON:
  >
  > ```json
  > {
  >   "name": "Everything.Free",
  >   "free": true
  > }
  > ```
- **ChatGPT Action**: Invokes `json_formatter_validator` with `action: "validate"`.
- **Expected Result**: Confirms that the JSON is syntactically valid.

---

### Test Case 2: Pretty-Print Formatting

- **Prompt**:
  > Use Everything.Free to format this JSON:
  > `{"name":"Everything.Free","version":1}`
- **ChatGPT Action**: Invokes `json_formatter_validator` with `action: "format"`, `indent: 2`.
- **Expected Result**: Returns pretty-printed indented JSON.

---

### Test Case 3: Minification

- **Prompt**:
  > Use Everything.Free to minify this JSON:
  >
  > ```json
  > {
  >   "name": "Everything.Free",
  >   "version": 1
  > }
  > ```
- **ChatGPT Action**: Invokes `json_formatter_validator` with `action: "minify"`.
- **Expected Result**: Returns compact minified JSON string `{"name":"Everything.Free","version":1}`.

---

### Test Case 4: Structure & Metrics Inspection

- **Prompt**:
  > Use Everything.Free to inspect this JSON and tell me its structure:
  > `{"users": [{"id": 1, "role": "admin"}], "active": true}`
- **ChatGPT Action**: Invokes `json_formatter_validator` with `action: "inspect"`.
- **Expected Result**: Returns root type (`object`), nesting depth (3), and key count (2).

---

### Test Case 5: Syntax Error Diagnostics

- **Prompt**:
  > Use Everything.Free to validate this JSON:
  > `{"name": "broken", "value": }`
- **ChatGPT Action**: Invokes `json_formatter_validator` with `action: "validate"`.
- **Expected Result**: Returns `valid: false` with precise line/column diagnosis and context snippet. ChatGPT clearly explains the syntax issue to the user without server error.

---

## 4. Zero-Retention & Privacy Verification

- **Ephemeral Buffers**: Data passed into `json_formatter_validator` exists only in transient Node.js memory during the synchronous parse/format operation.
- **No Disk Writes**: No payload files, logs, or databases are created.
- **No Content Logging**: Server logs record only request timestamps and endpoint hits, strictly omitting payload data.
