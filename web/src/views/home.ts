import { getFeaturedPlugins, getAllPlugins } from "../registry/plugins.js";
import { renderPluginCard } from "../components/plugin-card.js";
import { renderCopyButton } from "../components/copy-button.js";
import { CATEGORIES } from "../registry/categories.js";

export function renderHomeView(): string {
  const featuredPlugins = getFeaturedPlugins();
  const allPlugins = getAllPlugins();

  const featuredCardsHtml = featuredPlugins.map((plugin) => renderPluginCard(plugin)).join("");

  const categoriesGridHtml = CATEGORIES.slice(0, 6)
    .map(
      (cat) => `
      <a href="/categories/${cat.id}" class="card card-interactive" data-link style="padding: var(--space-5);">
        <div class="flex items-center justify-between mb-2">
          <h4 style="font-size: 1.05rem; color: var(--text-primary); font-weight: 600;">${cat.name}</h4>
          <span class="badge badge-slate">${cat.pluginCount} Tools</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">${cat.description}</p>
      </a>
    `
    )
    .join("");

  return `
    <div class="home-page">
      <!-- HERO SECTION -->
      <section class="section-hero">
        <div class="container text-center">
          <div class="flex items-center justify-center gap-2 mb-4">
            <span class="badge badge-gold">The Open AI Plugin Directory</span>
            <span class="badge badge-emerald">100% Free & Open Source</span>
          </div>

          <h1 style="max-width: 960px; margin: 0 auto; line-height: 1.15;">
            EVERYTHING<span class="text-gold">.FREE</span>
          </h1>

          <p class="text-lead mt-4" style="max-width: 680px; margin-left: auto; margin-right: auto;">
            Discover free AI tools, MCP apps, and open-source integrations built for modern AI workflows.
          </p>

          <p class="text-muted mt-2 text-mono" style="font-size: 0.9rem; letter-spacing: 0.15em; text-transform: uppercase;">
            Discover • Connect • Use
          </p>

          <!-- Primary CTAs -->
          <div class="flex items-center justify-center gap-4 mt-8" style="flex-wrap: wrap;">
            <a href="/plugins" class="btn btn-lg btn-primary" data-link>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Explore Plugins
            </a>
            <a href="/submit" class="btn btn-lg btn-outline" data-link>
              Submit a Plugin
            </a>
          </div>

          <!-- Value Pillars -->
          <div class="grid grid-cols-4 gap-4 mt-12" style="max-width: 900px; margin-left: auto; margin-right: auto; text-align: left;">
            <div class="card" style="padding: var(--space-4);">
              <div class="text-gold text-mono text-uppercase mb-1">01. ₹0 / $0 Cost</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">No subscriptions, no API key billing, no paywalls.</div>
            </div>
            <div class="card" style="padding: var(--space-4);">
              <div class="text-emerald text-mono text-uppercase mb-1">02. Open Source</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">MIT licensed, audited codebases, community-driven.</div>
            </div>
            <div class="card" style="padding: var(--space-4);">
              <div class="text-gold text-mono text-uppercase mb-1">03. MCP-Ready</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">Native Model Context Protocol (stdio & Streamable HTTP).</div>
            </div>
            <div class="card" style="padding: var(--space-4);">
              <div class="text-emerald text-mono text-uppercase mb-1">04. Privacy First</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">Zero telemetry, local execution, zero data retention.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- LIVE QUICKSTART / COMMAND RUNNER -->
      <section class="section" style="background-color: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
        <div class="container container-narrow">
          <div class="text-center mb-6">
            <span class="text-uppercase text-gold">Instant One-Line Quickstart</span>
            <h2 class="mt-2" style="font-size: 1.85rem;">Run 15 AI Tools in 3 Seconds</h2>
            <p class="text-muted mt-2">Zero installation required. Connect any MCP client instantly.</p>
          </div>

          <div class="code-block" style="box-shadow: var(--shadow-md);">
            <div class="code-header">
              <span>Terminal / Shell</span>
              ${renderCopyButton("npx everything.free-ai-plugins", "Copy Command")}
            </div>
            <pre class="code-content"><code><span style="color: #6EE7B7;"># Launch the Streamable HTTP MCP Server locally on port 3456</span>
<span style="color: #FCD34D;">npx</span> everything.free-ai-plugins

<span style="color: #6EE7B7;"># Or run stdio transport for Claude Desktop & Cursor</span>
<span style="color: #FCD34D;">npx</span> everything.free-ai-plugins --stdio</code></pre>
          </div>
        </div>
      </section>

      <!-- FEATURED FLAGSHIP PLUGIN -->
      <section class="section">
        <div class="container">
          <div class="flex items-center justify-between mb-8">
            <div>
              <span class="text-uppercase text-gold">Flagship Integration</span>
              <h2 class="mt-2">Featured MCP Server</h2>
            </div>
            <a href="/plugins" class="btn btn-outline" data-link>View All (${allPlugins.length}) →</a>
          </div>

          <div class="grid grid-cols-2 gap-6">
            ${featuredCardsHtml}
          </div>
        </div>
      </section>

      <!-- 15 CAPABILITIES BREAKDOWN -->
      <section class="section" style="background-color: var(--bg-surface); border-top: 1px solid var(--border-subtle);">
        <div class="container">
          <div class="text-center mb-10">
            <span class="text-uppercase text-emerald">Unified Capability Engine</span>
            <h2 class="mt-2">15 Built-in Local Capabilities</h2>
            <p class="text-muted mt-2" style="max-width: 600px; margin: 0 auto;">
              High-throughput, deterministic utilities packaged into 5 cohesive packs.
            </p>
          </div>

          <div class="grid grid-cols-3 gap-6">
            <!-- Data Pack -->
            <div class="card">
              <div class="flex items-center justify-between mb-3">
                <h3 style="font-size: 1.15rem; color: var(--accent-gold);">Data Pack</h3>
                <span class="badge badge-gold">4 Capabilities</span>
              </div>
              <ul style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                <li>• <strong>JSON Formatter & Validator</strong> (minify, inspect, tree)</li>
                <li>• <strong>CSV Processor</strong> (SQL-like filtering, parse to JSON)</li>
                <li>• <strong>SQL Processor</strong> (AST formatting, table extraction)</li>
                <li>• <strong>XML Processor</strong> (validation, tree-to-JSON)</li>
              </ul>
            </div>

            <!-- Text Pack -->
            <div class="card">
              <div class="flex items-center justify-between mb-3">
                <h3 style="font-size: 1.15rem; color: var(--accent-emerald);">Text Pack</h3>
                <span class="badge badge-emerald">3 Capabilities</span>
              </div>
              <ul style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                <li>• <strong>Text Diff Analyzer</strong> (unified diffs, similarity)</li>
                <li>• <strong>Markdown Processor</strong> (TOC generator, heading parser)</li>
                <li>• <strong>HTML Processor</strong> (DOM cleaner, XSS sanitizer)</li>
              </ul>
            </div>

            <!-- Developer Pack -->
            <div class="card">
              <div class="flex items-center justify-between mb-3">
                <h3 style="font-size: 1.15rem; color: var(--accent-gold);">Developer Pack</h3>
                <span class="badge badge-gold">4 Capabilities</span>
              </div>
              <ul style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                <li>• <strong>Regex Tester</strong> (ReDoS vulnerability checks)</li>
                <li>• <strong>JWT Token Inspector</strong> (claim decoding offline)</li>
                <li>• <strong>URL Analyzer</strong> (query param decomposition)</li>
                <li>• <strong>MIME Analyzer</strong> (magic-byte file detection)</li>
              </ul>
            </div>

            <!-- Utility Pack -->
            <div class="card">
              <div class="flex items-center justify-between mb-3">
                <h3 style="font-size: 1.15rem; color: var(--accent-emerald);">Utility Pack</h3>
                <span class="badge badge-emerald">3 Capabilities</span>
              </div>
              <ul style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                <li>• <strong>Unit & Time Converter</strong> (physics, timezones, UNIX)</li>
                <li>• <strong>Color Converter</strong> (HEX/RGB/HSL, WCAG contrast)</li>
                <li>• <strong>Cron Analyzer</strong> (human English translations)</li>
              </ul>
            </div>

            <!-- Encoding Pack -->
            <div class="card">
              <div class="flex items-center justify-between mb-3">
                <h3 style="font-size: 1.15rem; color: var(--accent-gold);">Encoding Pack</h3>
                <span class="badge badge-gold">1 Capability</span>
              </div>
              <ul style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                <li>• <strong>Hash & Encoding Utility</strong> (SHA-256, Base64, UUID)</li>
              </ul>
            </div>

            <!-- Ecosystem Specs -->
            <div class="card" style="background: var(--bg-elevated); border-color: var(--border-default);">
              <div class="flex items-center justify-between mb-3">
                <h3 style="font-size: 1.15rem; color: var(--text-primary);">MCP Technicals</h3>
                <span class="badge badge-slate">v0.1.0</span>
              </div>
              <ul style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                <li>• <strong>19 Resources</strong> (JSON catalogs, architectural specs)</li>
                <li>• <strong>7 Golden Prompts</strong> (guided assistant workflows)</li>
                <li>• <strong>Streamable HTTP & stdio</strong> transports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- BROWSE BY CATEGORY -->
      <section class="section">
        <div class="container">
          <div class="text-center mb-10">
            <span class="text-uppercase text-gold">Explore the Catalog</span>
            <h2 class="mt-2">Browse by Category</h2>
          </div>

          <div class="grid grid-cols-3 gap-4">
            ${categoriesGridHtml}
          </div>
        </div>
      </section>
    </div>
  `;
}
