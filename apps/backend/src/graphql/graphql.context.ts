import type { BaseUserSession } from '@thallesp/nestjs-better-auth';

export type GraphQLContext = {
  req: Request;
  user?: BaseUserSession['user'];
  organizationId?: string;
};

export type AuthenticatedGraphQLContext = GraphQLContext & {
  user: NonNullable<BaseUserSession['user']>;
  organizationId: string;
};
