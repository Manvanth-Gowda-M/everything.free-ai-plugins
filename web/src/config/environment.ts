/**
 * Everything.Free Environment & Endpoint Configuration
 *
 * Provides dynamic, environment-aware endpoint resolution without hardcoding
 * static production domains or embedding private credentials.
 */

export interface AppEnvironmentConfig {
  environment: "local" | "staging" | "production";
  publicMcpUrl: string;
  isHostedMcpActive: boolean;
  defaultLocalPort: number;
}

/**
 * Validates whether a candidate string is a safe, valid MCP endpoint URL.
 */
export function validateMcpUrl(rawUrl?: string): {
  isValid: boolean;
  sanitizedUrl: string;
  isHttps: boolean;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, sanitizedUrl: "", isHttps: false };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { isValid: false, sanitizedUrl: "", isHttps: false };
  }

  try {
    const parsed = new URL(trimmed);

    // Enforce HTTPS in production or HTTP for local loopback in dev
    if (parsed.protocol === "https:") {
      return { isValid: true, sanitizedUrl: trimmed, isHttps: true };
    }

    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return { isValid: true, sanitizedUrl: trimmed, isHttps: false };
    }

    return {
      isValid: false,
      sanitizedUrl: "",
      isHttps: false,
      error: "Remote MCP endpoint must use secure HTTPS protocol.",
    };
  } catch {
    return {
      isValid: false,
      sanitizedUrl: "",
      isHttps: false,
      error: "Malformed MCP endpoint URL.",
    };
  }
}

// Type-safe access to Vite environment variables
const importMetaEnv: Record<string, string | undefined> =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string | undefined> })?.env) ||
  {};

const rawEnvMcpUrl: string = importMetaEnv.VITE_PUBLIC_MCP_URL || "";
const validated = validateMcpUrl(rawEnvMcpUrl);

const appEnv: "local" | "staging" | "production" =
  (importMetaEnv.VITE_APP_ENV as "local" | "staging" | "production") ||
  (validated.isValid && validated.isHttps ? "production" : "local");

export const ENVIRONMENT_CONFIG: AppEnvironmentConfig = {
  environment: appEnv,
  publicMcpUrl: validated.isValid ? validated.sanitizedUrl : "",
  isHostedMcpActive: validated.isValid && validated.isHttps,
  defaultLocalPort: 3456,
};

/**
 * Returns whether the application is running in verified Hosted MCP mode.
 */
export function isHostedMode(): boolean {
  return ENVIRONMENT_CONFIG.isHostedMcpActive && Boolean(ENVIRONMENT_CONFIG.publicMcpUrl);
}

/**
 * Resolves the active public MCP endpoint URL.
 */
export function getPublicMcpUrl(): string {
  return ENVIRONMENT_CONFIG.publicMcpUrl;
}

/**
 * Resolves the health check endpoint for either hosted or local mode.
 */
export function getHealthCheckUrl(forceLocal: boolean = false): string {
  if (!forceLocal && isHostedMode()) {
    try {
      const parsed = new URL(ENVIRONMENT_CONFIG.publicMcpUrl);
      return `${parsed.origin}/health`;
    } catch {
      // Fallback
    }
  }
  return `http://localhost:${ENVIRONMENT_CONFIG.defaultLocalPort}/health`;
}

/**
 * Resolves the readiness probe endpoint for either hosted or local mode.
 */
export function getReadyCheckUrl(forceLocal: boolean = false): string {
  if (!forceLocal && isHostedMode()) {
    try {
      const parsed = new URL(ENVIRONMENT_CONFIG.publicMcpUrl);
      return `${parsed.origin}/ready`;
    } catch {
      // Fallback
    }
  }
  return `http://localhost:${ENVIRONMENT_CONFIG.defaultLocalPort}/ready`;
}

/**
 * Resolves the active MCP endpoint for a plugin given the environment state.
 */
export function resolveMcpEndpoint(defaultLocalPath: string = "/mcp"): {
  url: string;
  isHosted: boolean;
  type: "hosted" | "local";
} {
  if (isHostedMode()) {
    return {
      url: ENVIRONMENT_CONFIG.publicMcpUrl,
      isHosted: true,
      type: "hosted",
    };
  }

  return {
    url: `http://localhost:${ENVIRONMENT_CONFIG.defaultLocalPort}${defaultLocalPath}`,
    isHosted: false,
    type: "local",
  };
}
