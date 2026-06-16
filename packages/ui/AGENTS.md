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
