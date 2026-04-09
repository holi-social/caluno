# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run check-types` - Check for any typescript compile errors

## Stack

- **TypeScript** with strict mode
- **Tailwind CSS 4** for styling
- **shadcn/ui** component patterns with CVA (Class Variance Authority)
- **Storybook** For documenting and viewing all components

## How to create new UI components

Use shadcn cli to create new UI components, do not create them by yourself. And for every shadcn component added, also create a storybook Story.

1. Use: `bunx --bun shadcn@latest add [component name]` to add the component
2. Then use `bunx --bun shadcn@latest add -sy @storybook/[component name]-story` to add the related Story for the component. Answer N to any overwrite prompts.
3. Modify the Story, change import from `import type { Meta, StoryObj } from "@storybook/react-vite";` to `import type { Meta, StoryObj } from "@storybook/react-vite";`
4. Move story file to src/components/base
5. Export component by adding to src/index.ts file

## Styling

- CSS variables defined in `.src/styles/default.css` for theming
- Dark mode supported via `.dark` class
- Use OKLCH color space for color definitions
- Prefer shadcn theme colors instead of tailwind base colors
