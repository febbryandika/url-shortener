// Standalone HTML screens for the public redirect route (SPEC §10). Served by
// GET /r/:slug on 404/410 — the short link lives on the backend origin, so the
// React SPA can never render these; each page must stand alone (no app CSS/JS).
// Styling mirrors the app's light-theme tokens (frontend/src/index.css).
//
// All content is static text we control — no request data is interpolated (the
// slug is never echoed), so there is no XSS surface (web-security).

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

type PageContent = {
  title: string
  heading: string
  message: string
}

function renderPage({ title, heading, message }: PageContent): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} · URL Shortener</title>
<style>
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --radius: 0.5rem;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: hsl(var(--background));
    color: hsl(var(--foreground));
  }
  main {
    width: 100%;
    max-width: 28rem;
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    padding: 2.5rem 2rem;
    text-align: center;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-weight: 600;
  }
  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius);
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }
  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }
  p {
    max-width: 24rem;
    margin: 0 auto;
    color: hsl(var(--muted-foreground));
  }
  .home-link {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
  }
</style>
</head>
<body>
<main>
  <span class="brand">
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
        <path d="M8 12h8" />
      </svg>
    </span>
    <span>URL Shortener</span>
  </span>
  <h1>${heading}</h1>
  <p>${message}</p>
  <a class="home-link" href="${frontendUrl}">Go to URL Shortener</a>
</main>
</body>
</html>`
}

export function notFoundPage(): string {
  return renderPage({
    title: 'Link not found',
    heading: 'Link not found',
    message:
      'This short link does not exist. It may have been mistyped or removed by its owner.',
  })
}

export function expiredPage(): string {
  return renderPage({
    title: 'Link expired',
    heading: 'This link has expired',
    message: 'The owner set this short link to expire. It is no longer active.',
  })
}
