# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server with watch mode
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Lint with Biome
- `npm run format` - Format with Biome
- `npm run check-types` - Type check without emitting files
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run db:generate` - Generate database migrations with Drizzle
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

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
