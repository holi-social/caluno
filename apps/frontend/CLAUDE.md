# Clippy Frontend

The front-end web app for securely managing volunteers and shifts in multi-tiered organisations.

## Commands

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Run Biome linting
- `bun run format` - Format code with Biome

## Tech Stack

- **Next.js 16** with App Router (React 19)
- **TypeScript** with strict mode
- **Tailwind CSS 4** for styling
- **Biome** for linting and formatting (not ESLint/Prettier)

## New features

When building new features always study UI/UX patterns in existing similar features before starting a new one. We want to build an app that has a consistent experience across features.

- List pages, follow the pattern in `src/app/(dashboard)/[orgUId]/shifts/page.tsx`
- Detail pages, follow the pattern in `src/app/(dashboard)/[orgUId]/shifts/[shiftId]/page.tsx`
- Create or edit pages, use a Sheet and follow the pattern in `src/components/sheets/shift-sheet.tsx`

### Path Aliases
Use `@/*` to import from `src/*` (e.g., `@/lib/something`).

### Component Patterns - Library
UI components live in `packages/ui/` and follow shadcn/ui conventions:
- It must be installed in package json to be used (e.g "@repo/ui": "*")
- Use CVA for variant definitions
- Use the `cn()` utility from `@repo/ui/lib/utils` to merge Tailwind classes
- Components accept `className` prop for customization via `Slot` pattern
- DO NOT code manual components in the library always start from generating the components using shadcn cli, see below

### How to create new UI components
Use shadcn cli to create new UI components, do not create them by yourself.
- you can use: bunx --bun shadcn@latest add [component name]

### Styling
- CSS variables defined in `@repo/ui/styles/default.css` for theming
- Dark mode supported via `.dark` class
- Use OKLCH color space for color definitions
- Prefer shadcn theme colors instead of tailwind base colors as they are themed
