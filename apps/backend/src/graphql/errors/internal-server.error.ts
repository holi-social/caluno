import { GraphQLError } from 'graphql';

export class InternalServerGraphQLError extends GraphQLError {
    constructor(message: string) {
        super(message, {
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
            },
        });
    }
}
