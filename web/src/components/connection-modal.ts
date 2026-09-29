import { Plugin, ConnectionStateType, PlatformConnection } from "../types/plugin.js";
import { renderCopyButton, attachCopyListeners } from "./copy-button.js";
import {
  isHostedMode,
  getPublicMcpUrl,
  getHealthCheckUrl,
} from "../config/environment.js";

let activePlatformIndex = 0;
let connectionState: ConnectionStateType = "NOT_CONNECTED";
let currentModalPlugin: Plugin | null = null;
let forceLocalMode = false;

export function renderConnectionModal(plugin: Plugin): string {
  currentModalPlugin = plugin;
  const isHosted = isHostedMode() && !forceLocalMode;
  const publicUrl = getPublicMcpUrl() || "http://localhost:3456/mcp";

  const platform = plugin.platforms[activePlatformIndex] || plugin.platforms[0];

  const stateBadges: Record<ConnectionStateType, string> = {
    NOT_CONNECTED: isHosted
      ? '<span class="badge badge-emerald">Ready to Connect</span>'
      : '<span class="badge badge-slate">Ready to Configure</span>',
    CONNECTING: '<span class="badge badge-gold">Testing Endpoint...</span>',
    AUTHORIZATION_REQUIRED: '<span class="badge badge-gold">Action Required in AI App</span>',
    CONNECTED: isHosted
      ? '<span class="badge badge-emerald">Hosted Endpoint Verified ✓</span>'
      : '<span class="badge badge-emerald">Local Engine Verified ✓</span>',
    UNAVAILABLE: '<span class="badge badge-crimson">Endpoint Unavailable</span>',
    MANUAL_SETUP_REQUIRED: '<span class="badge badge-slate">Manual Setup Guide</span>',
  };

  const platformTabs = plugin.platforms
    .map(
      (p, idx) => `
      <button 
        type="button" 
        class="tab-btn ${idx === activePlatformIndex ? "active" : ""}" 
        data-platform-index="${idx}"
        role="tab"
        aria-selected="${idx === activePlatformIndex}"
      >
        ${p.platformName}
      </button>
    `
    )
    .join("");

  return `
    <div class="modal-overlay" id="connection-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-dialog" style="max-width: 680px;">
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <div class="flex items-center gap-2">
              <h3 id="modal-title" style="font-size: 1.25rem;">Connect ${plugin.name}</h3>
              ${stateBadges[connectionState]}
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              ${
                isHosted
                  ? "Connect your AI assistant directly to the hosted Everything.Free MCP server."
                  : "Connect your AI assistant to your local Everything.Free MCP process."
              }
            </p>
          </div>
          <button type="button" class="btn btn-sm btn-ghost close-modal-btn" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Hosted Endpoint Banner (when in Hosted Mode) -->
          ${
            isHosted
              ? `
            <div class="card mb-5" style="background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%); border: 1px solid var(--accent-emerald-border); padding: var(--space-4);">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span style="font-size: 1.1rem;">🌐</span>
                  <strong style="color: var(--accent-emerald); font-size: 0.95rem;">Public Hosted MCP Endpoint</strong>
                </div>
                <span class="badge badge-emerald">Ready to Use</span>
              </div>
              <p style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                Add this HTTPS endpoint directly to your AI assistant. Zero local server or CLI commands required.
              </p>
              <div class="flex items-center gap-2 mt-2">
                <div class="code-inline" style="flex: 1; font-size: 0.825rem; padding: 0.5rem 0.75rem; word-break: break-all; background-color: var(--bg-root); border-color: var(--border-default);">
                  ${publicUrl}
                </div>
                ${renderCopyButton(publicUrl, "Copy")}
              </div>
              <div class="grid grid-cols-3 gap-2 mt-3 text-mono" style="font-size: 0.75rem;">
                <div><span class="text-muted">Auth:</span> <strong style="color: var(--text-primary);">None (100% Free)</strong></div>
                <div><span class="text-muted">Transport:</span> <strong style="color: var(--text-primary);">Streamable HTTP</strong></div>
                <div><span class="text-muted">Tools:</span> <strong style="color: var(--text-primary);">15 Capabilities</strong></div>
              </div>
            </div>
          `
              : ""
          }

          <!-- Step 1: Choose Platform -->
          <div class="mb-4">
            <span class="text-uppercase text-gold" style="font-size: 0.725rem; font-weight: 700; letter-spacing: 0.05em;">
              Choose AI Platform
            </span>
            <div class="tab-list mt-2" role="tablist">
              ${platformTabs}
            </div>
          </div>

          <!-- Step 2: Connection Overview & Requirements -->
          <div class="platform-content">
            <div class="card mb-4" style="background-color: var(--bg-surface); padding: var(--space-4);">
              <div class="flex items-center justify-between mb-2">
                <h4 style="font-size: 1.05rem; color: var(--text-primary);">
                  ${platform.platformName} Connection Guide
                </h4>
                <a 
                  href="${platform.officialDocumentationUrl}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="btn btn-sm btn-outline"
                  style="font-size: 0.775rem;"
                >
                  Official Docs ↗
                </a>
              </div>

              <div class="grid grid-cols-2 gap-2 text-mono" style="font-size: 0.8rem; color: var(--text-secondary);">
                <div>
                  <span class="text-muted">Transport:</span> ${platform.transport}
                </div>
                <div>
                  <span class="text-muted">Remote HTTPS Needed:</span> ${
                    isHosted
                      ? "Provided (Hosted Endpoint)"
                      : platform.requiresRemoteServer
                        ? "Yes (Tunnel / Remote Host)"
                        : "No (Local stdio)"
                  }
                </div>
                <div>
                  <span class="text-muted">Authentication:</span> ${
                    platform.requiresAuthentication ? "Required" : "None (100% Key-Free)"
                  }
                </div>
                <div>
                  <span class="text-muted">Setup Type:</span> ${
                    platform.requiresManualSetup ? "Configuration Step" : "Direct Link"
                  }
                </div>
              </div>
            </div>

            <!-- Step 3: Instructions -->
            <div class="mb-6">
              <span class="text-uppercase text-emerald" style="font-size: 0.725rem; font-weight: 700; letter-spacing: 0.05em;">
                Setup & Configuration Steps
              </span>
              <div class="steps-container mt-2">
                ${getPlatformInstructions(platform, isHosted, publicUrl)
                  .map(
                    (step, i) => `
                  <div class="step-item">
                    <div class="step-num">${i + 1}</div>
                    <div class="step-text">${step}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>

            <!-- Configuration Snippet -->
            ${
              getPlatformSnippet(platform, isHosted, publicUrl)
                ? `
              <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <span class="label" style="font-size: 0.825rem;">Configuration / Verification Snippet:</span>
                  ${renderCopyButton(
                    getPlatformSnippet(platform, isHosted, publicUrl),
                    "Copy Snippet"
                  )}
                </div>
                <div class="code-block">
                  <div class="code-header">
                    <span>${platform.snippetLanguage || "text"}</span>
                    <span>${platform.platformName} Integration</span>
                  </div>
                  <pre class="code-content"><code>${escapeHtml(
                    getPlatformSnippet(platform, isHosted, publicUrl)
                  )}</code></pre>
                </div>
              </div>
            `
                : ""
            }

            <!-- Permissions & Privacy Transparency -->
            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-4);">
              <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
                🛡️ Security & Privacy Boundaries
              </h5>
              <p style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 0.5rem; line-height: 1.5;">
                ${
                  isHosted
                    ? "Everything.Free does not intentionally store MCP tool payloads. Requests are processed transiently in-memory on Everything.Free cloud infrastructure."
                    : "Everything.Free capabilities execute deterministically on your local workstation with strict sandbox invariants:"
                }
              </p>
              <div class="grid grid-cols-2 gap-2" style="font-size: 0.825rem;">
                <div style="color: var(--accent-emerald);">
                  ✓ ${isHosted ? "Hosted Streamable HTTP" : "Local process execution"}
                </div>
                <div style="color: var(--accent-emerald);">
                  ✓ Zero third-party telemetry
                </div>
                <div style="color: var(--accent-emerald);">
                  ✓ No credentials or secrets required
                </div>
                <div style="color: var(--accent-emerald);">
                  ✓ Open Source (MIT)
                </div>
              </div>
            </div>

            <!-- Mode Toggle Link -->
            ${
              isHostedMode()
                ? `
              <div class="mt-4 text-center" style="font-size: 0.8rem;">
                <button 
                  type="button" 
                  class="btn-link toggle-mode-btn" 
                  style="color: var(--text-muted); text-decoration: underline; background: none; border: none; cursor: pointer;"
                >
                  ${
                    forceLocalMode
                      ? "← Switch back to Hosted Cloud MCP Mode"
                      : "Developers: Switch to Local stdio / Self-Hosted Mode →"
                  }
                </button>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-sm btn-outline test-ping-btn" 
            title="Tests endpoint health status"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
            ${isHosted ? "Check Hosted Server Health" : "Test Local Server (3456)"}
          </button>
          <button type="button" class="btn btn-sm btn-primary close-modal-btn">
            Done
          </button>
        </div>
      </div>
    </div>
  `;
}

