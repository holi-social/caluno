// Core data layer exports (platform-agnostic)
// Use in server components, API routes, or any JavaScript environment

// Unified Data Client (recommended)
export {
  createDataClient,
  DataClient,
  type DataClientConfig,
} from './client/data-client';

// GraphQL Client (for advanced usage)
export * from './client/graphql-client';

// Organization Context Interface (implement per platform)
export type { OrganizationContext } from './client/organization-context';

// Constants
export * from './constants';
// Errors
export * from './errors/data-error';
export * from './errors/forbidden-data-error';
export * from './errors/translate';
// Generated types (all GraphQL types, queries, mutations)
export * from './generated/graphql';
// Server-side utilities (framework-agnostic, requires DI)
export * from './integrations/server-org-context';
// Repositories (if you want to use them directly)
export * from './repositories/accounting/accounting.repository';
export * from './repositories/base/base.repository';
export * from './repositories/event/event.repository';
export * from './repositories/membership/membership.repository';
export * from './repositories/membershipRequest/membershipRequest.repository';
export * from './repositories/organization/organization.repository';
export * from './repositories/organization/organization-unit.repository';
export * from './repositories/public-event/public-event.repository';
export * from './repositories/public-organization-unit/public-organization-unit.repository';
export * from './repositories/requirementForm/requirement-form.repository';
export * from './repositories/requirementProfile/requirement-profile.repository';
export * from './repositories/role/role.repository';
export * from './repositories/shift/shift.repository';
export * from './repositories/time-entry/time-entry.repository';
export * from './repositories/user/user.repository';
