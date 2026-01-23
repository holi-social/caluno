import { GraphQLError } from 'graphql';

export class ConflictGraphQLError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'CONFLICT',
      },
    });
  }
}
