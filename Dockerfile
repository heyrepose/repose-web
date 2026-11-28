# =============================================================================
# repose-web — Next.js 14 App Router  (pnpm workspace · Node 20 LTS)
# =============================================================================
# pnpm workspace layout:
#   packages/ui        – design tokens, condition badges
#   packages/api-types – shared contract enums/shapes
#
# Build stages
#   base     – Node 20 Alpine + pnpm
#   deps     – install workspace deps once
#   dev      – hot-reload (source bind-mounted at runtime)
#   builder  – next build with standalone output
#   prod     – minimal runtime from .next/standalone
#
# NOTE: Next.js bakes env vars into the client bundle at build time.
#   Pass API_BASE_URL / SOCKET_URL / SITE_URL as --build-arg for prod images.
#   In dev the values come from the compose `environment` block at runtime.
#
# Usage
#   Dev   : docker compose up web          (target=dev, default in compose)
#   Prod  : docker build --target prod \
#             --build-arg API_BASE_URL=https://api.example.com/api/v1 \
#             -t repose-web .
# =============================================================================

ARG NODE_VERSION=20-alpine

# ── Base: Node + pnpm ─────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base

RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# ── Deps: install workspace deps once ─────────────────────────────────────────
FROM base AS deps

# Copy workspace manifests — layer is cached until any package.json changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui/package.json          ./packages/ui/
COPY packages/api-types/package.json   ./packages/api-types/

RUN pnpm install --frozen-lockfile

# ── Dev: hot-reload (source mounted by docker-compose) ───────────────────────
FROM deps AS dev

ENV NODE_ENV=development
EXPOSE 4001

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "dev"]

# ── Builder: compile Next.js app ──────────────────────────────────────────────
FROM deps AS builder

# Build-time env vars — Next.js inlines these into the client bundle
ARG API_BASE_URL=http://localhost:4000/api/v1
ARG SOCKET_URL=http://localhost:4000
ARG SITE_URL=http://localhost:4001
ARG GOOGLE_CLIENT_ID=""
ARG STRIPE_PUBLISHABLE_KEY=""

ENV API_BASE_URL=${API_BASE_URL}
ENV SOCKET_URL=${SOCKET_URL}
ENV SITE_URL=${SITE_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
ENV NEXT_TELEMETRY_DISABLED=1
# Activate standalone output mode (gated in next.config.mjs on this var)
ENV NEXT_OUTPUT=standalone

# Copy full source on top of installed deps
COPY . .

RUN pnpm build

# ── Prod: minimal standalone runtime ─────────────────────────────────────────
FROM node:${NODE_VERSION} AS prod

RUN apk add --no-cache dumb-init

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# .next/standalone bundles server + node_modules; copy static assets alongside
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static     ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public           ./public

USER appuser
EXPOSE 4001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
