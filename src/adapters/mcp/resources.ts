import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CapabilityRegistry } from "../../core/registry.js";
import { Capability } from "../../core/types.js";
import { VERSION, SERVICE_NAME } from "../../version.js";

export const RESOURCE_URIS = {
  CATALOG: "everything-free://capabilities",
  ARCHITECTURE: "everything-free://architecture",
  SECURITY: "everything-free://security",
  PRIVACY: "everything-free://privacy",
  capabilityDoc: (name: string) => `everything-free://capabilities/${name}`,
};

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  {
    uri: RESOURCE_URIS.CATALOG,
    name: "Capability Catalog",
    description: "Machine-readable JSON catalog of all 15 capabilities, packs, operations, limits, and security metadata.",
    mimeType: "application/json",
  },
  {
    uri: RESOURCE_URIS.ARCHITECTURE,
    name: "Architecture & Contract Model",
    description: "Architectural overview, execution flow, and capability pack design principles.",
    mimeType: "text/markdown",
  },
  {
    uri: RESOURCE_URIS.SECURITY,
    name: "Security Policy & Guarantees",
    description: "Security model, invariants, sandbox boundaries, and local safety guarantees.",
    mimeType: "text/markdown",
  },
  {
    uri: RESOURCE_URIS.PRIVACY,
    name: "Privacy Model",
    description: "Local-only privacy model and zero data retention guarantees.",
    mimeType: "text/markdown",
  },
];

export function getArchitectureDoc(): string {
  return `# Everything.Free AI Plugins Architecture

Everything.Free AI Plugins is an open-source, capability-centric Model Context Protocol (MCP) server that exposes 100% free, deterministic, local-first tools for AI assistants.

## Architectural Pillars
1. **₹0 / $0 Cost Guarantee**: No API keys, no paid subscriptions, no third-party cloud charges.
2. **Capability Packs**: 15 capabilities organized into 5 logical packs (Data, Text, Encoding, Utility, Developer) through a single unified MCP connection.
3. **Decoupled Engine**: Core capabilities are isolated from transport layers (stdio, Streamable HTTP).
4. **Strict Safety Bounds**: Execution timeouts (default 3000ms), input size bounds, and explicit Zod schema validation.

## Execution Flow
1. Client sends JSON-RPC request over stdio or Streamable HTTP.
2. Transport layer parses request and dispatches to McpServer.
3. ExecutionRunner validates inputs against Zod schema and enforces timeout guardrails.
4. Capability handler executes purely in-memory without external dependencies.
5. Standardized response/error returned to client.

## Capability Contract v2
Every capability strictly satisfies:
- Metadata identification (name, version, pack, category, description)
- Explicit execution limits and timeout
- Structured operations list
- Comprehensive AI usage guidance (useWhen, doNotUseWhen, exampleRequests)
- Offline-only, zero-retention security guarantees
`;
}

export function getSecurityDoc(): string {
  return `# Everything.Free Security Model

Everything.Free AI Plugins is designed for complete local isolation and safety.

## Security Invariants
1. **Offline Only**: Zero outbound network requests, no arbitrary socket connections, no telemetry.
2. **No Arbitrary Filesystem Access**: Capabilities operate strictly on in-memory caller data.
3. **No Dynamic Execution**: 'eval', 'Function' constructors, and shell executions are strictly forbidden.
4. **SQL Safety**: SQL is parsed and formatted in-memory without database connections and is never executed.
5. **XML Security**: XXE attacks and external DTD/entity fetching are strictly rejected.
6. **HTML Safety**: HTML is sanitized offline without JavaScript execution or browser runtimes.
7. **Zero Data Retention**: No caller inputs or computation results are saved to disk or persistent storage.
`;
}

export function getPrivacyDoc(): string {
  return `# Everything.Free Privacy Model

## 100% Local In-Memory Processing
* All capability execution happens strictly in volatile memory.
* Once a request finishes, memory is reclaimed by Node garbage collection.

## Zero Telemetry
* No usage metrics, user queries, IP logs, or payloads are collected or sent anywhere.

## No Database
* No state or session data is persisted across restarts or requests.
`;
}

export const STATIC_DOCS: Record<string, string> = {
  architecture: getArchitectureDoc(),
  security: getSecurityDoc(),
  privacy: getPrivacyDoc(),
};

/**
 * Builds a machine-readable JSON capability catalog from the registry.
 */
