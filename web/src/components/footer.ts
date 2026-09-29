export function renderFooter(): string {
  return `
    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="brand-logo mb-4">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <rect width="32" height="32" rx="6" fill="#12131C"/>
                <rect x="0.5" y="0.5" width="31" height="31" rx="5.5" stroke="#282D42"/>
                <path d="M7 9H25M7 16H21M7 23H25" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="24" cy="16" r="2.5" fill="#0FAF78"/>
              </svg>
              <span>EVERYTHING<span class="gold">.FREE</span></span>
            </div>
            <p class="text-muted" style="font-size: 0.9rem; max-width: 320px;">
              The open-source AI plugin directory and connection hub. 100% free, privacy-first tools for ChatGPT, Claude, Gemini, and MCP assistants.
            </p>
            <div class="mt-4 flex gap-2 items-center">
              <span class="badge badge-emerald">100% Free</span>
              <span class="badge badge-gold">MIT License</span>
              <span class="badge badge-slate">Zero Telemetry</span>
            </div>
          </div>

          <div>
            <h4 style="font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 1rem;">
              Ecosystem
            </h4>
            <ul style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem;">
              <li><a href="/plugins" class="nav-link" data-link>All Plugins</a></li>
              <li><a href="/plugins/everything-free-ai-plugins" class="nav-link" data-link>Everything.Free AI Plugins</a></li>
              <li><a href="/categories/developer" class="nav-link" data-link>Developer Tools</a></li>
              <li><a href="/categories/data" class="nav-link" data-link>Data & Analysis</a></li>
              <li><a href="/submit" class="nav-link" data-link>Submit a Plugin</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 1rem;">
              Platforms
            </h4>
            <ul style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem;">
              <li><a href="/docs#chatgpt" class="nav-link" data-link>Connect to ChatGPT</a></li>
              <li><a href="/docs#claude" class="nav-link" data-link>Connect to Claude</a></li>
              <li><a href="/docs#gemini" class="nav-link" data-link>Connect to Gemini</a></li>
              <li><a href="/docs#manual" class="nav-link" data-link>Manual MCP Setup</a></li>
              <li><a href="/docs#security" class="nav-link" data-link>Security & Invariants</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 1rem;">
              Project
            </h4>
            <ul style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem;">
              <li><a href="/about" class="nav-link" data-link>About Everything.Free</a></li>
              <li><a href="/docs" class="nav-link" data-link>Documentation Hub</a></li>
              <li><a href="https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins" target="_blank" rel="noopener noreferrer" class="nav-link">GitHub Repository</a></li>
              <li><a href="https://www.npmjs.com/package/everything.free-ai-plugins" target="_blank" rel="noopener noreferrer" class="nav-link">npm Package</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div>
            © 2026 Everything.Free Project by Quilonix. Released under the MIT License.
          </div>
          <div class="flex gap-4 items-center">
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--accent-emerald);"></span>
              MCP v2024-11-05
            </span>
            <span>v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
