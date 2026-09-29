import { renderHeader } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { renderHomeView } from "./views/home.js";
import { renderDirectoryView, initDirectoryInteractions } from "./views/directory.js";
import { renderDetailView } from "./views/detail.js";
import { renderCategoryView } from "./views/category.js";
import { renderDocsView } from "./views/docs.js";
import { renderAboutView } from "./views/about.js";
import { renderSubmitView, initSubmitInteractions } from "./views/submit.js";
import { renderNotFoundView } from "./views/not-found.js";
import { attachCopyListeners } from "./components/copy-button.js";
import { openConnectionModal } from "./components/connection-modal.js";
import { getPluginBySlug } from "./registry/plugins.js";

export function navigateTo(url: string): void {
  window.history.pushState(null, "", url);
  handleRoute();
}

export function handleRoute(): void {
  const path = window.location.pathname;
  const app = document.getElementById("app");
  if (!app) return;

  let mainHtml = "";
  let pageTitle = "EVERYTHING.FREE — Free AI Plugin Directory & MCP Hub";

  if (path === "/" || path === "") {
    mainHtml = renderHomeView();
    pageTitle = "EVERYTHING.FREE — Discover. Connect. Use. Free AI Plugins & MCP Apps";
  } else if (path === "/plugins" || path === "/plugins/") {
    mainHtml = renderDirectoryView();
    pageTitle = "AI Plugin Directory | EVERYTHING.FREE";
  } else if (path.startsWith("/plugins/")) {
    const slug = path.replace("/plugins/", "").replace(/\/$/, "");
    const plugin = getPluginBySlug(slug);
    if (plugin) {
      mainHtml = renderDetailView(slug);
      pageTitle = `${plugin.name} | Everything.Free AI Plugins`;
    } else {
      mainHtml = renderNotFoundView();
      pageTitle = "Plugin Not Found | EVERYTHING.FREE";
    }
  } else if (path.startsWith("/categories/")) {
    const category = path.replace("/categories/", "").replace(/\/$/, "");
    mainHtml = renderCategoryView(category);
    pageTitle = `${category.toUpperCase()} AI Plugins | EVERYTHING.FREE`;
  } else if (path === "/docs" || path === "/docs/") {
    mainHtml = renderDocsView();
    pageTitle = "Documentation & Connection Guides | EVERYTHING.FREE";
  } else if (path === "/about" || path === "/about/") {
    mainHtml = renderAboutView();
    pageTitle = "About Everything.Free | Free & Open AI Ecosystem";
  } else if (path === "/submit" || path === "/submit/") {
    mainHtml = renderSubmitView();
    pageTitle = "Submit a Plugin | EVERYTHING.FREE";
  } else {
    mainHtml = renderNotFoundView();
    pageTitle = "404 Not Found | EVERYTHING.FREE";
  }

  document.title = pageTitle;

  app.innerHTML = `
    ${renderHeader(path)}
    <main class="main-content" id="main-view">
      ${mainHtml}
    </main>
    ${renderFooter()}
  `;

  window.scrollTo(0, 0);

  // Initialize interactive views
  if (path === "/plugins" || path === "/plugins/") {
    initDirectoryInteractions();
  } else if (path === "/submit" || path === "/submit/") {
    initSubmitInteractions();
  }

  attachCopyListeners();
  attachGlobalEventListeners();
}

function attachGlobalEventListeners(): void {
  // Connect buttons on plugin cards & detail view
  document.querySelectorAll<HTMLButtonElement>(".open-connect-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const slug = btn.getAttribute("data-plugin-slug");
      const platformId = btn.getAttribute("data-platform-id") || undefined;
      if (slug) {
        const plugin = getPluginBySlug(slug);
        if (plugin) {
          openConnectionModal(plugin, platformId);
        }
      }
    };
  });
}
