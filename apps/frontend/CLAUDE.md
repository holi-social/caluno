# Clippy Frontend

The front-end web app for securely managing volunteers and shifts in multi-tiered organisations.

## Commands

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Run Biome linting
- `bun run format` - Format code with Biome
- `bun run check-types` - Check for type errors

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
