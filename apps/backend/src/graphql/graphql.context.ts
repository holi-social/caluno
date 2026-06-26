import type { BaseUserSession } from '@thallesp/nestjs-better-auth';

export type GraphQLContext = {
  req: Request;
  user?: BaseUserSession['user'];
  organizationUnitId?: string;
  loaders?: Record<string, unknown>;
};

export type AuthenticatedGraphQLContext = GraphQLContext & {
  user: NonNullable<BaseUserSession['user']>;
  organizationUnitId: string;
};
