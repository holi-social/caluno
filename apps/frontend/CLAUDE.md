# Clippy Frontend Web App

The front-end web app for securely managing volunteers and shifts in multi-tiered organisations.

## Commands

- `bun run dev` - Start NextJS development server
- `bun run build` - Build a production bundle
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome
- `bun run check-types` - Check for type errors

## Tech Stack

- **Next.js 16** with App Router (React 19)
- **TypeScript** with strict mode
- **Tailwind CSS 4** for styling
- **Biome** for linting and formatting (not ESLint/Prettier)

## Project Structure

src/
├── app           # NextJS App Router
├── domain        # React Components, hooks, schemas, server actions organised by domain/feature
├── components    # Shared React components, specific to this app and used across domains
├── hooks         # Shared React hooks, specific to this app and are across domains
└── lib           # Shared generic code

## Patterns

- Prefer React Server Components and Server Actions when possible.
- For Forms and valiation use react-hook-form with zod.
- For Server Actions input use next-safe-action with zod.
- Code (components, hooks, actions etc) for a specific domain/feature should go in specific src/domain folders. Not the Shared folders.
- Use `@/*` to import from `src/*` (e.g., `@/domain/shift/actions.ts`).
- Organise Server Actions for a domain into a `actions.ts` file. Example: `src/domain/shift/actions.ts`.
- Organise zod schemas for a domain into a `schemaa.ts` file. Example: `src/domain/shift/schemas.ts`.
- Do not write GraphQL in this project, use `@repo/data` for data access.

### New features

When building new features always study UI/UX patterns in existing similar features before starting a new one. We want to build an app that has a consistent experience across features.

- List pages, follow the pattern in `src/app/(dashboard)/[orgUId]/shifts/page.tsx`
- Detail pages, follow the pattern in `src/app/(dashboard)/[orgUId]/shifts/[shiftId]/page.tsx`
- Create or edit pages, use `clippy-sheet` and follow the pattern in `src/components/sheets/shift-sheet.tsx`

