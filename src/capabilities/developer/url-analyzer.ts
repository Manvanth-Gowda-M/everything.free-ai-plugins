import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const UrlAnalyzerInputSchema = z.object({
  url: z
    .string()
    .min(1, "URL string cannot be empty")
    .max(4096, "URL exceeds maximum supported length limit of 4096 characters")
    .describe(
      "The URL string to parse, inspect, and analyze (e.g. 'https://api.example.com:8080/v1/users?role=admin&limit=10#profile')"
    ),
});

export type UrlAnalyzerInput = z.infer<typeof UrlAnalyzerInputSchema>;

export interface UrlComponents {
  isValid: boolean;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  username: string;
  hasPassword: boolean;
  isIpAddress: boolean;
  queryParams: Record<string, string | string[]>;
  pathSegments: string[];
}

export interface UrlAnalyzerOutput {
  url: string;
  components: UrlComponents;
}

/**
 * Checks if a hostname represents an IPv4 or IPv6 literal.
 */
function checkIsIp(hostname: string): boolean {
  // IPv4 check
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
  // IPv6 check (enclosed in brackets in URLs or colon separated)
  if (hostname.includes(":") || (hostname.startsWith("[") && hostname.endsWith("]"))) return true;
  return false;
}

export class UrlAnalyzerCapability implements Capability<
  typeof UrlAnalyzerInputSchema,
  UrlAnalyzerOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "url_analyzer",
    version: "1.0.0",
    category: "developer",
    pack: "Developer Pack",
    displayName: "URL Structure Analyzer",
    description:
      "Use when the user asks to parse, decompose, inspect, or validate a URL and its query parameters, path segments, and origin. " +
      "100% local, offline parser with zero network requests and zero DNS lookups. " +
      "Do NOT use for fetching webpage contents or remote HTTP requests.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 2000,
    operations: [
      {
        name: "analyze",
        description:
          "Decomposes URL into protocol, host, port, path, query params, hash, and origin using WHATWG rules",
        inputDescription: "url: string",
        outputDescription: "{ url: string, components: UrlComponents }",
      },
    ],
    limits: {
      maxTextLength: 4096,
      maxInputBytes: 4096,
      timeoutMs: 2000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes:
        "Strict offline parser; zero network requests, zero DNS resolution, anti-SSRF guarantee",
    },
    usageGuidance: {
      useWhen: [
        "User asks to inspect the components of a URL (protocol, host, port, path, query params)",
        "User asks to extract or inspect query parameters from a URL string",
        "User asks to validate if a string is a well-formed URL",
        "User asks to normalize a URL without network access",
      ],
      doNotUseWhen: [
        "User asks to fetch, download, or scrape contents of a URL",
        "User asks to test DNS records or ping a remote host",
        "User asks for regular expression matching (use regex_tester)",
      ],
      exampleRequests: [
        "Analyze this URL and break down its query parameters and path segments",
        "Is this URL well-formed and what is its origin?",
        "Extract all query params from this webhook endpoint URL",
      ],
    },
  };

  public readonly inputSchema = UrlAnalyzerInputSchema;

  public async execute(input: UrlAnalyzerInput): Promise<CapabilityResult<UrlAnalyzerOutput>> {
    const { url } = input;
    const cleanUrl = url.trim();

    let parsed: URL;
    try {
      // Support protocols like http, https, ws, wss, ftp, mailto, etc.
      // If no protocol is specified, attempt prepending https:// for parsing
      if (!cleanUrl.includes("://") && !cleanUrl.startsWith("mailto:")) {
        parsed = new URL(`https://${cleanUrl}`);
      } else {
        parsed = new URL(cleanUrl);
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: "INVALID_URL_FORMAT",
          message: `Failed to parse URL '${cleanUrl}': ${err instanceof Error ? err.message : "Malformed URL structure"}`,
        },
      };
    }

    const queryParams: Record<string, string | string[]> = {};
    parsed.searchParams.forEach((val, key) => {
      const existing = queryParams[key];
      if (existing === undefined) {
        queryParams[key] = val;
      } else if (Array.isArray(existing)) {
        existing.push(val);
      } else {
        queryParams[key] = [existing, val];
      }
    });

    const pathSegments = parsed.pathname.split("/").filter((seg) => seg.length > 0);

    const isIp = checkIsIp(parsed.hostname);

    return {
      success: true,
      data: {
        url: cleanUrl,
        components: {
          isValid: true,
          normalizedUrl: parsed.href,
          protocol: parsed.protocol.replace(/:$/, ""),
          hostname: parsed.hostname,
          port: parsed.port,
          pathname: parsed.pathname,
          search: parsed.search,
          hash: parsed.hash.replace(/^#/, ""),
          origin: parsed.origin,
          username: parsed.username,
          hasPassword: parsed.password.length > 0,
          isIpAddress: isIp,
          queryParams,
          pathSegments,
        },
      },
    };
  }
}
