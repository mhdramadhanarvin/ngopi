# Shared UI Library

This is a shared UI library, a comprehensive collection of React components built with
modern web development best practices. Under the hood, it uses Tailwind CSS, Radix UI,
and TypeScript to deliver accessible, type-safe, and customizable components.

The UI components leverage [shadcn/ui](https://ui.shadcn.com/) as their foundation,
enhanced with custom modifications. The notable distinction lies in the styling
implementation, which utilizes [Tailwind Variants](https://www.tailwind-variants.org/)
for a more flexible approach and [tailwindcss-motion](https://rombo.co/tailwind) for
animations and transitions effects.

## Enabling the package

Add the following to your `package.json` file:

```json
{
    "dependencies": {
        "@repo/shared-ui": "workspace:*"
    },
    "devDependencies": {
        "@tailwindcss/vite": "^4.1.4",
        "tailwind-variants": "^1.0.0",
        "tailwindcss-motion": "^1.1.0",
        "tailwindcss": "^4.1.4",
    }
}
```

Add the following to your `tsconfig.json` file:

```json
{
    "references": [{ "path": "../../packages/shared-ui" }]
}
```

Exclude internal packages from optimization, add the following to your `vite.config.ts` file:

```ts
export default defineConfig({
  // ...
  optimizeDeps: {
    // Do not optimize internal workspace dependencies.
    exclude: ['@repo/shared-ui'],
  },
})
```

Add `shared-ui` source list to `global.css`:

```css
@source "../../../../packages/shared-ui/**/*.{ts,tsx}";
```

Finally, add the following to your `moon.yml` file:

```yaml
dependsOn:
  - 'shared-ui'
```

## Available Components

48 shadcn/ui components with Tailwind Variants styling:

**Layout**: Accordion, Card, Separator, Tabs
**Form**: Button, Input, Label, Select, Slider, Switch, Checkbox, Radio Group
**Display**: Badge, Avatar, Progress, Skeleton, Calendar, Carousel
**Feedback**: Alert, Alert Dialog, Dialog, Toast, Tooltip, Popover
**Data**: Table, Data Table, Command, Dropdown Menu, Context Menu
**Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination, Sidebar

See [AGENTS.md](./AGENTS.md) for complete component list.

## Usage Examples

### Import Components

```tsx
import { Button, Card, Slider } from '@repo/shared-ui/components';
import { useMobile } from '@repo/shared-ui/hooks';
import { cn } from '@repo/shared-ui/utils';
```

### Basic Usage

```tsx
import { Button } from '@repo/shared-ui/components';

export function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Click me
    </Button>
  );
}
```

### With Tailwind Variants

```tsx
import { Card } from '@repo/shared-ui/components';
import { cn } from '@repo/shared-ui/utils';

export function MyCard() {
  return (
    <Card className={cn("p-4", "hover:shadow-lg")}>
      Content
    </Card>
  );
}
```

## Real-World Usage

This library is used extensively in the brewing calculator (`apps/web`):
- **Button**: Mode toggle, start timer
- **Card**: Brew summary, predicted profile
- **Slider**: Dose, ratio, body controls
- **Select**: Roast level, taste focus, grind size
- **Tabs**: V60 Basic vs Japanese/Iced modes
- **Label**: Control labels

## Development

View components interactively with Storybook:

```bash
moon shared-ui:storybook    # Start Storybook dev server
moon shared-ui:build        # Build library for production
```

## See Also

- [AGENTS.md](./AGENTS.md) — Component structure & conventions
- [Storybook](./.storybook/) — Interactive component documentation
- [shadcn/ui](https://ui.shadcn.com/) — Component foundation
- [Tailwind Variants](https://www.tailwind-variants.org/) — Styling approach
