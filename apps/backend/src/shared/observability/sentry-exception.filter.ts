import { type ArgumentsHost, Catch } from '@nestjs/common';
import { isExpectedGraphqlCode } from '@repo/observability';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { GraphQLError } from 'graphql';

/**
 * Reports unexpected exceptions to Sentry (HTTP + GraphQL contexts, via
 * SentryGlobalFilter) while keeping expected domain errors
 * (ForbiddenGraphQLError etc.) out of Sentry.
 */
@Catch()
export class SentryExceptionFilter extends SentryGlobalFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      exception instanceof GraphQLError &&
      isExpectedGraphqlCode(exception.extensions?.code)
    ) {
      throw exception;
    }
    super.catch(exception, host);
  }
}