export function buildCapabilityCatalog(registry: CapabilityRegistry): string {
  const inventory = registry.getInventory();
  const detailedCapabilities = registry.getAll().map((c) => ({
    id: c.metadata.name,
    displayName: c.metadata.displayName,
    version: c.metadata.version,
    pack: c.metadata.pack,
    category: c.metadata.category,
    description: c.metadata.description,
    documentationUri: RESOURCE_URIS.capabilityDoc(c.metadata.name),
    operations: c.metadata.operations ?? [],
    limits: c.metadata.limits,
    security: c.metadata.security,
    usageGuidance: c.metadata.usageGuidance,
  }));

  const catalogData = {
    service: SERVICE_NAME,
    version: VERSION,
    totalCapabilities: inventory.totalCount,
    packCounts: inventory.packCounts,
    capabilities: detailedCapabilities,
  };

  return JSON.stringify(catalogData, null, 2);
}

/**
 * Builds markdown documentation for an individual capability.
 */
export function buildCapabilityDoc(capability: Capability): string {
  const {
    name,
    displayName,
    version,
    pack,
    category,
    description,
    timeoutMs,
    limits,
    security,
    operations,
    usageGuidance,
  } = capability.metadata;

  let doc = `# ${displayName}

**Capability ID:** \`${name}\`  
**Version:** ${version}  
**Pack:** ${pack}  
**Category:** ${category}  
**Resource URI:** \`${RESOURCE_URIS.capabilityDoc(name)}\`  

## Overview
${description}

## Security & Privacy
* **Offline Only:** ${security?.offlineOnly ? "Yes" : "No"}
* **Zero Data Retention:** ${security?.zeroRetention ? "Yes" : "No"}
* **No External Calls:** ${security?.noExternalCalls ? "Yes" : "No"}
* **Timeout Limit:** ${timeoutMs}ms

## Operational Limits
* **Max Input Size:** ${limits?.maxInputSizeBytes ?? "N/A"} bytes
* **Max Payload Items:** ${limits?.maxItems ?? "N/A"}
* **Max Depth / Complexity:** ${limits?.maxDepth ?? "N/A"}

## Supported Operations
`;

  if (operations && operations.length > 0) {
    for (const op of operations) {
      doc += `\n### \`${op.name}\`\n${op.description}\n`;
    }
  } else {
    doc += `\n*Single default operation.*\n`;
  }

  if (usageGuidance) {
    doc += `\n## Usage Guidance\n\n### Use When\n`;
    for (const item of usageGuidance.useWhen) {
      doc += `* ${item}\n`;
    }

    doc += `\n### Do Not Use When\n`;
    for (const item of usageGuidance.doNotUseWhen) {
      doc += `* ${item}\n`;
    }

    doc += `\n### Example Requests\n`;
    for (const example of usageGuidance.exampleRequests) {
      doc += `* "${example}"\n`;
    }
  }

  return doc;
}

/**
 * Registers all static read-only MCP resources onto the McpServer instance.
 */
export function registerResources(server: McpServer, registry: CapabilityRegistry): void {
  // 1. Capability Catalog Resource
  server.resource(
    "capability_catalog",
    RESOURCE_URIS.CATALOG,
    {
      description: "Machine-readable catalog of all registered capabilities, packs, operations, limits, and security metadata",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: buildCapabilityCatalog(registry),
        },
      ],
    })
  );

  // 2. Individual Capability Documentation Resources
  for (const capability of registry.getAll()) {
    const { name, displayName } = capability.metadata;
    const uriString = RESOURCE_URIS.capabilityDoc(name);

    server.resource(
      `doc_${name}`,
      uriString,
      {
        description: `Documentation, schemas, limits, and usage guidance for '${displayName}'`,
        mimeType: "text/markdown",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: buildCapabilityDoc(capability),
          },
        ],
      })
    );
  }

  // 3. Architecture Resource
  server.resource(
    "architecture_docs",
    RESOURCE_URIS.ARCHITECTURE,
    {
      description: "Architectural overview and capability pack design principles",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: getArchitectureDoc(),
        },
      ],
    })
  );

  // 4. Security Documentation Resource
  server.resource(
    "security_docs",
    RESOURCE_URIS.SECURITY,
    {
      description: "Security model, invariants, and local sandboxing guarantees",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: getSecurityDoc(),
        },
      ],
    })
  );

  // 5. Privacy Documentation Resource
  server.resource(
    "privacy_docs",
    RESOURCE_URIS.PRIVACY,
    {
      description: "Local-only privacy model and zero-retention guarantees",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: getPrivacyDoc(),
        },
      ],
    })
  );
}
