import { GraphQLError } from 'graphql';

export class NotFoundGraphQLError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'NOT_FOUND',
      },
    });
  }
}
