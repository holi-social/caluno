# React component library for use in frontend

- React components based on shadcn
- Tailwind incl. theming provided by next-themes
- Storybook for viewing and documenting the components

## Commands
- `bun run check-types` - Check for any typescript compile errors
- `bun run dev` - Run storybook dev server
- `bun run build` - Build static storybook files

## Project Structure
```
src/
├── components        # custom shared components
├── components/base   # shadcn components only
└── styles            # tailwind css files
```
Co-locate stories with components.

## How to create new UI components
Use shadcn cli, do not create them by hand. Every shadcn component gets a Storybook Story.
1. `bunx --bun shadcn@latest add [component name]`
2. `bunx --bun shadcn@latest add -sy @storybook/[component name]-story` — answer N to overwrite prompts
3. Normalise the Story's import to the repo convention every existing story uses: `import type { Meta, StoryObj } from '@storybook/react-vite';`
4. Move story file to `src/components/base`
5. Export the component from `src/index.ts`

## Styling
`src/styles/default.css` is the primary file for frontends to import (tailwind, theming, custom classes).
- Use OKLCH color space for color definitions
- Prefer shadcn theme colors instead of tailwind base colors

## Known constraints

**SVG accessibility** — Biome `a11y/noSvgWithoutTitle` fires on every `<svg>` without either a `<title>` child or `role="img"` + `aria-label`. Use `role="img"` + `aria-label` (not `aria-hidden`) even for brand marks; decorative-but-named is the correct pattern.

**Dark/light icon toggling** — Use CSS class toggling (`dark:hidden` / `hidden dark:inline`) rather than `useTheme`. `useTheme` resolves on the client and causes a hydration flash on the first render; CSS toggling is instant and SSR-safe.

**SVGs in `@repo/ui`** — Inline SVG paths as JSX; do not import `.svg` files. The package is consumed by both Next.js and Storybook (Vite); file-based SVG imports require bundler-specific config that breaks one or the other.
