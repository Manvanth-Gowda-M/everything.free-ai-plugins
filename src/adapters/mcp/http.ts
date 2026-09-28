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

  const server = http.createServer(async (req, res) => {
    // Enable CORS for all AI clients and ChatGPT Developer Mode
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, Authorization, Mcp-Session-Id"
    );

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // Safe diagnostics health check endpoint (Zero telemetry, zero secrets, zero paths)
    if (url.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "everything-free-ai-plugins",
          version: "0.1.0",
          capabilitiesCount: registry.count(),
          packsCount: 5,
          transports: ["streamable-http", "stdio"],
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Streamable HTTP MCP Endpoint
    if (url.pathname === "/mcp" || url.pathname === "/") {
      try {
        // In stateless mode, each incoming HTTP request uses a fresh transport instance
        // connected to the MCP Server instance
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        const mcpServer = createMcpServer(registry);
        await mcpServer.connect(transport);
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
