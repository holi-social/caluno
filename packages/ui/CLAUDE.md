# React component library for use in frontend.

- React components based on shadcn
- Tailwind incl. theming providing by next-themes
- Storybook for viewing and documenting the components

## Commands

- `bun run check-types` - Check for any typescript compile errors
- `bun run dev` - Run storybook dev server
- `bun run build` - Build static storybook files

## Project Structure

src/
├── components        # custom shared components
├── components/base   # shadcn components only
└── styles            # tailwind css files

Co-locate stories with components.

## How to create new UI components

Use shadcn cli to create new UI components, do not create them by yourself. And for every shadcn component added, create a storybook Story.

1. Use: `bunx --bun shadcn@latest add [component name]` to add the component
2. Then use `bunx --bun shadcn@latest add -sy @storybook/[component name]-story` to add the related Story for the component. Answer N to any overwrite prompts.
3. Modify the Story, change import from `import type { Meta, StoryObj } from "@storybook/react-vite";` to `import type { Meta, StoryObj } from "@storybook/react-vite";`
4. Move story file to src/components/base
5. Export component by adding to src/index.ts file

## Styling

`src/styles/default.css` is the primary file for frontends to import. It contains tailwind, theming and custom classes.

- Use OKLCH color space for color definitions
- Prefer shadcn theme colors instead of tailwind base colors
