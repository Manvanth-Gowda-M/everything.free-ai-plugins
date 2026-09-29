import { getAllPlugins } from "../registry/plugins.js";
import { Plugin, FilterState } from "../types/plugin.js";
import { renderPluginCard } from "../components/plugin-card.js";
import { renderSearchFilter, attachFilterListeners } from "../components/search-filter.js";

let currentFilterState: FilterState = {
  searchQuery: "",
  category: "all",
  platform: "all",
  pricing: "all",
  status: "all",
  sortBy: "featured",
};

export function renderDirectoryView(initialCategory?: string): string {
  if (initialCategory && initialCategory !== "all") {
    currentFilterState.category = initialCategory as FilterState["category"];
  }

  const filteredPlugins = applyFilters(getAllPlugins(), currentFilterState);

  const cardsHtml =
    filteredPlugins.length > 0
      ? filteredPlugins.map((plugin) => renderPluginCard(plugin)).join("")
      : `
        <div class="card text-center" style="grid-column: 1 / -1; padding: var(--space-12);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No AI plugins match your filters</h3>
          <p class="text-muted" style="max-width: 420px; margin: 0 auto 1.5rem auto;">
            Try adjusting your search keywords or clearing platform/category constraints.
          </p>
          <button type="button" class="btn btn-outline" id="clear-filters-btn">
            Clear All Filters
          </button>
        </div>
      `;

  return `
    <div class="directory-page section">
      <div class="container">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-gold">Ecosystem Directory</span>
            <span class="badge badge-slate">${getAllPlugins().length} Plugins Cataloged</span>
          </div>
          <h1>AI Plugins & MCP Apps</h1>
          <p class="text-lead mt-2" style="max-width: 680px;">
            Explore vetted, open-source, and 100% free Model Context Protocol tools for ChatGPT, Claude, Gemini, and AI IDEs.
          </p>
        </div>

        <!-- Search & Filters -->
        <div id="search-filter-container">
          ${renderSearchFilter(currentFilterState)}
        </div>

        <!-- Results Summary & Grid -->
        <div class="flex items-center justify-between mb-4">
          <div style="font-size: 0.9rem; color: var(--text-muted);">
            Showing <strong style="color: var(--text-primary);">${filteredPlugins.length}</strong> plugin${filteredPlugins.length === 1 ? "" : "s"}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6" id="plugin-cards-grid">
          ${cardsHtml}
        </div>
      </div>
    </div>
  `;
}

export function initDirectoryInteractions(): void {
  attachFilterListeners(currentFilterState, (newState) => {
    currentFilterState = newState;
    const grid = document.getElementById("plugin-cards-grid");
    if (!grid) return;

    const filtered = applyFilters(getAllPlugins(), currentFilterState);
    if (filtered.length > 0) {
      grid.innerHTML = filtered.map((plugin) => renderPluginCard(plugin)).join("");
    } else {
      grid.innerHTML = `
        <div class="card text-center" style="grid-column: 1 / -1; padding: var(--space-12);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No AI plugins match your filters</h3>
          <p class="text-muted" style="max-width: 420px; margin: 0 auto 1.5rem auto;">
            Try adjusting your search keywords or clearing platform/category constraints.
          </p>
          <button type="button" class="btn btn-outline" id="clear-filters-btn">
            Clear All Filters
          </button>
        </div>
      `;
      attachClearBtn();
    }
  });

  attachClearBtn();
}

function attachClearBtn(): void {
  const clearBtn = document.getElementById("clear-filters-btn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      currentFilterState = {
        searchQuery: "",
        category: "all",
        platform: "all",
        pricing: "all",
        status: "all",
        sortBy: "featured",
      };
      const container = document.getElementById("search-filter-container");
      if (container) {
        container.innerHTML = renderSearchFilter(currentFilterState);
      }
      initDirectoryInteractions();
      const grid = document.getElementById("plugin-cards-grid");
      if (grid) {
        grid.innerHTML = getAllPlugins()
          .map((p) => renderPluginCard(p))
          .join("");
      }
    };
  }
}

function applyFilters(plugins: Plugin[], state: FilterState): Plugin[] {
  let result = [...plugins];

  // 1. Text search query
  if (state.searchQuery.trim().length > 0) {
    const q = state.searchQuery.toLowerCase().trim();
    result = result.filter((plugin) => {
      const matchName = plugin.name.toLowerCase().includes(q);
      const matchDesc = plugin.description.toLowerCase().includes(q);
      const matchTags = plugin.tags.some((t) => t.toLowerCase().includes(q));
      const matchCaps = plugin.packs.some((pack) =>
        pack.capabilities.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.operations.some((op) => op.toLowerCase().includes(q))
        )
      );
      const matchPlatforms = plugin.platforms.some((p) => p.platformName.toLowerCase().includes(q));
      return matchName || matchDesc || matchTags || matchCaps || matchPlatforms;
    });
  }

  // 2. Category filter
  if (state.category !== "all") {
    result = result.filter((p) => p.category === state.category);
  }

  // 3. Platform filter
  if (state.platform !== "all") {
    result = result.filter((p) => p.platforms.some((pl) => pl.platformId === state.platform));
  }

  // 4. Pricing filter
  if (state.pricing !== "all") {
    result = result.filter((p) => p.pricing === state.pricing);
  }

  // 5. Status filter
  if (state.status !== "all") {
    result = result.filter((p) => p.status === state.status);
  }

  // 6. Sorting
  if (state.sortBy === "featured") {
    result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  } else if (state.sortBy === "name") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sortBy === "newest") {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return result;
}
