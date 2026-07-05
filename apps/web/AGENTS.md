# REACT ROUTER WEB APP

**Generated**: 2026-07-05  
**Framework**: React Router 7 + Vite  

## OVERVIEW

Web application: React Router 7 frontend with routes, pages, authentication (mocked), and integration with shared-ui components. Entry: `app/root.tsx`, routing: `app/routes.ts`.

## STRUCTURE

```
apps/web/
├── app/
│   ├── root.tsx              # Root layout component (React Router root)
│   ├── routes.ts             # Central route configuration (only home enabled)
│   ├── routes/
│   │   ├── home/
│   │   │   ├── page.tsx       # Home page layout
│   │   │   ├── welcome.tsx    # Welcome section
│   │   │   └── brewing.tsx    # Brewing calculator (625 lines): V60 Basic + Japanese/Iced
│   │   ├── auth/
│   │   │   └── login/
│   │   │       ├── page.tsx   # Login page entry
│   │   │       ├── form.tsx   # LoginForm component
│   │   │       └── action.ts  # loginAction (server action, mocked)
│   │   └── components/
│   │       └── errors/        # Error pages (404, 500)
│   └── [other pages/layouts]
├── tests/                    # Vitest unit + component tests
├── tests-e2e/                # Playwright E2E tests
├── vite.config.ts            # Vite build config
├── playwright.config.ts      # Playwright E2E config
├── vitest.config.ts          # Vitest unit test config
├── tsconfig.json             # TypeScript config
└── package.json              # Scripts: dev, build, test, e2e
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Add route** | `app/routes/` + `app/routes.ts` | Uncomment login first; follow home/ pattern |
| **Edit layout** | `app/root.tsx` | Global layout, Outlet |
| **Authentication** | `app/routes/auth/login/` | form.tsx (UI) + action.ts (mocked handler) |
| **Error handling** | `app/routes/components/errors/` | 404, 500 error boundaries |
| **Pages** | `app/routes/{page}/page.tsx` | Route-specific content |
| **Server actions** | `app/routes/{route}/action.ts` | Form submissions (mocked) |
| **Brewing calculator** | `app/routes/home/brewing.tsx` | Main feature: brew modes, sliders, timer |

## BREWING CALCULATOR (`brewing.tsx`)

Main app feature (625 lines). Coffee brewing calculator with two modes.

### Brew Modes
- **V60 Basic** (amber theme): Classic pour-over, 4:6 method
- **Japanese/Iced** (blue theme): Adds ice-ratio slider (20-60%); `brewingWater`/`iceAmount` calc; extra ice step in timer

### State (useState)
- `dose` (10-30g), `ratio` (12-18), `iceRatio` (20-60, Japanese only)
- `body` (-3 to +3), `roast`, `tasteFocus`, `grind` (dropdowns)
- `mode` (v60 | japanese), timer state (`activeStep`, countdown)

### Calculations (useMemo)
- `brewingWater = dose * ratio` (adjusted by ice ratio for Japanese)
- 4:6 pour phases: bloom + 5 pours based on `brewingWater`
- `iceAmount` (ml) for Japanese mode

### Timer (useEffect + useRef)
- Per-step countdown, auto-advance on completion
- Active step: pulse animation highlight
- Ice step appended to `allSteps` for Japanese mode

### Layout
- Grid: `grid-cols-1 lg:grid-cols-4` (responsive)
- Left col: Brew method toggle → dose → ratio → roast → taste focus → grind → ice ratio (Japanese) → body slider
- Middle col (span-2): Start button → brewing steps + timer → summary card
- Right col: Predicted Profile (sticky `top-4`)

## ROUTING PATTERN

Routes are configured in `app/routes.ts`:
```tsx
export const routes = [
  route("", "routes/home/page.tsx"),    // index
  // route("login", "routes/auth/login/page.tsx"),  // COMMENTED OUT
];
```

To add a route:
1. Create `app/routes/{name}/page.tsx`
2. Uncomment or add `route("{name}", "routes/{name}/page.tsx")` in `routes.ts`

## AUTHENTICATION

**Current**: Mocked in `app/routes/auth/login/action.ts`
- Returns `{ success: true, data: { email, timestamp } }`
- Form: `app/routes/auth/login/form.tsx` (uses `useActionState`)
- Page: `app/routes/auth/login/page.tsx`

**To integrate real auth**:
1. Edit `action.ts`: Replace mock logic with API call / JWT / session
2. Store token in cookie / localStorage (via action)
3. Redirect on success (React Router: `redirect("/")`)

## TESTING

```bash
moon web:test           # Run Vitest unit tests
moon web:e2e            # Run Playwright E2E tests
```

Test files:
- Unit: `tests/pages/home.test.tsx` (Vitest + RTL)
- E2E: `tests-e2e/home.test.ts` (Playwright)
- Setup: `tests/setup-client.ts` (global test config)

## BUILD & DEV

```bash
moon web:dev            # Dev server (Vite, HMR)
moon web:build          # Production build
```
