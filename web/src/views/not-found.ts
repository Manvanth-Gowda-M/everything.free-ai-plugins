export function renderNotFoundView(): string {
  return `
    <div class="not-found-page section">
      <div class="container container-narrow text-center" style="padding: var(--space-16) 0;">
        <div class="badge badge-gold mb-4">404 Error</div>
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">Page Not Found</h1>
        <p class="text-lead" style="max-width: 480px; margin: 0 auto 2rem auto;">
          The route you requested does not exist in the Everything.Free directory.
        </p>
        <div class="flex items-center justify-center gap-4">
          <a href="/" class="btn btn-outline" data-link>Home</a>
          <a href="/plugins" class="btn btn-primary" data-link>Browse Plugins</a>
        </div>
      </div>
    </div>
  `;
}
