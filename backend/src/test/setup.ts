// Preloaded by bunfig.toml before any test runs. The values are dummy but valid:
// DATABASE_URL must be a URL (lib/env.ts) and neon() needs a connection string,
// but no test ever connects — every DB call is stubbed. `??=` leaves a real
// environment (e.g. CI secrets) untouched if one is already set.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.BETTER_AUTH_SECRET ??= 'test-secret-key-at-least-32-characters-long'
process.env.BETTER_AUTH_URL ??= 'http://localhost:3000'
process.env.FRONTEND_URL ??= 'http://localhost:5173'
