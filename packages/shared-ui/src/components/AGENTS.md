# COMPONENT LIBRARY PATTERNS

**Generated**: 2026-07-05  
**Core**: 48 shadcn/ui components + Tailwind Variants  

## OVERVIEW

Repository of reusable UI components built on Radix UI + Tailwind CSS + Lucide icons. Each component is self-contained and exported via barrel pattern.

## COMPONENT DIRECTORY STRUCTURE

```
components/
├── accordion/           # Expandable sections
├── button/              # Base button (variants: primary, secondary, outline, ghost)
├── card/                # Container + sections (Card, CardHeader, CardTitle, CardContent, CardFooter)
├── dialog/              # Modal dialog (Alert, Confirmation)
├── dropdown-menu/       # Menu trigger with dropdown
├── form/                # Form wrapper + field/label/message helpers
├── input/               # Text input (password, email, etc.)
├── select/              # Dropdown select
├── tabs/                # Tab navigation
├── table/               # Data table (header, body, footer cells)
├── toast/               # Toast notifications
├── sidebar/             # Navigation sidebar (complex: 9 files)
└── [43 more...]
```

## COMPONENT ANATOMY

Each component follows this exact pattern:

**component-name.tsx**: Main component export
- Accepts `className?: string` + variant props
- Uses `React.forwardRef` for ref forwarding
- Composed with Radix UI primitives

**component-name.css.ts**: Tailwind Variants
- Uses `tv()` from tailwind-variants
- Defines `variant`, `size`, `state` props
- Exports `styles = tv({ base: "...", variants: { ... } })`

**index.tsx**: Barrel re-export
```tsx
export * from "./component-name";
export type * from "./component-name";
```

## STYLING PATTERN

All components use Tailwind Variants (TV):

```tsx
const buttonStyles = tv({
  base: "inline-flex items-center justify-center font-medium ...",
  variants: {
    variant: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-black hover:bg-gray-300",
    },
    size: {
      sm: "px-2 py-1 text-sm",
      md: "px-4 py-2 text-base",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Copy new component** | Any existing (e.g., `button/`) | Template: .tsx + .css.ts + index.tsx |
| **Add variant** | `{component}/{component}.css.ts` | Extend `tv()` variants object |
| **Complex components** | `sidebar/` (9 files), `form/` (5 files) | Multiple related exports |
| **Icons** | Any .tsx | Import from `lucide-react` |

## CONVENTIONS

- **Naming**: kebab-case directories, PascalCase components
- **Props**: Extend HTML element type (e.g., `React.ButtonHTMLAttributes<HTMLButtonElement>`)
- **Ref**: Always use `React.forwardRef` + forward to DOM node
- **Variants**: Define via Tailwind Variants `tv()`, never inline classNames
- **No hardcoded colors**: Use Tailwind theme values (bg-blue-600, text-gray-700, etc.)

## ANTI-PATTERNS

- **DO NOT** use `className="bg-red-500"` inline—use `tv()` variants
- **DO NOT** rename component files (breaks imports across monorepo)
- **DO NOT** add component-specific hooks (move to `/hooks/` instead)
- **DO NOT** export types without re-export from `index.tsx`

## VERIFY COMPONENT

```bash
# Type-check
moon :typecheck

# View in Storybook
moon shared-ui:storybook
```
