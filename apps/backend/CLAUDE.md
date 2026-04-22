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

- **NestJS 11** - Progressive Node.js framework
- **TypeScript** with strict mode
- **GraphQL** with Apollo Server and Code-First approach
- **Drizzle ORM** for database management (PostgreSQL)
- **Better Auth** for authentication (@thallesp/nestjs-better-auth)
- **Biome** for linting and formatting

## Code Style

- **Indent**: 2 spaces (inherited from root config)
- **Line width**: 80 characters (inherited from root config)
- **Quotes**: Single quotes (inherited from root config)
- **Trailing commas**: All (inherited from root config)
- **Semicolons**: Always (inherited from root config)
- `noExplicitAny` is disabled (NestJS uses `any` for flexibility, but we want to avoid it as much as possible)

## NestJS Patterns

### Module Structure
- `*.module.ts` - Module definition with imports, providers, exports
- `*.service.ts` - Business logic and data access
- `*.resolver.ts` - GraphQL resolvers (code-first approach)
- `*.dto.ts` - Data Transfer Objects for validation

### Dependency Injection
Use constructor injection:
```typescript
@Injectable()
export class MyService {
    constructor(
        private readonly otherService: OtherService,
        private readonly repository: Repository,
    ) {}
}
```

### GraphQL Code-First
- Decorators: `@ObjectType()`, `@Field()`, `@Resolver()`, `@Query()`, `@Mutation()`
- DataLoader pattern for N+1 query prevention

### Database
- **Drizzle ORM** (not TypeORM)
- Schema in `src/db/schema/`
- Use Drizzle's query builder and relational queries

### Exception Handling
Use built-in NestJS exceptions:
- `NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`

## Testing

- **Jest** test framework
- Test files use `.spec.ts` suffix
- Use `@nestjs/testing` for creating test modules
- Use `supertest` for e2e tests
