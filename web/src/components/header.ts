export function renderHeader(currentPath: string): string {
  const isPluginsActive = currentPath.startsWith("/plugins") ? "active" : "";
  const isDocsActive = currentPath.startsWith("/docs") ? "active" : "";
  const isAboutActive = currentPath === "/about" ? "active" : "";
  const isSubmitActive = currentPath === "/submit" ? "active" : "";

  return `
    <header class="navbar" role="banner">
      <div class="container">
        <div class="navbar-inner">
          <a href="/" class="brand-logo" data-link aria-label="Everything.Free Homepage">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#12131C"/>
              <rect x="0.5" y="0.5" width="31" height="31" rx="5.5" stroke="#282D42"/>
              <path d="M7 9H25M7 16H21M7 23H25" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="24" cy="16" r="2.5" fill="#0FAF78"/>
            </svg>
            <span>EVERYTHING<span class="gold">.FREE</span></span>
          </a>

          <nav class="nav-links" role="navigation" aria-label="Main Navigation">
            <a href="/plugins" class="nav-link ${isPluginsActive}" data-link>Directory</a>
            <a href="/docs" class="nav-link ${isDocsActive}" data-link>Docs</a>
            <a href="/about" class="nav-link ${isAboutActive}" data-link>About</a>
            <a href="/submit" class="nav-link ${isSubmitActive}" data-link>Submit Plugin</a>
          </nav>

          <div class="nav-actions">
            <a 
              href="https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-sm btn-outline"
              aria-label="View Everything.Free GitHub Repository"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
            <a href="/plugins" class="btn btn-sm btn-primary" data-link>
              Explore Plugins
            </a>
          </div>
        </div>
      </div>
    </header>
  `;
}
