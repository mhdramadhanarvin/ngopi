# PROJECT KNOWLEDGE BASE

**Generated**: 2026-07-05  
**Commit**: bc9b580 feat: initial app  
**Branch**: main  

## OVERVIEW

pnpm monorepo (myorg) orchestrated by Moon. React Router 7 web app + shadcn/ui component library. Stack: React 19, Tailwind 4, Vite 7, TypeScript 5.8, Biome 2.2.5 (lint/format).

## STRUCTURE

```
.
├── apps/web/              # React Router app (24 TS/TSX files)
│   ├── app/               # Routes, pages, root component
│   ├── tests/             # Unit tests (Vitest)
│   ├── tests-e2e/         # E2E tests (Playwright)
│   └── configs/           # vite, tsconfig, playwright, wrangler
├── packages/shared-ui/    # UI library (153 files, 48 shadcn components)
│   ├── src/components/    # 48 component directories (shadcn/ui)
│   ├── src/hooks/         # use-media-query, use-mobile
│   ├── src/theme.tsx      # Tailwind config exports
│   ├── src/stores.ts      # Global state
│   ├── src/utils.ts       # Utilities
│   └── .storybook/        # Storybook 8.6 component docs
├── docker/                # Docker Compose services (ClickHouse, PG, Redis, Mailpit, Minio, Nginx)
├── .moon/                 # Moon workspace config + cache/schemas
└── Root configs           # biome.json, package.json, pnpm-workspace.yaml, compose.yaml
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Add UI component** | `packages/shared-ui/src/components/` | Copy shadcn pattern; index.tsx + component.tsx |
| **Add app route** | `apps/web/app/routes/` | Uncomment login in routes.ts first (currently commented) |
| **Style/theme** | `packages/shared-ui/src/theme.tsx` | Tailwind Variants (TV) + tailwindcss-motion |
| **Authentication** | `apps/web/app/routes/auth/login/` | form.tsx (UI) + action.ts (handler, currently mocked) |
| **Brewing calculator** | `apps/web/app/routes/home/brewing.tsx` | V60 Basic + Japanese/Iced modes; timer, sliders, 4:6 pour calc |
| **Global state** | `packages/shared-ui/src/stores.ts` | Central store (Zustand or similar) |
| **Build config** | `.moon/workspace.yml` + `apps/web/vite.config.ts` | Moon orchestrates; Vite handles builds |
| **Format/lint** | Root `biome.json` | Biome 2.2.5 with custom a11y/security/style rules |
| **Docker compose** | `compose.yaml` | Services: ClickHouse, PostgreSQL, Redis, Mailpit, Minio, Nginx |

## CONVENTIONS

- **Component export**: Each shadcn component exports from `index.tsx` (re-export pattern)
- **Tailwind Variants**: Use `tv()` + `clsx`/`cn()` for class composition
- **File naming**: kebab-case directories, PascalCase components
- **Formatter**: Biome (JS indent 2, JSON indent 4, line width 100)
- **TypeScript**: Strict mode, `useImportType` disabled (style: auto)
- **Monorepo**: pnpm workspaces, Moon tasks (format, lint, check, typecheck, test, e2e)
- **Pre-commit hooks**: format affected, lint staged (via Moon)

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** import from deep paths in shared-ui (e.g., `@repo/shared-ui/dist/components/button`). Use barrel exports: `@repo/shared-ui/components`.
- **DO NOT** suppress TypeScript errors with `as any` or `@ts-ignore`.
- **DO NOT** add `noUnusedImports` fix or `noUnusedVariables` fix (Biome config: `"fix": "none"`).
- **DO NOT** use array index as React key (noArrayIndexKey: warn).
- **DO NOT** commit with formatter/linter violations (pre-commit hooks enforce).

## BUILD & DEVELOPMENT COMMANDS

```bash
# Setup
pnpm install
moon setup

# Development
moon :dev              # Run all dev tasks
moon web:dev           # Web app dev server (Vite)
moon shared-ui:build   # Shared UI build

# Quality
moon :lint             # Lint all workspaces
moon :check            # Type-check all
moon :typecheck        # TypeScript check
moon :format           # Format all (Biome)
pnpm run format        # Format (shorthand)

# Testing
moon :test             # Unit tests (Vitest)
moon :e2e              # E2E tests (Playwright)

# Docker
pnpm run compose:up           # Start services
pnpm run compose:down         # Stop services
pnpm run compose:instrumented # Start with observability

# Cleanup
pnpm run cleanup       # Clean build artifacts
pnpm run cleanup:deps  # Remove pnpm-lock + node_modules
pnpm run cleanup:cache # Remove Moon cache
```

## NOTES

- **Login route commented**: `apps/web/app/routes.ts` has login route commented out—uncomment to enable.
- **Auth mocked**: `loginAction` (auth/login/action.ts) returns mock success; integrate real auth via API.
- **Brewing calculator**: `apps/web/app/routes/home/brewing.tsx` (625 lines). V60 Basic (amber) + Japanese/Iced (blue) modes. Timer with auto-advance, 4:6 pour method, ice ratio adjustment for Japanese mode. Responsive grid (1 col mobile → 4 col desktop).
- **Storybook**: Run `moon shared-ui:storybook` to view component library interactively.
- **Moon caching**: Large .moon/cache directory—use `pnpm run cleanup:cache` if needed.
- **Docker profiles**: Optional instrumentation stack available via `--profile instrumented`.

## KEY ENTRY POINTS

- **App root**: `apps/web/app/root.tsx`
- **Routes config**: `apps/web/app/routes.ts`
- **UI library exports**: `packages/shared-ui/src/index.ts` (components, hooks, theme, utils)
- **Shared state**: `packages/shared-ui/src/stores.ts`
