import "./styles/main.css";
import { handleRoute, navigateTo } from "./router.js";
import { closeConnectionModal } from "./components/connection-modal.js";

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  // Client-side link interception
  document.body.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-link]");
    if (target && target.href) {
      const url = new URL(target.href);
      if (url.origin === window.location.origin) {
        e.preventDefault();
        navigateTo(url.pathname);
      }
    }
  });

  // Browser back/forward history handling
  window.addEventListener("popstate", () => {
    handleRoute();
  });

  // Global keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    // ESC closes open modals
    if (e.key === "Escape") {
      closeConnectionModal();
    }

    // '/' or 'Ctrl+K' / 'Cmd+K' focuses search if on directory page
    if (
      (e.key === "/" &&
        (e.target as HTMLElement).tagName !== "INPUT" &&
        (e.target as HTMLElement).tagName !== "TEXTAREA") ||
      ((e.metaKey || e.ctrlKey) && e.key === "k")
    ) {
      e.preventDefault();
      const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      } else {
        navigateTo("/plugins");
        setTimeout(() => {
          const newSearchInput = document.getElementById("search-input") as HTMLInputElement | null;
          if (newSearchInput) {
            newSearchInput.focus();
          }
        }, 50);
      }
    }
  });

  // Initial render
  handleRoute();
});
