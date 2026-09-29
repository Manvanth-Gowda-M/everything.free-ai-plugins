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

// Type-safe access to Vite environment variables
const importMetaEnv: Record<string, string | undefined> =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string | undefined> })?.env) ||
  {};

const envPublicMcpUrl: string = importMetaEnv.VITE_PUBLIC_MCP_URL || "";

const appEnv: "local" | "staging" | "production" =
  (importMetaEnv.VITE_APP_ENV as "local" | "staging" | "production") ||
  (envPublicMcpUrl.includes("mcp.everything.free") ? "production" : "local");

export const ENVIRONMENT_CONFIG: AppEnvironmentConfig = {
  environment: appEnv,
  publicMcpUrl: envPublicMcpUrl,
  isHostedMcpActive: Boolean(envPublicMcpUrl && envPublicMcpUrl.startsWith("https://")),
  defaultLocalPort: 3456,
};

/**
 * Resolves the active MCP endpoint for a plugin given the environment state.
 */
export function resolveMcpEndpoint(defaultLocalPath: string = "/mcp"): {
  url: string;
  isHosted: boolean;
  type: "hosted" | "local";
} {
  if (ENVIRONMENT_CONFIG.isHostedMcpActive && ENVIRONMENT_CONFIG.publicMcpUrl) {
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
