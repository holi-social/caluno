import { GraphQLError } from 'graphql';

export class BadRequestGraphQLError extends GraphQLError {
    constructor(message: string) {
        super(message, {
            extensions: {
                code: 'BAD_REQUEST',
            },
        });
    }
}
