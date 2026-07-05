# SHARED UI LIBRARY

**Generated**: 2026-07-05  
**Package**: @repo/shared-ui  

## OVERVIEW

Shared UI library: 48 shadcn/ui components + 3 hooks + Tailwind Variants theme system. Exported via barrel patterns (`@repo/shared-ui/components`, `@repo/shared-ui/hooks`, `@repo/shared-ui/theme`). Used extensively in apps/web brewing calculator (Button, Card, Slider, Select, Tabs, Label).

## STRUCTURE

```
packages/shared-ui/
├── src/
│   ├── components/      # 48 shadcn components (accordion, button, card, form, etc.)
│   ├── hooks/           # use-media-query, use-mobile, custom hooks
│   ├── theme.tsx        # Tailwind config + TV utilities exported
│   ├── stores.ts        # Global state (Zustand)
│   ├── utils.ts         # Shared utilities (cn, classnames helpers)
│   └── index.ts         # Barrel exports (components, hooks, theme, utils)
├── .storybook/          # Storybook 8.6 component documentation
├── vite.config.ts       # Vite build for library
├── tsconfig.json        # TypeScript config
└── package.json         # Exports: ./components, ./hooks, ./theme, ./utils, ./stores
```

## COMPONENT PATTERN

Each shadcn component follows this structure:
```
components/{component-name}/
├── {component-name}.tsx     # Main component (exported)
├── {component-name}.css.ts  # Styles (Tailwind Variants)
├── index.tsx                # Re-export (barrel)
└── [types.ts]               # Optional: shared types
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Add component** | `src/components/{new-name}/` | Copy button/ pattern; add .tsx, .css.ts, index.tsx |
| **Edit theme** | `src/theme.tsx` | Tailwind config exports + TV utilities |
| **Add hook** | `src/hooks/` | use-mobile pattern: export from index.ts |
| **Export new** | `src/index.ts` | Barrel export (components, hooks, theme, utils) |
| **View interactive** | `.storybook/` | Run `moon shared-ui:storybook` |

## CONVENTIONS

- **Export pattern**: Component in `component.tsx`, re-export via `index.tsx`
- **Styling**: Tailwind Variants (`tv()`) + `cn()` for composition
- **Type safety**: All components accept `className?: string` + style variant props
- **Icon library**: Lucide React (lucide-react imports)
- **Radix UI**: Headless components (Radix Dialog, Dropdown, etc.)

## ANTI-PATTERNS

- **DO NOT** import deeply: use `@repo/shared-ui/components` not `@repo/shared-ui/dist/components/button`
- **DO NOT** re-export internal types: only export user-facing interfaces
- **DO NOT** add color hardcodes: use Tailwind theme values

## BUILD & PREVIEW

```bash
moon shared-ui:build       # Build library
moon shared-ui:storybook   # Start Storybook
```
