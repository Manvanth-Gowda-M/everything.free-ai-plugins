import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CapabilityRegistry } from "../../core/registry.js";
import { ExecutionRunner } from "../../core/execution.js";
import { formatMcpResult } from "./formatters.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import { VERSION, SERVICE_NAME } from "../../version.js";
import { z } from "zod";

/**
 * Creates and configures an McpServer instance mapped to all capabilities, resources, and prompts.
 */
export function createMcpServer(registry: CapabilityRegistry): McpServer {
  const server = new McpServer(
    {
      name: SERVICE_NAME,
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // 1. Register each capability in the registry as an MCP tool
  for (const capability of registry.getAll()) {
    const { name, description } = capability.metadata;

    const shape =
      capability.inputSchema instanceof z.ZodObject
        ? capability.inputSchema.shape
        : { input: capability.inputSchema };

    server.tool(name, description, shape, async (args: Record<string, unknown>) => {
      const result = await ExecutionRunner.run(capability, args);
      return formatMcpResult(result);
    });
  }

  // 2. Register MCP read-only Resources
  registerResources(server, registry);

  // 3. Register MCP Prompts
  registerPrompts(server);

  return server;
}

export * from "./resources.js";
export * from "./prompts.js";
