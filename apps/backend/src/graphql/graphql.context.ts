import type { Locale } from './locale';

export type GraphQLContext = {
  req: Request;
  locale: Locale;
  organizationUnitId?: string;
  loaders?: Record<string, unknown>;
};

export type AuthenticatedGraphQLContext = GraphQLContext & {
  organizationUnitId: string;
};
