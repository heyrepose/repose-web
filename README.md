# repose-web

Next.js marketplace frontend for Repose (UAE pre-loved fashion).

> Specs: workspace-root `documentation/` (especially `04-WEB-FRONTEND.md`, `03-API-REFERENCE.md`).  
> API lives in the separate **`repose-server`** repo — this app only speaks HTTP/OpenAPI to it.

## Setup

```bash
# Create/edit a single env file at the repo root: `.env`
# Keys: API_BASE_URL, SOCKET_URL, SITE_URL, GOOGLE_CLIENT_ID (optional)
# (payment is a redirect to Stripe-hosted Checkout — no Stripe key in the web app)
# (no NEXT_PUBLIC_ prefix — same names on Vercel Environment Variables)
pnpm install
pnpm dev
```

- Web: http://localhost:4001
- Requires `repose-server` running on :4000 for live data

## Packages (local workspace)

- `packages/ui` — design tokens + condition badge mapping (strict 6-color palette)
- `packages/api-types` — shared TS contract enums/shapes; regenerate from server OpenAPI when available

## Brand

Exactly: `#264A2E`, `#F3EBDE`, `#FFFFFF`, `#000000`, `#D6E4DA`, `#888888`. No purple/blue/red accents.
