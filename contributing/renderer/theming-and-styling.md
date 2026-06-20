# Theming and Styling

## Overview

The renderer is styled with [Tailwind CSS v4](https://tailwindcss.com/) and uses [shadcn/ui](https://ui.shadcn.com/) components. Dark, light and system themes are handled by a small hand-rolled `ThemeProvider`. This document covers how to add or restyle a component, where the design tokens live, and how theming is wired.

## UI Components (shadcn/ui)

shadcn/ui components are not installed from a package. They are generated into the repository and then owned and edited like any other source file. They live in [`components/ui/`](../../src/renderer/components/ui/).

The generator is configured in [`components.json`](../../components.json):

- `style: "new-york"`, `baseColor: "zinc"`, `cssVariables: true`
- `iconLibrary: "lucide"` (use [lucide-react](https://lucide.dev/), not other icon sets)
- Import aliases: `components` -> `@renderer/components`, `ui` -> `@renderer/components/ui`, `lib` -> `@renderer/lib`, `utils` -> `@renderer/lib/utils`, `hooks` -> `@renderer/hooks`

To add a new base component, run the shadcn CLI (for example `pnpm dlx shadcn@latest add dialog`), which writes the component into `components/ui/`. After that it is yours to modify.

**Class helpers:**

- `cn(...)` in [`lib/utils.ts`](../../src/renderer/lib/utils.ts) merges class names with `clsx` and `tailwind-merge`. Use it whenever you compose conditional or overridable classes.
- Component variants use [`class-variance-authority`](https://cva.style/) (`cva`), the standard shadcn pattern.

## Tailwind v4

There is no `tailwind.config.*` file. Tailwind v4 is wired through the `@tailwindcss/vite` plugin (see `renderer.plugins` in [`electron.vite.config.ts`](../../electron.vite.config.ts)) and configured entirely inside CSS in [`src/renderer/index.css`](../../src/renderer/index.css):

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *)); /* enables the `dark:` variant from a .dark ancestor */

@theme inline {
  /* maps Tailwind color utilities to the CSS variables below */
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... */
}

:root {
  /* light theme tokens, as oklch() values */
  --background: oklch(1 0 0);
  --primary: oklch(60.9% 0.126 221.723);
  /* ... */
}

.dark {
  /* dark theme overrides for the same tokens */
  --background: oklch(0.141 0.005 285.823);
  /* ... */
}
```

So `bg-background`, `text-primary`, `border-border` and the rest resolve to these variables, and switch automatically when the `.dark` class is present.

**Adding or changing a color:**

1. Declare the CSS variable in both the `:root` and `.dark` blocks of `index.css` (light and dark values).
2. Map it under `@theme inline` (for example `--color-brand: var(--brand)`), which makes `bg-brand`, `text-brand` etc. available.

If you add a variable to only one of `:root` / `.dark`, it will not adapt to the theme.

## Theming (dark / light / system)

Theme switching is a small custom context, not [next-themes](https://github.com/pacocoursey/next-themes). The pieces:

- **[`ThemeProvider`](../../src/renderer/components/theme-provider.tsx)** holds the current `Theme` (`'dark' | 'light' | 'system'`), toggles the `light` / `dark` class on `document.documentElement`, and persists the choice to `localStorage` under the key `client-theme` (the provider's default `storageKey`). For `'system'` it reads `window.matchMedia('(prefers-color-scheme: dark)')` and subscribes to its `change` event, so the UI follows the OS theme live while set to `'system'`. It is mounted at the top of the tree in [`app.tsx`](../../src/renderer/app.tsx) with `defaultTheme="system"`.
- **[`useTheme()`](../../src/renderer/hooks/useTheme.ts)** reads `{ theme, setTheme }` from the provider.
- The System / Light / Dark switcher UI lives in `components/user-dropdown.tsx`.

```tsx
import { useTheme } from '@renderer/hooks/useTheme';

const { theme, setTheme } = useTheme();
setTheme('dark');
```
