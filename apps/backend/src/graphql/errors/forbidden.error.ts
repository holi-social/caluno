import { GraphQLError } from 'graphql';

export class ForbiddenGraphQLError extends GraphQLError {
    constructor(message: string) {
        super(message, {
            extensions: {
                code: 'FORBIDDEN',
            },
        });
    }
}
