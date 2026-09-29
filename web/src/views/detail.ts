import { getPluginBySlug, getAllPlugins } from "../registry/plugins.js";
import { renderCopyButton } from "../components/copy-button.js";
import { renderPluginCard } from "../components/plugin-card.js";

export function renderDetailView(slug: string): string {
  const plugin = getPluginBySlug(slug);

  if (!plugin) {
    return `
      <div class="section container text-center" style="padding: var(--space-20) 0;">
        <h1 style="font-size: 2rem;">Plugin Not Found</h1>
        <p class="text-muted mt-2">The requested plugin "${slug}" does not exist in the Everything.Free registry.</p>
        <div class="mt-6">
          <a href="/plugins" class="btn btn-primary" data-link>Back to Directory</a>
        </div>
      </div>
    `;
  }

  // Capability packs HTML
  const packsHtml = plugin.packs
    .map(
      (pack) => `
      <div class="card mb-6" style="border-color: var(--border-default);">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background: var(--bg-surface); border: 1px solid var(--accent-gold-border); display: flex; align-items: center; justify-content: center; color: var(--accent-gold);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div>
              <h3 style="font-size: 1.25rem;">${pack.name}</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">${pack.description}</p>
            </div>
          </div>
          <span class="badge badge-gold">${pack.capabilities.length} Tools</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          ${pack.capabilities
            .map(
              (c) => `
            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-4);">
              <div class="flex items-center justify-between mb-1">
                <h4 style="font-size: 0.95rem; color: var(--text-primary); font-weight: 600;">${c.name}</h4>
                <span class="code-inline" style="font-size: 0.725rem;">${c.id}</span>
              </div>
              <p style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.45;">${c.description}</p>
              
              <div class="flex gap-1 items-center mb-2" style="flex-wrap: wrap;">
                ${c.operations.map((op) => `<span class="badge badge-slate" style="font-size: 0.675rem; font-family: var(--font-mono);">${op}</span>`).join(" ")}
              </div>

              ${
                c.inputExample
                  ? `
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                  <span style="color: var(--text-secondary); font-weight: 600;">Example Input:</span>
                  <pre class="code-block" style="padding: 0.35rem 0.5rem; margin-top: 2px; font-size: 0.725rem; color: #A7F3D0; overflow-x: auto;"><code>${escapeHtml(c.inputExample)}</code></pre>
                </div>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");

  // Platform integration items
  const platformsHtml = plugin.platforms
    .map(
      (p) => `
      <div class="card" style="padding: var(--space-5);">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <h4 style="font-size: 1.1rem;">${p.platformName}</h4>
            <span class="badge badge-emerald">${p.connectionType}</span>
          </div>
          <button 
            type="button" 
            class="btn btn-sm btn-emerald open-connect-btn" 
            data-plugin-slug="${plugin.slug}" 
            data-platform-id="${p.platformId}"
          >
            Connect to ${p.platformName}
          </button>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          ${p.instructions[0] || "Standard MCP integration"}
        </p>
        ${
          p.setupSnippet
            ? `
          <div class="code-block">
            <div class="code-header">
              <span>${p.snippetLanguage || "json"}</span>
              ${renderCopyButton(p.setupSnippet, "Copy")}
            </div>
            <pre class="code-content" style="font-size: 0.775rem; max-height: 140px;"><code>${escapeHtml(p.setupSnippet)}</code></pre>
          </div>
        `
            : ""
        }
      </div>
    `
    )
    .join("");

  // Related plugins
  const relatedPlugins = getAllPlugins()
    .filter((p) => p.slug !== plugin.slug)
    .slice(0, 2);
  const relatedCardsHtml = relatedPlugins.map((p) => renderPluginCard(p)).join("");

  return `
    <div class="detail-page section">
      <div class="container">
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-2 mb-6" style="font-size: 0.85rem; color: var(--text-muted);" aria-label="Breadcrumb">
          <a href="/" data-link class="nav-link">Home</a>
          <span>/</span>
          <a href="/plugins" data-link class="nav-link">Plugins</a>
          <span>/</span>
          <span style="color: var(--text-primary); font-weight: 500;">${plugin.name}</span>
        </nav>

        <!-- Main Hero Identity Banner -->
        <div class="card mb-8" style="background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-card) 100%); border-color: var(--border-default); padding: var(--space-8);">
          <div class="flex items-start justify-between gap-6" style="flex-wrap: wrap;">
            <div class="flex items-start gap-4">
              <div style="width: 64px; height: 64px; border-radius: var(--radius-lg); background: var(--bg-elevated); border: 1px solid var(--accent-gold-border); display: flex; align-items: center; justify-content: center; color: var(--accent-gold);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>

              <div>
                <div class="flex items-center gap-2 mb-1" style="flex-wrap: wrap;">
                  <h1 style="font-size: 1.85rem; line-height: 1.2;">${plugin.name}</h1>
                  <span class="badge badge-gold">v${plugin.version}</span>
                  <span class="badge badge-emerald">100% Free</span>
                  <span class="badge badge-slate">MIT License</span>
                </div>
                <p class="text-lead" style="font-size: 1.05rem; color: var(--text-secondary); max-width: 640px;">
                  ${plugin.tagline}
                </p>
                <div class="flex items-center gap-4 mt-3" style="font-size: 0.85rem; color: var(--text-muted);">
                  <span>Author: <strong style="color: var(--text-primary);">${plugin.author.name}</strong></span>
                  <span>Category: <a href="/categories/${plugin.category}" data-link class="text-gold">${plugin.category}</a></span>
                  <span>Updated: ${new Date(plugin.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <!-- Primary CTAs -->
            <div class="flex flex-col gap-2" style="min-width: 220px;">
              <button type="button" class="btn btn-emerald open-connect-btn" data-plugin-slug="${plugin.slug}" style="font-size: 1rem; padding: 0.75rem 1.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Connect to AI
              </button>

              <a href="${plugin.repository.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub (${plugin.repository.starsCount || 0} ★)
              </a>
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: Main Content (Left) & Technical Sidebar (Right) -->
        <div class="grid" style="grid-template-columns: 2fr 1fr; gap: var(--space-8); align-items: start;">
          <!-- Left Column -->
          <div>
            <!-- Overview -->
            <section class="mb-10">
              <h2 style="font-size: 1.45rem; margin-bottom: 1rem;">Overview & Architecture</h2>
              <div style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">
                ${renderMarkdown(plugin.longDescription)}
              </div>
            </section>

            <!-- Capabilities Breakdown -->
            <section class="mb-10">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 style="font-size: 1.45rem;">Capabilities & Tools</h2>
                  <p class="text-muted" style="font-size: 0.875rem;">
                    ${plugin.packs.reduce((acc, p) => acc + p.capabilities.length, 0)} available tool functions across ${plugin.packs.length} packs
                  </p>
                </div>
              </div>
              ${packsHtml}
            </section>

            <!-- Platform Connection Hub -->
            <section class="mb-10">
              <h2 style="font-size: 1.45rem; margin-bottom: 1rem;">Supported AI Platforms</h2>
              <div class="grid grid-cols-1 gap-4">
                ${platformsHtml}
              </div>
            </section>
          </div>

          <!-- Right Sidebar -->
          <aside>
            <!-- Technical MCP Metadata Box -->
            <div class="card mb-6" style="background-color: var(--bg-surface);">
              <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--accent-gold);">
                ⚡ MCP Technical Specs
              </h3>
              <ul style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;">
                <li class="flex justify-between">
                  <span class="text-muted">Protocol:</span>
                  <span class="code-inline">${plugin.mcpInfo.protocolVersion}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-muted">Transports:</span>
                  <span>${plugin.mcpInfo.transport.join(", ")}</span>
                </li>
                <li class="flex justify-between">
                  <span class="text-muted">Capabilities:</span>
                  <strong style="color: var(--text-primary);">${plugin.mcpInfo.capabilitiesCount}</strong>
                </li>
                <li class="flex justify-between">
                  <span class="text-muted">Resources:</span>
                  <strong style="color: var(--text-primary);">${plugin.mcpInfo.resourcesCount}</strong>
                </li>
                <li class="flex justify-between">
                  <span class="text-muted">Prompts:</span>
                  <strong style="color: var(--text-primary);">${plugin.mcpInfo.promptsCount}</strong>
                </li>
                ${
                  plugin.mcpInfo.httpEndpoint
                    ? `
                  <li style="border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
                    <div class="text-muted mb-1">Local HTTP Endpoint:</div>
                    <div class="code-inline" style="word-break: break-all;">${plugin.mcpInfo.httpEndpoint}</div>
                  </li>
                `
                    : ""
                }
              </ul>
            </div>

            <!-- Privacy & Security Audit Box -->
            <div class="card mb-6" style="background-color: var(--bg-surface);">
              <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--accent-emerald);">
                🛡️ Privacy & Permissions Audit
              </h3>
              <ul style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem;">
                <li style="color: var(--accent-emerald);">✓ 100% Local Execution</li>
                <li style="color: var(--accent-emerald);">✓ Zero Network Outbound Egress</li>
                <li style="color: var(--accent-emerald);">✓ Zero Analytics or Telemetry</li>
                <li style="color: var(--accent-emerald);">✓ Zero Data Retention (In-Memory)</li>
                <li style="color: var(--accent-emerald);">✓ No API Keys or Secrets Required</li>
                <li style="color: var(--accent-emerald);">✓ Open-Source MIT Verified</li>
              </ul>
            </div>

            <!-- Tags -->
            <div class="card mb-6">
              <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem;">Tags</h4>
              <div class="flex gap-1" style="flex-wrap: wrap;">
                ${plugin.tags.map((t) => `<span class="badge badge-slate">${t}</span>`).join(" ")}
              </div>
            </div>
          </aside>
        </div>

        <!-- Related Plugins Section -->
        ${
          relatedPlugins.length > 0
            ? `
          <div class="mt-12" style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-8);">
            <h3 style="font-size: 1.35rem; margin-bottom: 1.5rem;">More Free Plugins</h3>
            <div class="grid grid-cols-2 gap-6">
              ${relatedCardsHtml}
            </div>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(md: string): string {
  return md
    .split("\n\n")
    .map((para) => {
      if (para.startsWith("### ")) {
        return `<h3 style="font-size: 1.2rem; color: var(--text-primary); margin-top: 1rem; margin-bottom: 0.5rem;">${para.slice(4)}</h3>`;
      }
      if (para.startsWith("- ")) {
        const items = para
          .split("\n")
          .map(
            (item) =>
              `<li style="margin-bottom: 0.35rem;">${item.replace(/^- \*\*(.*?)\*\*:/, "<strong>$1:</strong>").replace(/^- /, "")}</li>`
          )
          .join("");
        return `<ul style="margin-bottom: 1rem; padding-left: 1.25rem; list-style-type: disc;">${items}</ul>`;
      }
      return `<p style="margin-bottom: 1rem;">${para}</p>`;
    })
    .join("");
}
