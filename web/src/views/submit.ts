import { CATEGORIES } from "../registry/categories.js";
import { PLATFORMS } from "../registry/platforms.js";
import { renderCopyButton } from "../components/copy-button.js";

export function renderSubmitView(): string {
  const categoryOptions = CATEGORIES.map(
    (c) => `<option value="${c.id}">${c.name} (${c.id})</option>`
  ).join("");

  const platformCheckboxes = PLATFORMS.map(
    (p) => `
    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); cursor: pointer;">
      <input type="checkbox" name="platforms" value="${p.id}" checked />
      <span>${p.name}</span>
    </label>
  `
  ).join("");

  return `
    <div class="submit-page section">
      <div class="container container-narrow">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-gold">Developer Community</span>
            <span class="badge badge-emerald">Open Submission</span>
          </div>
          <h1>Submit a Free AI Plugin</h1>
          <p class="text-lead mt-2">
            Add your open-source MCP app, tool pack, or AI integration to the Everything.Free directory.
          </p>
        </div>

        <!-- Submission Guidelines Notice -->
        <div class="card mb-8" style="background-color: var(--bg-surface); border-color: var(--accent-gold-border);">
          <div class="flex items-start gap-3">
            <span style="font-size: 1.5rem;">🛡️</span>
            <div>
              <h4 style="font-size: 1.05rem; color: var(--accent-gold); margin-bottom: 0.25rem;">
                Directory Inclusion Policy & Review Process
              </h4>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
                Every submission is manually reviewed by the Everything.Free security team. To qualify:
                <br />1. Must be <strong>100% free</strong> with no required paid subscription or paywall.
                <br />2. Must be <strong>open-source</strong> (MIT, Apache-2.0, BSD, GPL, or compatible).
                <br />3. Must adhere to <strong>strict privacy</strong> standards with zero undisclosed telemetry.
              </p>
            </div>
          </div>
        </div>

        <!-- Submission Form -->
        <form id="submit-plugin-form" class="card" style="padding: var(--space-8);">
          <div class="grid grid-cols-2 gap-4">
            <div class="input-group">
              <label class="label" for="sub-name">Plugin Name *</label>
              <input type="text" id="sub-name" class="input" placeholder="e.g. SQLite Analyzer MCP" required />
            </div>

            <div class="input-group">
              <label class="label" for="sub-slug">Slug Identifier *</label>
              <input type="text" id="sub-slug" class="input" placeholder="e.g. sqlite-analyzer-mcp" required />
            </div>
          </div>

          <div class="input-group">
            <label class="label" for="sub-tagline">Short Tagline (1 sentence) *</label>
            <input type="text" id="sub-tagline" class="input" placeholder="e.g. Local SQLite schema inspection and query optimizer for AI assistants." required />
          </div>

          <div class="input-group">
            <label class="label" for="sub-description">Full Description *</label>
            <textarea id="sub-description" class="textarea" placeholder="Explain the architecture, capabilities, and why this tool is useful..." required></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="input-group">
              <label class="label" for="sub-category">Primary Category *</label>
              <select id="sub-category" class="select" required>
                ${categoryOptions}
              </select>
            </div>

            <div class="input-group">
              <label class="label" for="sub-license">License *</label>
              <input type="text" id="sub-license" class="input" placeholder="e.g. MIT" value="MIT" required />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="input-group">
              <label class="label" for="sub-repo">GitHub Repository URL *</label>
              <input type="url" id="sub-repo" class="input" placeholder="https://github.com/your-org/your-mcp-app" required />
            </div>

            <div class="input-group">
              <label class="label" for="sub-endpoint">MCP Transport / npm Command *</label>
              <input type="text" id="sub-endpoint" class="input" placeholder="npx your-mcp-app --stdio" required />
            </div>
          </div>

          <div class="input-group">
            <label class="label">Supported AI Platforms</label>
            <div class="grid grid-cols-3 gap-2" style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              ${platformCheckboxes}
            </div>
          </div>

          <div class="input-group">
            <label class="label" for="sub-author">Author / Organization & Contact *</label>
            <input type="text" id="sub-author" class="input" placeholder="e.g. Jane Doe (@janedoe)" required />
          </div>

          <div class="mt-6 flex items-center justify-between" style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-6);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Submissions generate a GitHub pull-request template ready for review.
            </div>
            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.75rem;">
              Submit for Review →
            </button>
          </div>
        </form>

        <!-- Preview Modal / Result Box -->
        <div id="submission-result" class="card mt-8" style="display: none; padding: var(--space-8); border-color: var(--accent-emerald-border);">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="badge badge-emerald">Proposal Generated</span>
              <h3 style="font-size: 1.2rem;">Ready for GitHub PR</h3>
            </div>
            <div id="result-copy-wrapper"></div>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Copy the structured JSON definition below and submit an issue or pull request to the Everything.Free repository:
          </p>
          <div class="code-block">
            <pre class="code-content" id="submission-payload" style="max-height: 260px; font-size: 0.8rem;"></pre>
          </div>
          <div class="mt-6">
            <a 
              href="https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins/issues/new" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-emerald"
            >
              Open GitHub Issue with Proposal ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSubmitInteractions(): void {
  const form = document.getElementById("submit-plugin-form") as HTMLFormElement | null;
  if (!form) return;

  form.onsubmit = (e) => {
    e.preventDefault();

    const name = (document.getElementById("sub-name") as HTMLInputElement).value;
    const slug = (document.getElementById("sub-slug") as HTMLInputElement).value;
    const tagline = (document.getElementById("sub-tagline") as HTMLInputElement).value;
    const description = (document.getElementById("sub-description") as HTMLTextAreaElement).value;
    const category = (document.getElementById("sub-category") as HTMLSelectElement).value;
    const license = (document.getElementById("sub-license") as HTMLInputElement).value;
    const repo = (document.getElementById("sub-repo") as HTMLInputElement).value;
    const endpoint = (document.getElementById("sub-endpoint") as HTMLInputElement).value;
    const author = (document.getElementById("sub-author") as HTMLInputElement).value;

    const checkedPlatforms: string[] = [];
    document.querySelectorAll<HTMLInputElement>('input[name="platforms"]:checked').forEach((cb) => {
      checkedPlatforms.push(cb.value);
    });

    const proposal = {
      id: `plugin_${slug.replace(/-/g, "_")}`,
      slug,
      name,
      version: "0.1.0",
      tagline,
      description,
      category,
      license,
      repository: repo,
      endpointOrCommand: endpoint,
      supportedPlatforms: checkedPlatforms,
      author,
      pricing: "open_source",
      isOpenSource: true,
      status: "under_review",
      createdAt: new Date().toISOString(),
    };

    const payloadJson = JSON.stringify(proposal, null, 2);
    const resultBox = document.getElementById("submission-result");
    const payloadEl = document.getElementById("submission-payload");
    const copyWrapper = document.getElementById("result-copy-wrapper");

    if (resultBox && payloadEl && copyWrapper) {
      payloadEl.textContent = payloadJson;
      copyWrapper.innerHTML = renderCopyButton(payloadJson, "Copy JSON");
      resultBox.style.display = "block";
      resultBox.scrollIntoView({ behavior: "smooth" });
    }
  };
}
