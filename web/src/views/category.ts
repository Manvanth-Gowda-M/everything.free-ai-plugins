import { getCategoryById, CATEGORIES } from "../registry/categories.js";
import { getPluginsByCategory } from "../registry/plugins.js";
import { CategoryId } from "../types/plugin.js";
import { renderPluginCard } from "../components/plugin-card.js";

export function renderCategoryView(categorySlug: string): string {
  const category = getCategoryById(categorySlug as CategoryId);
  const plugins = getPluginsByCategory(categorySlug);

  const categoryName = category ? category.name : categorySlug;
  const categoryDesc = category
    ? category.description
    : `Explore all AI plugins and MCP tools categorized under ${categorySlug}.`;

  const cardsHtml =
    plugins.length > 0
      ? plugins.map((p) => renderPluginCard(p)).join("")
      : `
        <div class="card text-center" style="grid-column: 1 / -1; padding: var(--space-12);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">📦</div>
          <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No plugins in this category yet</h3>
          <p class="text-muted" style="max-width: 420px; margin: 0 auto 1.5rem auto;">
            Be the first to submit a free open-source tool for the ${categoryName} category!
          </p>
          <a href="/submit" class="btn btn-primary" data-link>
            Submit a Plugin
          </a>
        </div>
      `;

  const otherCategoriesHtml = CATEGORIES.filter((c) => c.id !== categorySlug)
    .map(
      (c) => `
      <a href="/categories/${c.id}" class="card card-interactive" data-link style="padding: var(--space-4);">
        <div class="flex items-center justify-between">
          <strong style="font-size: 0.95rem; color: var(--text-primary);">${c.name}</strong>
          <span class="badge badge-slate">${c.pluginCount}</span>
        </div>
      </a>
    `
    )
    .join("");

  return `
    <div class="category-page section">
      <div class="container">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 mb-6" style="font-size: 0.85rem; color: var(--text-muted);" aria-label="Breadcrumb">
          <a href="/" data-link class="nav-link">Home</a>
          <span>/</span>
          <a href="/plugins" data-link class="nav-link">Directory</a>
          <span>/</span>
          <span style="color: var(--text-primary); font-weight: 500;">${categoryName}</span>
        </nav>

        <div class="mb-10">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-gold">Category</span>
            <span class="badge badge-slate">${plugins.length} Plugin${plugins.length === 1 ? "" : "s"}</span>
          </div>
          <h1>${categoryName} AI Plugins</h1>
          <p class="text-lead mt-2" style="max-width: 720px;">
            ${categoryDesc}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-16">
          ${cardsHtml}
        </div>

        <!-- Other categories -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-10);">
          <h3 style="font-size: 1.25rem; margin-bottom: 1.25rem;">Explore Other Categories</h3>
          <div class="grid grid-cols-4 gap-3">
            ${otherCategoriesHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}
