# Claude & Claude Desktop Integration Guide

Everything.Free AI Plugins integrates natively with **Claude Desktop** and other Claude MCP-compatible environments via **MCP stdio transport**.

**Status**: Verified / Native MCP Support

---

## 1. Integration Architecture

```text
┌─────────────────┐             stdio IPC             ┌───────────────────────────┐
│ Claude Desktop  │ ────────────────────────────────> │ Everything.Free MCP Server│
│   (MCP Client)  │ <──────────────────────────────── │ (StdioServerTransport)    │
└─────────────────┘                                   └───────────────────────────┘
```

Because Claude Desktop natively implements the Model Context Protocol, **no separate Anthropic SDK or custom adapter is required**. Claude connects directly to `everything-free stdio` over standard input/output streams.

---

## 2. Configuration Setup

Add Everything.Free to your Claude Desktop configuration file:

### Configuration File Locations

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Configuration JSON

```json
{
  "mcpServers": {
    "everything-free": {
      "command": "npx",
      "args": ["-y", "everything.free-ai-plugins", "stdio"]
    }
  }
}
```

Or for a local development build:

```json
{
  "mcpServers": {
    "everything-free-dev": {
      "command": "node",
      "args": ["c:/path/to/everything.free-ai-plugins/dist/server.js", "stdio"]
    }
  }
}
```

---

## 3. Verified Functionality

| Feature                       | Support Status | Notes                                                                                                    |
| :---------------------------- | :------------- | :------------------------------------------------------------------------------------------------------- |
| **`tools/list` & `call`**     | **Verified**   | All 15 capabilities discovered and executable in Claude conversations.                                   |
| **`resources/list` & `read`** | **Verified**   | Read-only capability catalog (`everything-free://capabilities`) and capability docs available to Claude. |
| **`prompts/list` & `get`**    | **Verified**   | 7 pre-built workflow prompt templates available via Claude's prompt picker.                              |

---

## 4. Troubleshooting & Best Practices

- **Command Not Found**: Ensure Node.js (`>=20.0.0`) is installed and available in the user's system PATH.
- **Inspect Communication**: Use the official MCP Inspector to test stdio interactions:
  ```bash
  npx @modelcontextprotocol/inspector node dist/server.js stdio
  ```
