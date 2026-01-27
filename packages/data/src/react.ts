// React-specific exports (client-side only)
// Import from '@repo/data/react' in client components

// Re-export core types for convenience
export * from './generated/graphql';
export * from './errors/data-error';

// React-specific exports
export * from './react/providers/data-provider';
export * from './react/hooks/use-graphql-client';
export * from './react/hooks/use-user';
export * from './react/hooks/use-organizations';

// Auth (better-auth client factory)
export * from './react/auth/auth-client';
