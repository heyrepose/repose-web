# repose-web

Next.js marketplace frontend for Repose (UAE pre-loved fashion).

> Specs: workspace-root `documentation/` (especially `04-WEB-FRONTEND.md`, `03-API-REFERENCE.md`).  
> API lives in the separate **`repose-server`** repo — this app only speaks HTTP/OpenAPI to it.

## Setup

```bash
cp .env.local.example .env.local
# Point NEXT_PUBLIC_API_BASE_URL at the running API (default http://localhost:4000/api/v1)
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
