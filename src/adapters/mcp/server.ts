import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CapabilityRegistry } from "../../core/registry.js";
import { ExecutionRunner } from "../../core/execution.js";
import { formatMcpResult } from "./formatters.js";
import { z } from "zod";

/**
 * Creates and configures an McpServer instance mapped to all capabilities in the registry.
 */
export function createMcpServer(registry: CapabilityRegistry): McpServer {
  const server = new McpServer(
    {
      name: "everything-free-ai-plugins",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register each capability in the registry as an MCP tool
  for (const capability of registry.getAll()) {
    const { name, description } = capability.metadata;

    // McpServer.tool takes (name, description, zodSchema, handler)
    // When inputSchema is a ZodObject or ZodType, we bind it to the MCP tool runner
    const shape =
      capability.inputSchema instanceof z.ZodObject
        ? capability.inputSchema.shape
        : { input: capability.inputSchema };

    server.tool(
      name,
      description,
      shape,
      async (args: Record<string, unknown>) => {
        const result = await ExecutionRunner.run(capability, args);
        return formatMcpResult(result);
      }
    );
  }

  return server;
}
