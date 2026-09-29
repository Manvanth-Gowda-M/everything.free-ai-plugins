import { renderCopyButton } from "../components/copy-button.js";

export function renderDocsView(): string {
  return `
    <div class="docs-page section">
      <div class="container">
        <!-- Header -->
        <div class="mb-10">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-gold">Official Documentation</span>
            <span class="badge badge-emerald">Protocol v2024-11-05</span>
          </div>
          <h1>Platform & Integration Docs</h1>
          <p class="text-lead mt-2" style="max-width: 720px;">
            Comprehensive integration guides for connecting Everything.Free MCP tools to ChatGPT, Claude Desktop, Google Gemini, Cursor, and custom AI agents.
          </p>
        </div>

        <div class="grid" style="grid-template-columns: 260px 1fr; gap: var(--space-10); align-items: start;">
          <!-- Sticky Table of Contents Sidebar -->
          <aside style="position: sticky; top: 90px; background-color: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-5);">
            <div style="font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.08em; margin-bottom: 0.75rem;">
              Documentation Topics
            </div>
            <nav style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
              <a href="#getting-started" class="nav-link">1. Getting Started</a>
              <a href="#what-is-mcp" class="nav-link">2. What is MCP?</a>
              <a href="#chatgpt" class="nav-link">3. Connect to ChatGPT</a>
              <a href="#claude" class="nav-link">4. Connect to Claude Desktop</a>
              <a href="#gemini" class="nav-link">5. Connect to Google Gemini</a>
              <a href="#manual" class="nav-link">6. Manual MCP & IDEs</a>
              <a href="#security" class="nav-link">7. Security & Privacy</a>
              <a href="#submission" class="nav-link">8. Plugin Submission Guide</a>
            </nav>
          </aside>

          <!-- Main Documentation Content -->
          <article class="docs-content" style="font-size: 0.95rem; line-height: 1.75; color: var(--text-secondary);">
            
            <!-- SECTION 1: Getting Started -->
            <section id="getting-started" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">1. Getting Started</h2>
              <p>
                <strong>Everything.Free</strong> is an open-source catalog and connection hub for 100% free AI tools. Our flagship MCP server, <code class="code-inline">everything.free-ai-plugins</code>, bundles 15 high-throughput developer and data capabilities across 5 packs into a single local process.
              </p>
              
              <h3 style="font-size: 1.15rem; color: var(--accent-gold); margin-top: 1.5rem; margin-bottom: 0.5rem;">Execution Environments</h3>
              <p>Everything.Free operates across two distinct modes:</p>
              <ul style="padding-left: 1.5rem; list-style-type: disc; margin-top: 0.5rem; margin-bottom: 1rem;">
                <li><strong>Local Sub-Process (stdio)</strong>: Ideal for desktop AI assistants like Claude Desktop, Cursor, and Windsurf. The assistant spawns the tool directly via <code class="code-inline">npx everything.free-ai-plugins --stdio</code>.</li>
                <li><strong>Streamable HTTP Server (/mcp)</strong>: Ideal for ChatGPT Developer Mode, remote agents, and webhooks. Spawns an HTTP server on port 3456 with standard Streamable HTTP endpoints.</li>
              </ul>

              <div class="code-block mt-2 mb-4">
                <div class="code-header">
                  <span>bash</span>
                  ${renderCopyButton("npx everything.free-ai-plugins", "Copy")}
                </div>
                <pre class="code-content"><code># Run Streamable HTTP server on port 3456
npx everything.free-ai-plugins

# Or run stdio transport for desktop AI clients
npx everything.free-ai-plugins --stdio</code></pre>
              </div>
            </section>

            <!-- SECTION 2: What is MCP? -->
            <section id="what-is-mcp" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">2. What is Model Context Protocol (MCP)?</h2>
              <p>
                The <strong>Model Context Protocol (MCP)</strong> is an open specification that standardizes how Large Language Model (LLM) applications connect to external tools, data resources, and prompt templates.
              </p>
              <p class="mt-3">
                Instead of building fragmented proprietary plugins for every different LLM vendor, MCP provides:
              </p>
              <ul style="padding-left: 1.5rem; list-style-type: disc; margin-top: 0.75rem; margin-bottom: 0.75rem;">
                <li><strong>Universal Tools</strong>: Standard JSON-RPC 2.0 tool execution schemas with strict Zod validation.</li>
                <li><strong>Resources</strong>: Machine-readable reference context (catalogs, specifications, documentation).</li>
                <li><strong>Prompts</strong>: Guided assistant workflows and golden task definitions.</li>
                <li><strong>Transports</strong>: Support for both low-latency local <code class="code-inline">stdio</code> and remote <code class="code-inline">Streamable HTTP</code>.</li>
              </ul>
            </section>

            <!-- SECTION 3: Connect to ChatGPT -->
            <section id="chatgpt" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">3. Connecting to ChatGPT</h2>
              <p>
                OpenAI ChatGPT interacts with MCP servers via <strong>Remote HTTPS Streamable HTTP endpoints</strong> in ChatGPT Developer Mode / Custom Workspace Actions.
              </p>

              <div class="card my-4" style="background-color: var(--bg-surface); border-color: var(--accent-gold-border);">
                <div class="flex items-start gap-2">
                  <span>ℹ️</span>
                  <div>
                    <strong style="color: var(--accent-gold);">Remote HTTPS Requirement:</strong>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                      Because OpenAI's cloud servers initiate the HTTP requests, ChatGPT cannot directly reach <code class="code-inline">http://localhost:3456</code> on your machine without a secure HTTPS tunnel or a publicly deployed host.
                    </p>
                  </div>
                </div>
              </div>

              <h3 style="font-size: 1.15rem; color: var(--accent-gold); margin-top: 1.5rem; margin-bottom: 0.5rem;">Supported Setup Path</h3>
              <ol style="padding-left: 1.5rem; list-style-type: decimal; margin-bottom: 1rem;">
                <li style="margin-bottom: 0.5rem;">Start your Everything.Free server locally: <code class="code-inline">npx everything.free-ai-plugins</code> (runs on port 3456).</li>
                <li style="margin-bottom: 0.5rem;">Expose port 3456 with a secure HTTPS tunnel (e.g., Cloudflare Tunnel: <code class="code-inline">cloudflared tunnel --url http://localhost:3456</code>) or deploy the Docker container to an HTTPS host.</li>
                <li style="margin-bottom: 0.5rem;">In ChatGPT, navigate to <strong>Settings → Connected Apps / Developer Mode → Add New MCP Server</strong>.</li>
                <li style="margin-bottom: 0.5rem;">Enter your public HTTPS URL (e.g. <code class="code-inline">https://your-tunnel.trycloudflare.com/mcp</code>).</li>
                <li style="margin-bottom: 0.5rem;">Select Authentication: <strong>None</strong> (Everything.Free is 100% key-free).</li>
                <li style="margin-bottom: 0.5rem;">Click Authorize. ChatGPT will discover all 15 capabilities, 19 resources, and 7 prompts.</li>
              </ol>
            </section>

            <!-- SECTION 4: Connect to Claude Desktop -->
            <section id="claude" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">4. Connecting to Claude Desktop</h2>
              <p>
                Claude Desktop connects natively via local <code class="code-inline">stdio</code> pipes. It starts the Node.js sub-process automatically whenever Claude opens—no remote server or tunnel required.
              </p>

              <h3 style="font-size: 1.15rem; color: var(--accent-gold); margin-top: 1.5rem; margin-bottom: 0.5rem;">Configuration File Locations</h3>
              <ul style="padding-left: 1.5rem; list-style-type: disc; margin-bottom: 1rem;">
                <li><strong>macOS</strong>: <code class="code-inline">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                <li><strong>Windows</strong>: <code class="code-inline">%APPDATA%\\Claude\\claude_desktop_config.json</code></li>
                <li><strong>Linux</strong>: <code class="code-inline">~/.config/Claude/claude_desktop_config.json</code></li>
              </ul>

              <div class="code-block mt-2 mb-4">
                <div class="code-header">
                  <span>claude_desktop_config.json</span>
                  ${renderCopyButton(
                    `{\n  "mcpServers": {\n    "everything-free": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "everything.free-ai-plugins",\n        "--stdio"\n      ]\n    }\n  }\n}`,
                    "Copy JSON"
                  )}
                </div>
                <pre class="code-content"><code>{
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
}</code></pre>
              </div>
            </section>

            <!-- SECTION 5: Connect to Google Gemini -->
            <section id="gemini" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">5. Connecting to Google Gemini</h2>
              <p>
                Everything.Free AI Plugins includes a native TypeScript <code class="code-inline">GeminiAdapter</code> that translates all 15 Zod-validated capability schemas into standard Gemini <code class="code-inline">FunctionDeclaration</code> objects for the Google Generative AI SDK.
              </p>

              <div class="code-block mt-2 mb-4">
                <div class="code-header">
                  <span>typescript</span>
                  ${renderCopyButton(
                    `import { GoogleGenerativeAI } from "@google/generative-ai";\nimport { GeminiAdapter, createDefaultRegistry } from "everything.free-ai-plugins";\n\nconst registry = createDefaultRegistry();\nconst adapter = new GeminiAdapter(registry);\n\nconst genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);\nconst model = genAI.getGenerativeModel({\n  model: "gemini-1.5-pro",\n  tools: [{ functionDeclarations: adapter.getFunctionDeclarations() }]\n});`,
                    "Copy Code"
                  )}
                </div>
                <pre class="code-content"><code>import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiAdapter, createDefaultRegistry } from "everything.free-ai-plugins";

const registry = createDefaultRegistry();
const adapter = new GeminiAdapter(registry);

// Automatically exports all 15 tools into Gemini schema format
const declarations = adapter.getFunctionDeclarations();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  tools: [{ functionDeclarations: declarations }]
});</code></pre>
              </div>
            </section>

            <!-- SECTION 6: Manual MCP & IDEs -->
            <section id="manual" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">6. Manual MCP & IDE Configurations</h2>
              <p>
                Any IDE supporting MCP (Cursor, Windsurf, Roo Code, Claude Code) can attach to Everything.Free immediately.
              </p>

              <h3 style="font-size: 1.15rem; color: var(--accent-gold); margin-top: 1rem; margin-bottom: 0.5rem;">Cursor IDE (<code class="code-inline">.cursor/mcp.json</code>)</h3>
              <div class="code-block mt-2 mb-4">
                <div class="code-header">
                  <span>.cursor/mcp.json</span>
                  ${renderCopyButton(
                    `{\n  "mcpServers": {\n    "everything-free": {\n      "command": "npx",\n      "args": ["-y", "everything.free-ai-plugins", "--stdio"]\n    }\n  }\n}`,
                    "Copy"
                  )}
                </div>
                <pre class="code-content"><code>{
  "mcpServers": {
    "everything-free": {
      "command": "npx",
      "args": ["-y", "everything.free-ai-plugins", "--stdio"]
    }
  }
}</code></pre>
              </div>
            </section>

            <!-- SECTION 7: Security & Privacy -->
            <section id="security" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">7. Security & Privacy Guarantees</h2>
              <p>Everything.Free enforces strict architectural security invariants:</p>
              <ul style="padding-left: 1.5rem; list-style-type: disc; margin-top: 0.75rem; margin-bottom: 0.75rem;">
                <li><strong>Local vs Hosted Privacy</strong>:
                  <ul style="padding-left: 1.25rem; list-style-type: circle; margin-top: 0.25rem; margin-bottom: 0.25rem;">
                    <li><strong>Local Execution (stdio / local HTTP)</strong>: Tool processing happens entirely on your machine. Data never leaves your workstation.</li>
                    <li><strong>Hosted Execution (Remote /mcp)</strong>: Requests are sent to Everything.Free infrastructure for processing. Everything.Free does not intentionally store MCP tool payloads. Production infrastructure logging and retention policies will be documented before hosted launch.</li>
                  </ul>
                </li>
                <li><strong>Zero Capability Network Egress</strong>: Capabilities never perform outbound external network requests or third-party tracking.</li>
                <li><strong>Static Platform Directory</strong>: The Everything.Free website is a privacy-first static application with zero third-party trackers or user fingerprinting.</li>
                <li><strong>Payload Size Limits</strong>: Maximum 1MB per request with immediate streaming byte protection (HTTP 413).</li>
                <li><strong>Execution Timeouts</strong>: Hard execution timeout (3000ms default) preventing ReDoS or infinite loops.</li>
                <li><strong>No Secrets Required</strong>: Completely authentication-free and key-free by design.</li>
              </ul>
            </section>

            <!-- SECTION 8: Submission Guide -->
            <section id="submission" class="card mb-8" style="padding: var(--space-8);">
              <h2 style="font-size: 1.6rem; color: var(--text-primary); margin-bottom: 0.75rem;">8. Plugin Submission Guide</h2>
              <p>
                We welcome open-source developers creating free MCP servers and AI tools. Every submission is manually audited for security, privacy, and zero telemetry before inclusion in the directory.
              </p>
              <div class="mt-4">
                <a href="/submit" class="btn btn-primary" data-link>
                  Submit a Plugin for Review →
                </a>
              </div>
            </section>
          </article>
        </div>
      </div>
    </div>
  `;
}
