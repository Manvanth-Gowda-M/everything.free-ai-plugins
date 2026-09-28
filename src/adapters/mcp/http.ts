import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CapabilityRegistry } from "../../core/registry.js";
import { createMcpServer } from "./server.js";

export interface HttpServerOptions {
  port?: number;
  host?: string;
}

/**
 * Starts the native Node.js HTTP server hosting the Streamable HTTP MCP transport.
 */
export function startHttpServer(
  registry: CapabilityRegistry,
  options: HttpServerOptions = {}
): http.Server {
  const port = options.port ?? (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
  const host = options.host ?? (process.env.HOST || "0.0.0.0");

  // Create MCP Server and Streamable HTTP transport
  const mcpServer = createMcpServer(registry);
  const transport = new StreamableHTTPServerTransport({
    // Keep stateless or session-based as configured
  });

  // Connect transport to MCP server
  mcpServer.connect(transport).catch((err) => {
    process.stderr.write(`[Everything.Free] Failed to connect MCP server to transport: ${err}\n`);
  });

  const server = http.createServer(async (req, res) => {
    // Enable CORS for all AI clients and ChatGPT Developer Mode
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Mcp-Session-Id"
    );

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Health check endpoint
    if (url.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "everything-free-ai-plugins",
          capabilitiesCount: registry.count(),
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Streamable HTTP MCP Endpoint
    if (url.pathname === "/mcp" || url.pathname === "/") {
      try {
        await transport.handleRequest(req, res);
      } catch (err: unknown) {
        process.stderr.write(`[Everything.Free] Request error: ${err}\n`);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal MCP server error" }));
        }
      }
      return;
    }

    // 404 Not Found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        message: "Everything.Free AI Plugins endpoint is at /mcp",
      })
    );
  });

  server.listen(port, host, () => {
    process.stdout.write(
      `[Everything.Free] MCP Streamable HTTP Server running on http://${host}:${port}/mcp\n`
    );
  });

  return server;
}
