import { DataError } from './data-error';
import { ForbiddenDataError } from './forbidden-data-error';

// biome-ignore lint/suspicious/noExplicitAny: we don't now the error interface yet
export const fromGraphQLError = (error: any): DataError => {
  if (error.response?.errors) {
    const gqlError = error.response.errors[0];
    const code = gqlError.extensions?.code;

    if (code === 'FORBIDDEN') {
      return new ForbiddenDataError(gqlError.message, {
        cause: error,
      });
    } else {
      return new DataError(gqlError.message, {
        code,
        statusCode: error.response.status,
        cause: error,
      });
    }
  }

  return new DataError('An unexpected error occurred', { cause: error });
};
