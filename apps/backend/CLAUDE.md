# Clippy Backend GraphQL API

The backend api for securely managing volunteers and shifts in multi-tiered organisations.

## Commands

- `bun run dev` - Start NestJS development server
- `bun run build` - Build a production bundle
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome
- `bun run check-types` - Check for type errors
- `bun test:e2e` - Tests the GraphQL api
- `bun run db:generate` - Generate database migrations based on schema changes
- `bun run db:migrate` - Run drizzle database migrations


## Tech Stack

- **NestJS 11** primary web framework
- **TypeScript** with strict mode
- **GraphQL** Apollo Server using Code-First approach
- **Drizzle ORM** for database management (PostgreSQL)
- **Better Auth** authentication framework
- **Biome** for linting and formatting (not ESLint/Prettier)

## Project Structure

src/
├── auth        # Authorization - role based permissions
├── database    # Drizzle config, schema and migrations
├── graphql     # Custom graphQL extensions
├── shared      # Shared generic code
├── utils       # Shared generic code 
test/


# Patterns

- GraphQL schema is built using code first approach and utilising decorators.
- Data from Drizzle queries are mapped to GraphQl models via mappers. All mappers are named with the pattern *.mapper.ts


## Drizzle
Database schema in `src/database/schema.ts`


### Use Relational Query v2 for querying data:
```typescript
const users = await db.query.users.findMany({
	where: {
	    id: 1
	}
});
```

### Do not use Query v1:
```typescript
const users = await db._query.users.findMany({
	where: (users, { eq }) => eq(users.id, 1),
})
```

### Do not use SQL-like select:
```typescript
const users = await db.select().from(users).where(eq(users.id, 1));
```
