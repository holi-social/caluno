// Core data layer exports (platform-agnostic)
// Use in server components, API routes, or any JavaScript environment

// Unified Data Client (recommended)
export { createDataClient, DataClient } from './client/data-client';

// GraphQL Client (for advanced usage)
export * from './client/graphql-client';

// Organization Context Interface (implement per platform)
export type { OrganizationContext } from './client/organization-context';

// Errors
export * from './errors/data-error';
// Generated types (all GraphQL types, queries, mutations)
export * from './generated/graphql';
// Repositories (if you want to use them directly)
export * from './repositories/base/base.repository';
export * from './repositories/organization/organization.repository';
export * from './repositories/user/user.repository';
