import { Plugin } from "../types/plugin.js";

export function renderPluginCard(plugin: Plugin): string {
  const capabilityNames = plugin.packs
    .flatMap((pack) => pack.capabilities.map((c) => c.name.split(" ")[0]))
    .slice(0, 6)
    .join(" • ");

  const platformIcons = plugin.platforms
    .map(
      (p) => `<span class="badge badge-slate" title="${p.platformName}">${p.platformName}</span>`
    )
    .join(" ");

  const isAvailable = plugin.status === "available";

  return `
    <article class="card card-interactive" data-slug="${plugin.slug}">
      <div class="card-header">
        <div class="flex items-center gap-3">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--bg-elevated); border: 1px solid var(--border-default); display: flex; align-items: center; justify-content: center; color: var(--accent-gold);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 style="font-size: 1.15rem; font-weight: 700;">
                <a href="/plugins/${plugin.slug}" data-link style="color: var(--text-primary);">${plugin.name}</a>
              </h3>
              ${plugin.isFeatured ? '<span class="badge badge-gold">Featured</span>' : ""}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              ${plugin.author.name} • v${plugin.version}
            </div>
          </div>
        </div>

        <span class="badge badge-emerald">Free & OSS</span>
      </div>

      <div class="card-body">
        <p style="font-size: 0.925rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
          ${plugin.tagline}
        </p>

        <div style="background-color: var(--bg-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.45rem 0.75rem; font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-gold); margin-bottom: 1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${capabilityNames || "Standard Capabilities"}
        </div>

        <div class="flex items-center gap-1" style="flex-wrap: wrap;">
          ${platformIcons}
        </div>
      </div>

      <div class="card-footer">
        <a href="/plugins/${plugin.slug}" class="btn btn-sm btn-outline" data-link>
          View Plugin
        </a>
        
        ${
          isAvailable
            ? `<button type="button" class="btn btn-sm btn-emerald open-connect-btn" data-plugin-slug="${plugin.slug}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Connect Hub
              </button>`
            : `<button type="button" class="btn btn-sm btn-outline" disabled style="opacity: 0.6; cursor: not-allowed;">
                Coming Soon
              </button>`
        }
      </div>
    </article>
  `;
}
