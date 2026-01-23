import { GraphQLError } from 'graphql';

export class UnprocessableEntityGraphQLError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNPROCESSABLE_ENTITY',
      },
    });
  }
}
