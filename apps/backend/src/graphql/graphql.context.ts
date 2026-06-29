import type { BaseUserSession } from '@thallesp/nestjs-better-auth';
import type { Locale } from './locale';

export type GraphQLContext = {
  req: Request;
  locale: Locale;
  user?: BaseUserSession['user'];
  organizationUnitId?: string;
  loaders?: Record<string, unknown>;
};

export type AuthenticatedGraphQLContext = GraphQLContext & {
  user: NonNullable<BaseUserSession['user']>;
  organizationUnitId: string;
};
