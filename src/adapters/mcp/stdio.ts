import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CapabilityRegistry } from "../../core/registry.js";
import { createMcpServer } from "./server.js";

/**
 * Starts the MCP server in stdio mode for local CLI / MCP Inspector / Claude Desktop.
 */
export async function startStdioServer(registry: CapabilityRegistry): Promise<void> {
  const server = createMcpServer(registry);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr to avoid corrupting stdio JSON-RPC protocol on stdout
  process.stderr.write("[Everything.Free] MCP server connected in stdio mode\n");
}
