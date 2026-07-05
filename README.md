# ngopi.mdhn.my.id

Precision coffee brewing calculator for V60 + Japanese/Iced coffee methods. Real-time timer with AI-powered taste predictions.

## Quick Start

```bash
pnpm install
moon run web:dev      # Dev server @ http://localhost:3000
moon run web:build    # Production build → apps/web/build/client
```

## Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS 4, Vite 7
- **UI**: shadcn/ui (48 components), Radix UI primitives
- **Tooling**: TypeScript 5.8, Biome 2.2.5 (lint/format), Moon orchestration
- **Testing**: Vitest (unit), Playwright (e2e)
- **Docs**: Storybook 8.6 (shared-ui components)
- **Deployment**: Cloudflare Workers (static assets, custom domain via `wrangler.jsonc`)
- **Backend Services**: Docker Compose (PostgreSQL, Redis, ClickHouse, Mailpit, Minio, Nginx)

## Features

### Brew Modes
- **V60 Basic** (amber): Classic pour-over with 4:6 method
- **Japanese/Iced** (blue): Iced coffee with adjustable ice ratio (20-60%)

### Brew Controls
| Control | Range | Purpose |
|---------|-------|---------|
| Coffee Dose | 10–30g | Base amount |
| Brew Ratio | 1:12–1:18 | Coffee-to-water ratio |
| Ice Ratio | 20–60% | (Japanese mode only) |
| Body | −3 to +3 | Taste balance (light ↔ bold) |
| Roast Level | Light → Dark | Bean profile |
| Taste Focus | Sweetness ↔ Acidity | Flavor emphasis |
| Grind Size | Coarse → Fine | Extraction control |

### Smart Features
- **Live Timer**: Countdown per brew step with auto-advance
- **4:6 Pour Method**: Calculates water amounts for each bloom/pour phase
- **Predicted Profile**: AI taste predictions based on parameters
- **Responsive UI**: Mobile (1 col) → Desktop (4 col grid)

## Workspace Structure

```
.
├── apps/web/              # React Router 7 app (625 lines: brewing.tsx)
│   ├── app/routes/        # Route files + layouts
│   ├── tests/             # Vitest unit tests
│   └── tests-e2e/         # Playwright E2E tests
├── packages/shared-ui/    # Component library (48 shadcn components)
│   ├── src/components/    # Radix UI + Tailwind Variants
│   ├── src/hooks/         # Utilities (useMediaQuery, useMobile)
│   └── .storybook/        # Component docs
├── docker/                # Docker Compose services
└── .moon/                 # Workspace orchestration
```

## Development

### Commands

```bash
# Format & Lint
pnpm run format           # Biome format all files
moon :lint                # Lint all workspaces
moon :typecheck           # TypeScript type-check

# Testing
moon :test                # Vitest unit tests
moon :e2e                 # Playwright E2E tests

# Build
moon :build               # Build all workspaces

# Docker
pnpm run compose:up       # Start ClickHouse, PG, Redis, Mailpit, Minio, Nginx
pnpm run compose:down     # Stop services

# Cleanup
pnpm run cleanup          # Remove build artifacts
pnpm run cleanup:cache    # Purge Moon cache
```

### Conventions

- **Components**: Copy shadcn pattern (index.tsx re-export + component.tsx)
- **Imports**: Use barrel exports `@repo/shared-ui/components`—avoid deep paths
- **Tailwind**: Use `tv()` (Tailwind Variants) + `cn()` for class composition
- **TypeScript**: Strict mode; no `as any` or `@ts-ignore`
- **Formatting**: Biome (2-space JS, 100 char line width)

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/app/routes/home/brewing.tsx` | Main brewing calculator (625 lines) |
| `apps/web/app/root.tsx` | Global layout + theme |
| `packages/shared-ui/src/theme.tsx` | Tailwind config + color exports |
| `packages/shared-ui/src/stores.ts` | Global state (Zustand) |
| `.moon/workspace.yml` | Task orchestration |
| `biome.json` | Linter + formatter config |
| `wrangler.jsonc` | Cloudflare Workers deployment config |

## Deployment

The app deploys as a **Cloudflare Workers static site** with a custom domain (`ngopi.mdhn.my.id`).

### Deploy Commands

```bash
pnpm run deploy-wrangler   # Build + deploy (wrangler deploy)
```

### How It Works

1. `moon :build` → builds React Router app → static assets into `apps/web/build/client`
2. `wrangler deploy` → serves `apps/web/build/client` as static assets on Cloudflare Workers
3. Custom domain (`ngopi.mdhn.my.id`) configured in `wrangler.jsonc`

### Prerequisites

- `wrangler` installed: `npm install -D wrangler`
- Authenticated with Cloudflare: `wrangler login`
- Domain `mdhn.my.id` must be managed in your Cloudflare account

### First Deploy

```bash
pnpm run build && pnpm run deploy-wrangler
```

### Viewing Logs

```bash
wrangler tail
```

## See Also

- [AGENTS.md](./AGENTS.md) — Project knowledge base
- [apps/web/AGENTS.md](./apps/web/AGENTS.md) — React Router specifics
- [packages/shared-ui/AGENTS.md](./packages/shared-ui/AGENTS.md) — Component library
