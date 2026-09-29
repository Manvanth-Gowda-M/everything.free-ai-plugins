import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CapabilityRegistry } from "../../core/registry.js";
import { createMcpServer } from "./server.js";
import { VERSION, SERVICE_NAME } from "../../version.js";
import { AppConfig, loadConfig } from "../../config.js";

export type HttpServerOptions = Partial<AppConfig>;

/**
 * Robust, production-hardened Streamable HTTP MCP Server implementation.
 */
export function startHttpServer(
  registry: CapabilityRegistry,
  options: HttpServerOptions = {}
): http.Server {
  const config = loadConfig(options);
  let activeRequests = 0;
  let isShuttingDown = false;

  const server = http.createServer(async (req, res) => {
    // 1. Apply baseline HTTP security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");

    // 2. Standard CORS headers for AI clients and ChatGPT Developer Mode
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, Authorization, Mcp-Session-Id"
    );

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // 3. Graceful shutdown check
    if (isShuttingDown) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Service Unavailable",
          message: "Server is currently shutting down. Please retry later.",
        })
      );
      return;
    }

    // 4. Method validation (Reject unsupported HTTP methods)
    const allowedMethods = ["GET", "POST", "DELETE", "OPTIONS"];
    if (req.method && !allowedMethods.includes(req.method)) {
      res.writeHead(405, {
        "Content-Type": "application/json",
        Allow: "GET, POST, DELETE, OPTIONS",
      });
      res.end(
        JSON.stringify({
          error: "Method Not Allowed",
          message: `HTTP method '${req.method}' is not supported.`,
        })
      );
      return;
    }

    // 5. Concurrency limit protection
    if (activeRequests >= config.maxConcurrentRequests) {
      res.writeHead(429, {
        "Content-Type": "application/json",
        "Retry-After": "1",
      });
      res.end(
        JSON.stringify({
          error: "Too Many Requests",
          message: `Server concurrent request limit (${config.maxConcurrentRequests}) reached. Please retry.`,
        })
      );
      return;
    }

    // Track in-flight request
    activeRequests++;
    const cleanup = () => {
      activeRequests = Math.max(0, activeRequests - 1);
    };
    res.on("finish", cleanup);
    res.on("close", cleanup);

    // 6. Early Request Body Size Validation (Content-Length Header Check)
    const contentLengthHeader = req.headers["content-length"];
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(contentLength) && contentLength > config.maxBodySizeBytes) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Payload Too Large",
            message: `Request body exceeds maximum allowed size of ${config.maxBodySizeBytes} bytes (limit is inclusive).`,
          })
        );
        req.destroy();
        return;
      }
    }

    // 7. Streaming-Safe Byte Limiting Hook (for chunked/streaming & Content-Length streams)
    let totalReceivedBytes = 0;
    let limitExceeded = false;
    const originalPush = req.push;
    const originalWriteHead = res.writeHead.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.writeHead = function (statusCode: number, ...args: any[]): any {
      if (res.headersSent) {
        return res;
      }
      return (originalWriteHead as (...params: unknown[]) => typeof res)(statusCode, ...args);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.push = function (chunk: any, encoding?: BufferEncoding): boolean {
      if (chunk !== null) {
        const chunkLen = Buffer.isBuffer(chunk)
          ? chunk.length
          : typeof chunk === "string"
            ? Buffer.byteLength(chunk, encoding)
            : 0;

        totalReceivedBytes += chunkLen;
        if (totalReceivedBytes > config.maxBodySizeBytes && !limitExceeded) {
          limitExceeded = true;
          if (!res.headersSent) {
            res.writeHead(413, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Payload Too Large",
                message: `Request body exceeds maximum allowed size of ${config.maxBodySizeBytes} bytes (limit is inclusive).`,
              })
            );
          }
          req.destroy();
          return false;
        }
      }
      return originalPush.call(this, chunk, encoding);
    };

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // 8. Safe Diagnostics Health Check (Zero telemetry, zero secrets, zero paths)
    if (url.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: SERVICE_NAME,
          version: VERSION,
          capabilitiesCount: registry.count(),
          packsCount: 5,
          activeRequests,
          maxConcurrentRequests: config.maxConcurrentRequests,
          transports: ["streamable-http", "stdio"],
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // 8b. Readiness Probe Endpoint (Readiness for load balancers & reverse proxies)
    if (url.pathname === "/ready" && req.method === "GET") {
      const isReady = registry.count() > 0 && !isShuttingDown;
      const statusCode = isReady ? 200 : 503;
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: isReady ? "ready" : "not_ready",
          service: SERVICE_NAME,
          capabilitiesCount: registry.count(),
          ready: isReady,
        })
      );
      return;
    }

    // 9. Streamable HTTP MCP Endpoint
    if (url.pathname === "/mcp" || url.pathname === "/") {
      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        const mcpServer = createMcpServer(registry);
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
      } catch (err: unknown) {
        if (!limitExceeded && !res.headersSent) {
          const errMsg = err instanceof Error ? err.message : "Internal server error";
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal MCP server error", message: errMsg }));
        }
      }
      return;
    }

    // 10. 404 Route Not Found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Not Found",
        message: "Everything.Free AI Plugins endpoint is at /mcp",
      })
    );
  });

  // Attach graceful shutdown helpers
  const handleShutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    if (config.logLevel !== "none") {
      process.stdout.write(`\n[Everything.Free] Received ${signal}. Gracefully shutting down...\n`);
    }

    server.close(() => {
      if (config.logLevel !== "none") {
        process.stdout.write("[Everything.Free] HTTP Server closed cleanly.\n");
      }
    });

    const timer = setTimeout(() => {
      if (config.logLevel !== "none") {
        process.stderr.write(
          "[Everything.Free] Graceful shutdown timeout reached. Forcing exit.\n"
        );
      }
      process.exit(0);
    }, config.shutdownTimeoutMs);

    if (timer.unref) timer.unref();
  };

  if (process.env.NODE_ENV !== "test") {
    process.once("SIGINT", () => handleShutdown("SIGINT"));
    process.once("SIGTERM", () => handleShutdown("SIGTERM"));
  }

  server.listen(config.port, config.host, () => {
    if (config.logLevel !== "none") {
      process.stdout.write(
        `[Everything.Free] MCP Streamable HTTP Server running on http://${config.host}:${config.port}/mcp\n`
      );
    }
  });

  return server;
}
