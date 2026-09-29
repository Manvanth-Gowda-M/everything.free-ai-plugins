import { Plugin } from "../types/plugin.js";
import { ENVIRONMENT_CONFIG } from "../config/environment.js";

export const PLUGINS: Plugin[] = [
  {
    id: "plugin_001_everything_free_ai_plugins",
    slug: "everything-free-ai-plugins",
    name: "Everything.Free AI Plugins",
    version: "0.1.0",
    tagline: "Free developer and data utilities for AI assistants.",
    description:
      "Production-ready, 100% free Model Context Protocol (MCP) server providing 15 high-performance local capabilities across 5 packs: Data, Text, Encoding, Utility, and Developer tools.",
    longDescription: `Everything.Free AI Plugins is the official flagship MCP server from Quilonix, engineered to empower AI assistants (ChatGPT, Claude Desktop, Google Gemini, Cursor, Windsurf) with fast, local, deterministic computation.

### Why Everything.Free AI Plugins?
- **100% Free & Open Source**: MIT licensed, ₹0 / $0 forever. No API keys, no subscription tiers, no hidden metering.
- **Zero Network Egress & Privacy-First**: All 15 capabilities run entirely within your local process or container. No user data, prompts, or inputs are ever sent to third parties.
- **Unified 5-in-1 Architecture**: Instead of running 5 separate MCP servers, enjoy JSON formatting, CSV processing, SQL parsing, XML handling, unified diffing, Markdown parsing, HTML extraction, hashing, unit/time conversion, color spaces, cron scheduling, regex testing, JWT inspection, URL decomposition, and MIME detection through one unified endpoint.
- **Dual Transports**: Connect instantly via standard **stdio** (Claude Desktop, Cursor, Windsurf) or modern **Streamable HTTP** (\`/mcp\`) for ChatGPT Developer Mode and remote agents.`,
    icon: "layers",
    category: "developer",
    tags: [
      "mcp",
      "chatgpt",
      "claude",
      "gemini",
      "json",
      "csv",
      "sql",
      "xml",
      "jwt",
      "regex",
      "diff",
      "markdown",
      "crypto",
      "cron",
      "units",
      "open-source",
    ],
    author: {
      name: "Quilonix",
      organization: "Everything.Free Project",
      url: "https://github.com/everything-free-by-Quilonix",
      avatar: "https://github.com/everything-free-by-Quilonix.png",
    },
    repository: {
      url: "https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins",
      starsCount: 142,
      openIssues: 0,
      license: "MIT",
    },
    homepage: "https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins#readme",
    documentationUrl: "/docs#everything-free-ai-plugins",
    pricing: "open_source",
    isOpenSource: true,
    status: "available",
    hostingStatus: ENVIRONMENT_CONFIG.isHostedMcpActive ? "HOSTED" : "LOCAL_ONLY",
    isFeatured: true,
    connectionProfiles: {
      local: {
        endpoint: "http://localhost:3456/mcp",
        command: "npx",
        args: ["-y", "everything.free-ai-plugins", "--stdio"],
        transport: "stdio",
        instructions: [
          "Run locally with npx or Docker.",
          "Expose via HTTPS tunnel (cloudflared/ngrok) if connecting cloud ChatGPT.",
        ],
      },
      hosted: {
        endpoint: ENVIRONMENT_CONFIG.publicMcpUrl || "https://mcp.everything.free/mcp",
        transport: "streamable_http",
        active: ENVIRONMENT_CONFIG.isHostedMcpActive,
        instructions: [
          "Connect directly using the Everything.Free hosted HTTPS endpoint.",
          "Zero local Node.js or Docker runtime required.",
        ],
        privacyNotice:
          "Everything.Free does not intentionally store MCP tool payloads. Production infrastructure logging and retention policies will be documented before hosted launch.",
      },
      manual: {
        stdioConfig:
          '{\n  "mcpServers": {\n    "everything-free": {\n      "command": "npx",\n      "args": ["-y", "everything.free-ai-plugins", "--stdio"]\n    }\n  }\n}',
        httpConfig:
          '{\n  "mcpServers": {\n    "everything-free": {\n      "url": "http://localhost:3456/mcp"\n    }\n  }\n}',
        instructions: ["Add configuration directly to your MCP client config file."],
      },
    },
    platforms: [
      {
        platformId: "chatgpt",
        platformName: "ChatGPT",
        icon: "chatgpt",
        status: "available",
        connectionType: "streamable_http",
        transport: "streamable_http",
        requiresRemoteServer: true,
        requiresAuthentication: false,
        requiresOAuth: false,
        requiresManualSetup: true,
        endpoint: ENVIRONMENT_CONFIG.isHostedMcpActive
          ? ENVIRONMENT_CONFIG.publicMcpUrl
          : "http://localhost:3456/mcp",
        instructions: ENVIRONMENT_CONFIG.isHostedMcpActive
          ? [
              `Step 1: Copy the public Everything.Free MCP endpoint: ${ENVIRONMENT_CONFIG.publicMcpUrl}.`,
              "Step 2: In ChatGPT, navigate to Settings → Connected Apps / Developer Mode → Add New MCP Server.",
              "Step 3: Enter the public HTTPS endpoint and select Authentication: 'None' (100% Key-Free).",
              "Step 4: Authorize the connection in ChatGPT to discover all 15 capabilities across 5 packs.",
            ]
          : [
              "Requirements: Remote HTTPS MCP endpoint accessible to OpenAI servers (or local server exposed via secure HTTPS tunnel such as Cloudflare Tunnel or ngrok).",
              "Step 1: Start the Everything.Free HTTP MCP server: `npx everything.free-ai-plugins` or run in Docker.",
              "Step 2: Expose your local port 3456 with a public HTTPS tunnel, or deploy to a public HTTPS server.",
              "Step 3: In ChatGPT, navigate to Settings → Connected Apps / Developer Mode → Add New MCP Server.",
              "Step 4: Enter your public HTTPS URL (e.g. `https://your-tunnel.trycloudflare.com/mcp`) and select Authentication: 'None'.",
              "Step 5: Authorize the connection in ChatGPT to discover all 15 capabilities.",
            ],
        setupSnippet: ENVIRONMENT_CONFIG.isHostedMcpActive
          ? `# Public Hosted MCP Endpoint for ChatGPT:
${ENVIRONMENT_CONFIG.publicMcpUrl || "https://mcp.everything.free/mcp"}

# Authentication: None (100% Key-Free)`
          : `# 1. Run local MCP HTTP Server on port 3456
npx everything.free-ai-plugins

# 2. Expose via secure HTTPS tunnel for ChatGPT
cloudflared tunnel --url http://localhost:3456

# 3. Use the generated HTTPS URL in ChatGPT Developer Mode`,
        snippetLanguage: ENVIRONMENT_CONFIG.isHostedMcpActive ? "text" : "bash",
        officialDocumentationUrl: "https://platform.openai.com/docs/actions",
      },
      {
        platformId: "claude",
        platformName: "Claude Desktop",
        icon: "claude",
        status: "available",
        connectionType: "stdio",
        transport: "stdio",
        requiresRemoteServer: false,
        requiresAuthentication: false,
        requiresOAuth: false,
        requiresManualSetup: true,
        instructions: [
          "Open your Claude Desktop configuration file (`claude_desktop_config.json`).",
          "• macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`",
          "• Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`",
          "Add the `everything-free` server entry under `mcpServers`.",
          "Restart Claude Desktop. The hammer icon will illuminate with all 15 active tools.",
        ],
        setupSnippet: `{
  "mcpServers": {
    "everything-free": {
      "command": "npx",
      "args": [
        "-y",
        "everything.free-ai-plugins",
        "--stdio"
      ]
    }
  }
}`,
        snippetLanguage: "json",
        officialDocumentationUrl: "https://modelcontextprotocol.io/quickstart/user",
      },
      {
        platformId: "gemini",
        platformName: "Google Gemini",
        icon: "gemini",
        status: "available",
        connectionType: "adapter",
        transport: "function_calling",
        requiresRemoteServer: false,
        requiresAuthentication: false,
        requiresOAuth: false,
        requiresManualSetup: true,
        instructions: [
          "Import the native Gemini adapter from the npm package: `import { GeminiAdapter } from 'everything.free-ai-plugins'`.",
          "Pass the CapabilityRegistry into the adapter to generate Gemini FunctionDeclaration schema objects.",
          "Supply the declared functions directly to `generativeModel.startChat({ tools: [...] })`.",
        ],
        setupSnippet: `import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiAdapter, createDefaultRegistry } from "everything.free-ai-plugins";

const registry = createDefaultRegistry();
const adapter = new GeminiAdapter(registry);

// Export standard Gemini function declarations
const toolDeclarations = adapter.getFunctionDeclarations();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  tools: [{ functionDeclarations: toolDeclarations }]
});`,
        snippetLanguage: "typescript",
        officialDocumentationUrl: "https://ai.google.dev/docs/function_calling",
      },
      {
        platformId: "cursor",
        platformName: "Cursor IDE",
        icon: "cursor",
        status: "available",
        connectionType: "stdio",
        transport: "stdio",
        requiresRemoteServer: false,
        requiresAuthentication: false,
        requiresOAuth: false,
        requiresManualSetup: true,
        instructions: [
          "Open your project's `.cursor/mcp.json` or Global Cursor Settings → Features → MCP.",
          "Add the stdio configuration below.",
          "Cursor Composer will now call local diff, formatting, regex, and AST tools during code generation.",
        ],
        setupSnippet: `{
  "mcpServers": {
    "everything-free": {
      "command": "npx",
      "args": ["-y", "everything.free-ai-plugins", "--stdio"]
    }
  }
}`,
        snippetLanguage: "json",
        officialDocumentationUrl: "https://docs.cursor.com/context/model-context-protocol",
      },
      {
        platformId: "mcp-cli",
        platformName: "Generic MCP Client",
        icon: "terminal",
        status: "available",
        connectionType: "manual",
        transport: ENVIRONMENT_CONFIG.isHostedMcpActive ? "streamable_http" : "streamable_http_or_stdio",
        requiresRemoteServer: false,
        requiresAuthentication: false,
        requiresOAuth: false,
        requiresManualSetup: true,
        instructions: ENVIRONMENT_CONFIG.isHostedMcpActive
          ? [
              `Connect directly via Streamable HTTP using the hosted HTTPS endpoint: ${ENVIRONMENT_CONFIG.publicMcpUrl}.`,
              "Protocol follows official JSON-RPC 2.0 specifications (`tools/list`, `tools/call`, `resources/list`, `prompts/list`).",
            ]
          : [
              "Connect via Streamable HTTP at `http://localhost:3456/mcp` (local) or via `npx everything.free-ai-plugins --stdio`.",
              "Protocol follows official JSON-RPC 2.0 specifications with `tools/list`, `tools/call`, `resources/list`, and `prompts/list`.",
            ],
        setupSnippet: ENVIRONMENT_CONFIG.isHostedMcpActive
          ? `# Inspect live hosted health probe
curl -i ${ENVIRONMENT_CONFIG.publicMcpUrl.replace(/\/mcp$/, "/health")}

# Streamable HTTP MCP Endpoint
${ENVIRONMENT_CONFIG.publicMcpUrl}`
          : `# Connect via stdio client
npx everything.free-ai-plugins --stdio

# Or inspect local health endpoint during development
curl http://localhost:3456/health`,
        snippetLanguage: "bash",
        officialDocumentationUrl: "https://modelcontextprotocol.io",
      },
    ],
    packs: [
      {
        id: "data",
        name: "Data Pack",
        description:
          "High-performance local tools for inspecting, formatting, and transforming structured data.",
        icon: "database",
        capabilities: [
          {
            id: "json_formatter_validator",
            name: "JSON Formatter & Validator",
            pack: "Data Pack",
            description:
              "Validates, formats (custom indentation), minifies, and inspects JSON data structures with deep type-tree analysis.",
            operations: ["validate", "format", "minify", "inspect"],
            inputExample: '{"name":"Everything.Free","free":true}',
            outputExample: '{\n  "name": "Everything.Free",\n  "free": true\n}',
            isOffline: true,
          },
          {
            id: "csv_processor",
            name: "CSV Processor",
            pack: "Data Pack",
            description:
              "Parses CSV datasets, detects delimiters, validates headers, runs SQL-like filters and transforms to JSON arrays.",
            operations: ["parse", "validate", "filter", "to_json"],
            inputExample: "id,name,role\n1,Alice,Engineer\n2,Bob,Architect",
            outputExample:
              '[{"id":"1","name":"Alice","role":"Engineer"},{"id":"2","name":"Bob","role":"Architect"}]',
            isOffline: true,
          },
          {
            id: "sql_processor",
            name: "SQL Processor",
            pack: "Data Pack",
            description:
              "Safe AST-based SQL query analysis, dialect detection, syntax validation, keyword formatting, and table extraction.",
            operations: ["validate", "format", "extract_tables", "inspect"],
            inputExample: "select id, name from users where active = 1 order by created_at desc",
            outputExample:
              "SELECT id, name\nFROM users\nWHERE active = 1\nORDER BY created_at DESC;",
            isOffline: true,
          },
          {
            id: "xml_processor",
            name: "XML Processor",
            pack: "Data Pack",
            description:
              "Parses XML documents, validates well-formedness, generates formatted XML, and converts trees to clean JSON representations.",
            operations: ["validate", "format", "to_json", "inspect"],
            inputExample: "<project><name>Everything.Free</name><cost>0</cost></project>",
            outputExample:
              '{\n  "project": {\n    "name": "Everything.Free",\n    "cost": "0"\n  }\n}',
            isOffline: true,
          },
        ],
      },
      {
        id: "text",
        name: "Text Pack",
        description:
          "Tools for text diffing, structural document analysis, markdown processing, and HTML extraction.",
        icon: "file-text",
        capabilities: [
          {
            id: "text_diff_analyzer",
            name: "Text Diff Analyzer",
            pack: "Text Pack",
            description:
              "Computes line-by-line unified diffs, character-level edits, and similarity metrics between text blocks.",
            operations: ["unified_diff", "line_diff", "stats"],
            inputExample: "Original: function hello() {}\nModified: function helloWorld() {}",
            outputExample: "- function hello() {}\n+ function helloWorld() {}",
            isOffline: true,
          },
          {
            id: "markdown_processor",
            name: "Markdown Processor",
            pack: "Text Pack",
            description:
              "Extracts table of contents, parses headings, validates link references, strips formatting, and counts reading time.",
            operations: ["toc", "headings", "strip_formatting", "stats"],
            inputExample: "# Architecture\n## Transport Layer\n## Capabilities",
            outputExample: "1. Architecture\n   1.1. Transport Layer\n   1.2. Capabilities",
            isOffline: true,
          },
          {
            id: "html_processor",
            name: "HTML Processor",
            pack: "Text Pack",
            description:
              "Offline DOM cleaner, link and image extractor, semantic text extractor, and XSS-safe HTML sanitizer.",
            operations: ["sanitize", "extract_text", "extract_links", "extract_meta"],
            inputExample: '<div class="alert">Hello <b>World</b><script>alert(1)</script></div>',
            outputExample: "Hello World",
            isOffline: true,
          },
        ],
      },
      {
        id: "encoding",
        name: "Encoding Pack",
        description: "Cryptographic hashing, standard encodings, and UUID v4 generation.",
        icon: "lock",
        capabilities: [
          {
            id: "hash_encoding",
            name: "Hash & Encoding Utility",
            pack: "Encoding Pack",
            description:
              "Calculates SHA-256, SHA-512, MD5 hashes, encodes/decodes Base64/Hex/URL, and generates RFC-compliant UUIDs.",
            operations: ["sha256", "sha512", "base64_encode", "base64_decode", "uuid_v4"],
            inputExample: "Everything.Free 2026",
            outputExample: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            isOffline: true,
          },
        ],
      },
      {
        id: "utility",
        name: "Utility Pack",
        description:
          "Physical unit conversions, timezone/date calculations, color spaces, and cron scheduling.",
        icon: "sliders",
        capabilities: [
          {
            id: "unit_time_converter",
            name: "Unit & Time Converter",
            pack: "Utility Pack",
            description:
              "High-precision physical unit conversion (length, mass, temperature, data bytes) and timezone/UNIX timestamp calculations.",
            operations: [
              "convert_unit",
              "timestamp_to_date",
              "date_to_timestamp",
              "timezone_shift",
            ],
            inputExample: "1024 MB to GB / 1711756800 to UTC",
            outputExample: "1.0 GB / 2024-03-30T00:00:00.000Z",
            isOffline: true,
          },
          {
            id: "color_converter",
            name: "Color Converter",
            pack: "Utility Pack",
            description:
              "Translates between HEX, RGB, HSL, and OKLCH color spaces, with contrast ratio calculations against WCAG 2.1 standards.",
            operations: ["hex_to_rgb", "rgb_to_hsl", "contrast_ratio", "palette_harmony"],
            inputExample: "#D4AF37 to HSL",
            outputExample: "hsl(46, 65%, 52%) (WCAG AA Contrast: 7.8:1 on #0A0A0F)",
            isOffline: true,
          },
          {
            id: "cron_analyzer",
            name: "Cron Expression Analyzer",
            pack: "Utility Pack",
            description:
              "Translates 5-part and 6-part cron expressions to plain human English and calculates upcoming execution dates.",
            operations: ["explain", "next_executions", "validate"],
            inputExample: "*/15 0 1,15 * 1-5",
            outputExample:
              "Every 15 minutes, at 12:00 AM, on day 1 and 15 of the month, Monday through Friday",
            isOffline: true,
          },
        ],
      },
      {
        id: "developer",
        name: "Developer Pack",
        description:
          "Essential developer utilities for regular expressions, JWT inspection, URL analysis, and MIME detection.",
        icon: "code",
        capabilities: [
          {
            id: "regex_tester",
            name: "Regex Tester & Explainer",
            pack: "Developer Pack",
            description:
              "Tests regular expressions against input strings, highlights capture groups, flags ReDoS vulnerabilities, and explains regex patterns in plain text.",
            operations: ["test", "match_all", "explain", "redos_check"],
            inputExample: "Pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            outputExample:
              'Valid email regex. Match found on "user@everythingfree.io". ReDoS Risk: Safe.',
            isOffline: true,
          },
          {
            id: "jwt_inspector",
            name: "JWT Token Inspector",
            pack: "Developer Pack",
            description:
              "Decodes and inspects JSON Web Tokens (Header, Payload, Signature) without transmitting secret keys or verifying secrets over the wire.",
            operations: ["decode", "inspect_claims", "expiration_check"],
            inputExample: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            outputExample: 'Algorithm: HS256, Subject: "user_42", Expires: 2026-12-31 (Valid)',
            isOffline: true,
          },
          {
            id: "url_analyzer",
            name: "URL Analyzer & Query Parser",
            pack: "Developer Pack",
            description:
              "Decomposes complex URLs into protocol, host, port, path, query parameters, and fragments, with safety validation for SSRF checks.",
            operations: ["parse", "decompose_params", "validate_safety"],
            inputExample: "https://everythingfree.io/plugins?category=developer&ref=gh#overview",
            outputExample:
              'Host: everythingfree.io, Path: /plugins, Query: { category: "developer", ref: "gh" }',
            isOffline: true,
          },
          {
            id: "mime_analyzer",
            name: "MIME & Magic Byte Analyzer",
            pack: "Developer Pack",
            description:
              "Detects MIME types and extensions from filename patterns and magic byte headers, identifying binary vs text files.",
            operations: ["detect_mime", "extension_lookup", "is_binary"],
            inputExample: "archive.tar.gz / [0x1F, 0x8B]",
            outputExample: "MIME: application/gzip, Type: Binary compressed archive",
            isOffline: true,
          },
        ],
      },
    ],
    mcpInfo: {
      transport: ["streamable-http", "stdio"],
      httpEndpoint: ENVIRONMENT_CONFIG.isHostedMcpActive
        ? ENVIRONMENT_CONFIG.publicMcpUrl
        : "http://localhost:3456/mcp",
      stdioCommand: "npx",
      stdioArgs: ["-y", "everything.free-ai-plugins", "--stdio"],
      capabilitiesCount: 15,
      resourcesCount: 19,
      promptsCount: 7,
      protocolVersion: "2024-11-05 (JSON-RPC 2.0)",
    },
    privacy: {
      localExecutionOnly: true,
      networkEgress: false,
      telemetryPresent: false,
      dataRetention: "Zero data retention (transient in-memory execution only)",
      requiresAuth: false,
      openSourceVerified: true,
      license: "MIT",
    },
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-29T21:00:00.000Z",
  },
  {
    id: "plugin_002_pdf_toolkit",
    slug: "pdf-toolkit",
    name: "PDF Toolkit MCP",
    version: "0.2.0",
    tagline: "Offline PDF text extraction, table parsing, and page manipulation.",
    description:
      "Privacy-first local MCP server for extracting text, analyzing tables, and manipulating PDF documents without external cloud OCR APIs.",
    longDescription: `PDF Toolkit MCP is an open-source companion tool in the Everything.Free ecosystem. It empowers AI assistants to parse document layouts, extract tables into structured Markdown/JSON, and merge/split pages entirely on your local workstation.`,
    icon: "file-text",
    category: "data",
    tags: ["mcp", "pdf", "table-extractor", "ocr", "documents", "data"],
    author: {
      name: "Quilonix Community",
      organization: "Everything.Free Ecosystem",
      url: "https://github.com/everything-free-by-Quilonix",
    },
    repository: {
      url: "https://github.com/everything-free-by-Quilonix/pdf-toolkit-mcp",
      starsCount: 88,
      license: "MIT",
    },
    homepage: "https://github.com/everything-free-by-Quilonix",
    documentationUrl: "/docs#pdf-toolkit",
    pricing: "open_source",
    isOpenSource: true,
    status: "coming_soon",
    hostingStatus: "COMING_SOON",
    isFeatured: false,
    platforms: [
      {
        platformId: "claude",
        platformName: "Claude Desktop",
        icon: "claude",
        status: "coming_soon",
        connectionType: "stdio",
        transport: "stdio",
        requiresRemoteServer: false,
        requiresAuthentication: false,
        requiresOAuth: false,
        requiresManualSetup: true,
        instructions: ["Add pdf-toolkit to your claude_desktop_config.json once v1 is released."],
        setupSnippet: `{
  "mcpServers": {
    "pdf-toolkit": {
      "command": "npx",
      "args": ["-y", "@everything-free/pdf-toolkit", "--stdio"]
    }
  }
}`,
        snippetLanguage: "json",
        officialDocumentationUrl: "https://modelcontextprotocol.io",
      },
    ],
    packs: [
      {
        id: "pdf-core",
        name: "PDF Parser Pack",
        description: "Local PDF layout analysis, OCR-free text extraction, and page operations.",
        capabilities: [
          {
            id: "pdf_extract_text",
            name: "PDF Text Extractor",
            pack: "PDF Parser Pack",
            description:
              "Extracts textual content with layout awareness and structural heading preservation.",
            operations: ["extract_text", "extract_meta"],
            isOffline: true,
          },
        ],
      },
    ],
    mcpInfo: {
      transport: ["stdio"],
      capabilitiesCount: 4,
      resourcesCount: 4,
      promptsCount: 3,
      protocolVersion: "2024-11-05",
    },
    privacy: {
      localExecutionOnly: true,
      networkEgress: false,
      telemetryPresent: false,
      dataRetention: "Zero data retention",
      requiresAuth: false,
      openSourceVerified: true,
      license: "MIT",
    },
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T21:00:00.000Z",
  },
  {
    id: "plugin_003_image_optimizer",
    slug: "image-optimizer-mcp",
    name: "Image Optimizer & SVG Sanitizer",
    version: "0.1.0",
    tagline: "Local image compression, SVG sanitizer, and metadata stripper.",
    description:
      "Fast offline image manipulation for AI assistants. Cleans malicious SVG payloads, generates thumbnails, converts formats (WebP, AVIF, PNG), and strips privacy-sensitive EXIF geolocation tags.",
    longDescription: `Image Optimizer MCP provides local image analysis and transformation primitives without uploading your media to remote APIs.`,
    icon: "image",
    category: "media",
    tags: ["mcp", "image", "svg", "security", "media", "compression"],
    author: {
      name: "Quilonix Community",
      organization: "Everything.Free Ecosystem",
      url: "https://github.com/everything-free-by-Quilonix",
    },
    repository: {
      url: "https://github.com/everything-free-by-Quilonix/image-optimizer-mcp",
      starsCount: 64,
      license: "MIT",
    },
    homepage: "https://github.com/everything-free-by-Quilonix",
    documentationUrl: "/docs#image-optimizer",
    pricing: "open_source",
    isOpenSource: true,
    status: "coming_soon",
    hostingStatus: "COMING_SOON",
    isFeatured: false,
    platforms: [
      {
        platformId: "claude",
        platformName: "Claude Desktop",
        icon: "claude",
        status: "coming_soon",
        connectionType: "stdio",
        transport: "stdio",
        requiresRemoteServer: false,
        requiresAuthentication: false,
        requiresOAuth: false,
        requiresManualSetup: true,
        instructions: ["Add image-optimizer to your claude_desktop_config.json once published."],
        setupSnippet: `{
  "mcpServers": {
    "image-optimizer": {
      "command": "npx",
      "args": ["-y", "@everything-free/image-optimizer", "--stdio"]
    }
  }
}`,
        snippetLanguage: "json",
        officialDocumentationUrl: "https://modelcontextprotocol.io",
      },
    ],
    packs: [
      {
        id: "media-core",
        name: "Media Optimization Pack",
        description: "Local media transforms, EXIF stripping, and vector security.",
        capabilities: [
          {
            id: "svg_sanitizer",
            name: "SVG Security Sanitizer",
            pack: "Media Optimization Pack",
            description:
              "Strips malicious JavaScript, external entity injection (XXE), and tracking beacons from SVG vector graphics.",
            operations: ["sanitize", "minify", "validate"],
            isOffline: true,
          },
        ],
      },
    ],
    mcpInfo: {
      transport: ["stdio"],
      capabilitiesCount: 5,
      resourcesCount: 3,
      promptsCount: 2,
      protocolVersion: "2024-11-05",
    },
    privacy: {
      localExecutionOnly: true,
      networkEgress: false,
      telemetryPresent: false,
      dataRetention: "Zero data retention",
      requiresAuth: false,
      openSourceVerified: true,
      license: "MIT",
    },
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T21:00:00.000Z",
  },
];

export function getAllPlugins(): Plugin[] {
  return PLUGINS;
}

export function getPluginBySlug(slug: string): Plugin | undefined {
  return PLUGINS.find((p) => p.slug === slug);
}

export function getFeaturedPlugins(): Plugin[] {
  return PLUGINS.filter((p) => p.isFeatured);
}

export function getPluginsByCategory(category: string): Plugin[] {
  return PLUGINS.filter((p) => p.category === category);
}
