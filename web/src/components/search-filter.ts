import {
  FilterState,
  CategoryId,
  PlatformId,
  PricingModel,
  PluginStatus,
} from "../types/plugin.js";
import { CATEGORIES } from "../registry/categories.js";
import { PLATFORMS } from "../registry/platforms.js";

export function renderSearchFilter(filterState: FilterState): string {
  const categoryOptions = [
    '<option value="all">All Categories</option>',
    ...CATEGORIES.map(
      (c) =>
        `<option value="${c.id}" ${filterState.category === c.id ? "selected" : ""}>${c.name}</option>`
    ),
  ].join("");

  const platformOptions = [
    '<option value="all">All Platforms</option>',
    ...PLATFORMS.map(
      (p) =>
        `<option value="${p.id}" ${filterState.platform === p.id ? "selected" : ""}>${p.name}</option>`
    ),
  ].join("");

  return `
    <section class="search-filter-section mb-8" aria-label="Plugin Search and Filters">
      <div style="background-color: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm);">
        <!-- Top row: Search input & Sorting -->
        <div class="grid grid-cols-3 gap-4 mb-4" style="grid-template-columns: 2fr 1fr;">
          <div style="position: relative;">
            <input 
              type="text" 
              id="search-input" 
              class="input" 
              placeholder="Search plugins by name, capabilities (e.g. JSON, SQL, JWT, regex), or tags..." 
              value="${escapeAttr(filterState.searchQuery)}"
              aria-label="Search plugins"
              style="padding-left: 2.75rem; height: 48px; font-size: 0.975rem;"
            />
            <div style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          <div class="flex gap-2">
            <select id="sort-select" class="select" style="height: 48px;" aria-label="Sort plugins">
              <option value="featured" ${filterState.sortBy === "featured" ? "selected" : ""}>Featured First</option>
              <option value="name" ${filterState.sortBy === "name" ? "selected" : ""}>Name (A–Z)</option>
              <option value="newest" ${filterState.sortBy === "newest" ? "selected" : ""}>Newest First</option>
            </select>
          </div>
        </div>

        <!-- Filter Selectors row -->
        <div class="grid grid-cols-4 gap-3">
          <div>
            <select id="category-filter" class="select" aria-label="Filter by category">
              ${categoryOptions}
            </select>
          </div>

          <div>
            <select id="platform-filter" class="select" aria-label="Filter by platform">
              ${platformOptions}
            </select>
          </div>

          <div>
            <select id="pricing-filter" class="select" aria-label="Filter by pricing">
              <option value="all" ${filterState.pricing === "all" ? "selected" : ""}>All Pricing</option>
              <option value="free" ${filterState.pricing === "free" ? "selected" : ""}>100% Free</option>
              <option value="open_source" ${filterState.pricing === "open_source" ? "selected" : ""}>Open Source</option>
            </select>
          </div>

          <div>
            <select id="status-filter" class="select" aria-label="Filter by status">
              <option value="all" ${filterState.status === "all" ? "selected" : ""}>All Statuses</option>
              <option value="available" ${filterState.status === "available" ? "selected" : ""}>Available Now</option>
              <option value="coming_soon" ${filterState.status === "coming_soon" ? "selected" : ""}>Roadmap / Soon</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  `;
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function attachFilterListeners(
  filterState: FilterState,
  onFilterChange: (newState: FilterState) => void
): void {
  const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
  const sortSelect = document.getElementById("sort-select") as HTMLSelectElement | null;
  const categoryFilter = document.getElementById("category-filter") as HTMLSelectElement | null;
  const platformFilter = document.getElementById("platform-filter") as HTMLSelectElement | null;
  const pricingFilter = document.getElementById("pricing-filter") as HTMLSelectElement | null;
  const statusFilter = document.getElementById("status-filter") as HTMLSelectElement | null;

  if (searchInput) {
    let timeout: NodeJS.Timeout | number;
    searchInput.oninput = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        filterState.searchQuery = searchInput.value;
        onFilterChange(filterState);
      }, 150);
    };
  }

  if (sortSelect) {
    sortSelect.onchange = () => {
      filterState.sortBy = sortSelect.value as FilterState["sortBy"];
      onFilterChange(filterState);
    };
  }

  if (categoryFilter) {
    categoryFilter.onchange = () => {
      filterState.category = categoryFilter.value as CategoryId | "all";
      onFilterChange(filterState);
    };
  }

  if (platformFilter) {
    platformFilter.onchange = () => {
      filterState.platform = platformFilter.value as PlatformId | "all";
      onFilterChange(filterState);
    };
  }

  if (pricingFilter) {
    pricingFilter.onchange = () => {
      filterState.pricing = pricingFilter.value as PricingModel | "all";
      onFilterChange(filterState);
    };
  }

  if (statusFilter) {
    statusFilter.onchange = () => {
      filterState.status = statusFilter.value as PluginStatus | "all";
      onFilterChange(filterState);
    };
  }
}
