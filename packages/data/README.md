# @repo/data
Platform-agnostic data layer using repository pattern + codegen for graphql integration

## Overview

This package provides a clean separation between:
- **Core repositories** (pure TypeScript): callable from server components, api routes, node.js scripts
- **React hooks** (TanStack Query wrappers): for client components and mobile app

## Installation

```typescript
// add this in you poject
{
  "dependencies": {
    "@repo/data": "*"
  }
}
```

## Usage

### Server Components (Recommended Pattern)

Create a singleton client in your app:

```typescript
// app/lib/data-client.ts
import { createDataClient } from '@repo/data';

const globalForData = globalThis as unknown as {
  dataClient: ReturnType<typeof createDataClient> | undefined;
};

export const data =
  globalForData.dataClient ??
  createDataClient({
    url: process.env.API_URL!,
    credentials: 'include',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForData.dataClient = data;
}
```

Then use it in server components:

```typescript
// app/organizations/page.tsx
import { data } from '@/lib/data-client';

export default async function OrganizationsPage() {
  // Clean API - no need to create repositories every time
  const organizations = await data.organization.findAll({ limit: 10 });
  const user = await data.user.getMe();

  return <div>{/* render data */}</div>;
}
```

### Client Components (React with TanStack Query)

```typescript
'use client';

import { useOrganizations, useCreateOrganization } from '@repo/data/react';

export default function ClientPage() {
  const { data, isLoading } = useOrganizations(10, 0);
  const createOrg = useCreateOrganization();

  // ... use hooks
}
```

### Setup DataProvider

Wrap your app with `DataProvider` in the root layout:

```typescript
// app/layout.tsx
import { DataProvider } from '@repo/data/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DataProvider apiUrl={process.env.NEXT_PUBLIC_API_URL!}>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
```

### Authentication

```typescript
import { createAuthClient } from '@repo/data/react';

// Create auth client (in your app, not the package)
export const authClient = createAuthClient(
  process.env.NEXT_PUBLIC_API_URL!
);

const { data: session } = authClient.useSession();
```

## GraphQL Code Generation

**Generated code is NOT committed to git** and is automatically generated during development.

### Automatic Generation

Code generation happens automatically:
- ✅ On `bun install` (via postinstall script)
- ✅ Before `bun run dev` (via turbo dependencies)
- ✅ Before `bun run build` (via turbo dependencies)
- ✅ Before `bun run check-types` (via turbo dependencies)

### Manual Generation

If you need to regenerate manually:

```bash
# From root (recommended)
bun run check-types  # Runs codegen automatically

# From data package
cd packages/data
bun run codegen
```

### Watch Mode (Development)

To auto-regenerate on schema/query changes during development:

```bash
# In a separate terminal (runs alongside dev)
cd packages/data
bun run codegen:watch
```

Or with Turbo (from root):

```bash
# Terminal 1
bun run dev

# Terminal 2
turbo run codegen:watch --filter=@repo/data
```

### Generated Files

Types are generated in `src/generated/graphql.ts` from:
- **Schema**: `apps/backend/src/schema.gql`
- **Operations**: `src/**/*.graphql` (query/mutation definitions)

## Architecture

```
@repo/data
├── src/
│   ├── client/              # GraphQL client factory
│   ├── repositories/        # Domain repositories (SSR-compatible and it should stay this way, no client code in this folder) 
│   │   ├── user/
│   │   │   ├── user.repository.ts
│   │   │   └── user.queries.ts
│   │   └── organization/
│   │       ├── organization.repository.ts
│   │       ├── organization.queries.ts
│   │       └── organization.mutations.ts
│   ├── react/ # client only hooks, simple wrappers around repository
│   │   ├── hooks/
│   │   │   ├── use-user.ts
│   │   │   └── use-organizations.ts
│   │   ├── providers/
│   │   │   └── data-provider.tsx
│   │   └── auth/
│   │       └── auth-client.ts
│   ├── errors/              # Error handling
│   ├── generated/           # GraphQL Codegen output
│   ├── index.ts             # SSR exports
│   └── react.ts             # React exports
```

## Benefits
- **Platform Agnostic** - Core repositories work in any JavaScript environment
- **Type Safe** - Full TypeScript from GraphQL schema to UI
- **SSR Compatible** - Direct repository usage in server components
- **Client Optimized** - TanStack Query for caching and reactivity
- **Expo Ready** - Same hooks work in React Native
- **Testable** - Easy to mock repositories
- **DRY** - No code duplication between platforms