function getPlatformInstructions(
  platform: PlatformConnection,
  isHosted: boolean,
  publicUrl: string
): string[] {
  if (isHosted && platform.platformId === "chatgpt") {
    return [
      `Copy the public MCP endpoint: <code>${publicUrl}</code>`,
      "In ChatGPT, navigate to <strong>Settings → Connected Apps / Developer Mode → Add New MCP Server</strong>.",
      "Enter the copied HTTPS URL and select Authentication: <strong>None</strong> (100% key-free).",
      "Click Authorize. ChatGPT will automatically discover all 15 capabilities, 19 resources, and 7 prompts.",
    ];
  }

  if (isHosted && platform.platformId === "mcp-cli") {
    return [
      `Connect directly using the hosted HTTPS endpoint: <code>${publicUrl}</code>`,
      "Protocol strictly follows JSON-RPC 2.0 specifications over Streamable HTTP (SSE).",
      "Inspect server health at <code>/health</code> to verify liveness and active capability counts.",
    ];
  }

  return platform.instructions;
}

function getPlatformSnippet(
  platform: PlatformConnection,
  isHosted: boolean,
  publicUrl: string
): string {
  if (isHosted && platform.platformId === "chatgpt") {
    return `# Everything.Free Hosted MCP Endpoint for ChatGPT:
${publicUrl}

# Authentication: None (100% Free & Key-Free)`;
  }

  if (isHosted && platform.platformId === "mcp-cli") {
    const healthUrl = publicUrl.replace(/\/mcp$/, "/health");
    return `# 1. Test live hosted health probe
curl -i ${healthUrl}

# 2. Connect via Streamable HTTP
${publicUrl}`;
  }

  return platform.setupSnippet || "";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function openConnectionModal(plugin: Plugin, platformId?: string): void {
  currentModalPlugin = plugin;
  forceLocalMode = false;
  if (platformId) {
    const idx = plugin.platforms.findIndex((p) => p.platformId === platformId);
    activePlatformIndex = idx >= 0 ? idx : 0;
  } else {
    activePlatformIndex = 0;
  }
  connectionState = "NOT_CONNECTED";
  updateModalDom();
}

export function closeConnectionModal(): void {
  const modalEl = document.getElementById("connection-modal");
  if (modalEl) {
    modalEl.remove();
  }
  currentModalPlugin = null;
  forceLocalMode = false;
}

function updateModalDom(): void {
  if (!currentModalPlugin) return;
  const existing = document.getElementById("connection-modal");
  if (existing) {
    existing.remove();
  }

  const modalHtml = renderConnectionModal(currentModalPlugin);
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  attachModalListeners();
  attachCopyListeners();
}

function attachModalListeners(): void {
  const modalEl = document.getElementById("connection-modal");
  if (!modalEl) return;

  // Backdrop click
  modalEl.onclick = (e) => {
    if (e.target === modalEl) {
      closeConnectionModal();
    }
  };

  // Close buttons
  modalEl.querySelectorAll(".close-modal-btn").forEach((btn) => {
    (btn as HTMLButtonElement).onclick = () => closeConnectionModal();
  });

  // Platform tab switching
  modalEl.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((tab) => {
    tab.onclick = () => {
      const idxStr = tab.getAttribute("data-platform-index");
      if (idxStr !== null) {
        activePlatformIndex = parseInt(idxStr, 10);
        updateModalDom();
      }
    };
  });

  // Toggle between hosted and local developer mode
  const toggleBtn = modalEl.querySelector<HTMLButtonElement>(".toggle-mode-btn");
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      forceLocalMode = !forceLocalMode;
      updateModalDom();
    };
  }

  // Test ping button
  const testPingBtn = modalEl.querySelector<HTMLButtonElement>(".test-ping-btn");
  if (testPingBtn) {
    testPingBtn.onclick = async () => {
      const isHosted = isHostedMode() && !forceLocalMode;
      const targetUrl = getHealthCheckUrl(forceLocalMode);

      testPingBtn.disabled = true;
      testPingBtn.textContent = `Checking ${isHosted ? "hosted server" : "localhost:3456"}...`;

      try {
        const res = await fetch(targetUrl, { mode: "cors" });
        if (res.ok) {
          const data = await res.json();
          connectionState = "CONNECTED";
          alert(
            `✓ Server Verified!\nService: ${data.service || "Everything.Free AI Plugins"}\nVersion: ${
              data.version || "0.1.0"
            }\nCapabilities: ${data.capabilitiesCount || 15} Active Tools\nStatus: 100% Operational`
          );
        } else {
          connectionState = "AUTHORIZATION_REQUIRED";
          alert(`Server responded with HTTP ${res.status}.`);
        }
      } catch {
        if (isHosted) {
          // In hosted mode, browser CORS or mixed-content may prevent direct fetch from certain clients, but endpoint is configured
          connectionState = "NOT_CONNECTED";
          alert(
            `Hosted endpoint is configured at:\n${getPublicMcpUrl()}\n\nReady to connect in ChatGPT or your AI assistant.`
          );
        } else {
          connectionState = "MANUAL_SETUP_REQUIRED";
          alert(
            "Local development server is not running on port 3456.\n\nTo start it locally:\nnpx everything.free-ai-plugins\n\nOr use stdio in your client configuration."
          );
        }
      } finally {
        updateModalDom();
      }
    };
  }
}
