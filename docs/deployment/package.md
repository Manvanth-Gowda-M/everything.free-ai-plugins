# Distribution & Packaging Guide

Everything.Free AI Plugins is packaged as an npm-compatible ESM distribution.

---

## 1. Package Configuration

* **Package Name**: `everything.free-ai-plugins`
* **Target Version**: `0.1.0`
* **Module System**: Pure ESM (`"type": "module"`)
* **Binary Executable**: `everything-free` (`./dist/server.js`)
* **TypeScript Types**: Included (`./dist/index.d.ts`)

---

## 2. Package Contents Inspection

The package is strictly configured with a whitelist in `package.json`:
```json
"files": [
  "dist",
  "README.md",
  "LICENSE"
]
```

### Excluded Artifacts
The published tarball strictly excludes:
- `tests/` and test fixtures
- `.git/` and CI workflow definitions
- `docs/` internal markdown notes
- Scratch scripts and benchmark data
- Local environment files (`.env`)
- Secrets, tokens, and configuration artifacts

### Verification Command
Run pre-pack dry run to inspect the package bundle:
```bash
npm pack --dry-run
```

---

## 3. Running via `npx`

Users will be able to launch Everything.Free directly without manual global installation:

```bash
# Start Streamable HTTP server on localhost
npx everything.free-ai-plugins

# Start stdio MCP server for Claude Desktop / CLI tools
npx everything.free-ai-plugins stdio

# View version and help
npx everything.free-ai-plugins --version
npx everything.free-ai-plugins --help
```

---

## 4. Security Verification
- Zero telemetry dependencies.
- Zero arbitrary network or filesystem execution.
- No analytics or credential collectors.
- Safe local loopback binding (`127.0.0.1`) by default.
