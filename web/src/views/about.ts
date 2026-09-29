export function renderAboutView(): string {
  return `
    <div class="about-page section">
      <div class="container container-narrow">
        <!-- Header -->
        <div class="mb-10 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <span class="badge badge-gold">The Everything.Free Manifesto</span>
            <span class="badge badge-emerald">Open Ecosystem</span>
          </div>
          <h1>About Everything.Free</h1>
          <p class="text-lead mt-3">
            Building the premier open, 100% free directory and connection hub for the modern AI assistant era.
          </p>
        </div>

        <!-- Mission -->
        <div class="card mb-8" style="padding: var(--space-8);">
          <h2 style="font-size: 1.5rem; color: var(--text-primary); margin-bottom: 0.75rem;">Our Core Positioning</h2>
          <p class="text-lead" style="font-size: 1.15rem; color: var(--accent-gold); font-weight: 600; margin-bottom: 1rem;">
            "Discover. Connect. Use."
          </p>
          <p>
            As artificial intelligence assistants rapidly evolve into full computing platforms, users and developers face a growing dilemma: fragmented paid plugins, walled-garden app stores, intrusive telemetry, and complex vendor lock-in.
          </p>
          <p class="mt-3">
            <strong>Everything.Free</strong> was created by Quilonix to establish an open standard where high-utility AI tools, Model Context Protocol (MCP) servers, and data integrations are discoverable, transparent, and completely free of charge.
          </p>
        </div>

        <!-- Principles -->
        <div class="card mb-8" style="padding: var(--space-8);">
          <h2 style="font-size: 1.5rem; color: var(--text-primary); margin-bottom: 1.25rem;">Core Principles</h2>
          
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-gold">01</span>
                <h4 style="font-size: 1.05rem;">100% Free Forever</h4>
              </div>
              <p style="font-size: 0.875rem; color: var(--text-secondary);">
                No subscriptions, no hidden token fees, and no credit cards required. Every tool listed in our directory is freely accessible to everyone.
              </p>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-emerald">02</span>
                <h4 style="font-size: 1.05rem;">Open Source & Audited</h4>
              </div>
              <p style="font-size: 0.875rem; color: var(--text-secondary);">
                Every tool is backed by open-source code (MIT / Apache-2.0). Anyone can inspect, audit, fork, and self-host the capability engines.
              </p>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-gold">03</span>
                <h4 style="font-size: 1.05rem;">Privacy-First Sandbox</h4>
              </div>
              <p style="font-size: 0.875rem; color: var(--text-secondary);">
                Zero user tracking, zero data retention, and zero outbound network egress. Computations occur strictly on your local machine or trusted host.
              </p>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="badge badge-emerald">04</span>
                <h4 style="font-size: 1.05rem;">Universal Protocol</h4>
              </div>
              <p style="font-size: 0.875rem; color: var(--text-secondary);">
                Built on the official Model Context Protocol (MCP) standard, enabling a single plugin to seamlessly power ChatGPT, Claude, Gemini, and Cursor.
              </p>
            </div>
          </div>
        </div>

        <!-- Architectural Separation -->
        <div class="card mb-8" style="padding: var(--space-8);">
          <h2 style="font-size: 1.5rem; color: var(--text-primary); margin-bottom: 0.75rem;">System Architecture</h2>
          <p>
            Everything.Free is cleanly decoupled into two distinct layers:
          </p>
          <ul style="padding-left: 1.5rem; list-style-type: disc; margin-top: 0.75rem; margin-bottom: 1rem;">
            <li>
              <strong>Layer A — Capability Engine (<code class="code-inline">everything.free-ai-plugins</code>)</strong>: The high-performance Node.js / TypeScript engine executing tools, resources, and prompts over stdio and Streamable HTTP.
            </li>
            <li>
              <strong>Layer B — Web Platform & Connection Hub</strong>: The discovery directory, type-safe registry, connection wizard, and documentation center.
            </li>
          </ul>
        </div>

        <!-- CTA -->
        <div class="text-center mt-10">
          <a href="/plugins" class="btn btn-lg btn-primary" data-link>
            Explore Free Plugins Now →
          </a>
        </div>
      </div>
    </div>
  `;
}
