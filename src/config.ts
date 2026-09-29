/**
 * Centralized Application & Server Configuration.
 * Defaults are tuned for safe local execution and predictable resource usage.
 */

export interface AppConfig {
  /** HTTP Server Port (default: 3000) */
  port: number;
  /** HTTP Host Interface (default: '127.0.0.1' for local loopback isolation) */
  host: string;
  /** Maximum allowable HTTP request body size in bytes (default: 1MB = 1048576) */
  maxBodySizeBytes: number;
  /** Maximum concurrent in-flight MCP requests (default: 20) */
  maxConcurrentRequests: number;
  /** Maximum grace period in ms for active requests to finish during shutdown (default: 5000) */
  shutdownTimeoutMs: number;
  /** Logging verbosity ('error' | 'warn' | 'info' | 'none') */
  logLevel: "error" | "warn" | "info" | "none";
}

export const DEFAULT_CONFIG: AppConfig = {
  port: 3000,
  host: "127.0.0.1",
  maxBodySizeBytes: 1024 * 1024, // 1 MB
  maxConcurrentRequests: 20,
  shutdownTimeoutMs: 5000,
  logLevel: "info",
};

/**
 * Loads application configuration merging environment variables and optional runtime overrides.
 */
export function loadConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const port = overrides.port ?? (process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_CONFIG.port);
  const host = overrides.host ?? (process.env.HOST || DEFAULT_CONFIG.host);
  const maxBodySizeBytes =
    overrides.maxBodySizeBytes ??
    (process.env.MAX_BODY_SIZE_BYTES
      ? parseInt(process.env.MAX_BODY_SIZE_BYTES, 10)
      : DEFAULT_CONFIG.maxBodySizeBytes);
  const maxConcurrentRequests =
    overrides.maxConcurrentRequests ??
    (process.env.MAX_CONCURRENT_REQUESTS
      ? parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10)
      : DEFAULT_CONFIG.maxConcurrentRequests);
  const shutdownTimeoutMs =
    overrides.shutdownTimeoutMs ??
    (process.env.SHUTDOWN_TIMEOUT_MS
      ? parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10)
      : DEFAULT_CONFIG.shutdownTimeoutMs);
  const logLevel =
    overrides.logLevel ??
    ((process.env.LOG_LEVEL as AppConfig["logLevel"]) || DEFAULT_CONFIG.logLevel);

  return {
    port,
    host,
    maxBodySizeBytes: isNaN(maxBodySizeBytes) || maxBodySizeBytes <= 0 ? DEFAULT_CONFIG.maxBodySizeBytes : maxBodySizeBytes,
    maxConcurrentRequests: isNaN(maxConcurrentRequests) || maxConcurrentRequests <= 0 ? DEFAULT_CONFIG.maxConcurrentRequests : maxConcurrentRequests,
    shutdownTimeoutMs: isNaN(shutdownTimeoutMs) || shutdownTimeoutMs <= 0 ? DEFAULT_CONFIG.shutdownTimeoutMs : shutdownTimeoutMs,
    logLevel,
  };
}
