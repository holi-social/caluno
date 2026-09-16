import type { SdkFunctionWrapper } from '../generated/graphql';
import { DataError } from './data-error';
import { ForbiddenDataError } from './forbidden-data-error';

// biome-ignore lint/suspicious/noExplicitAny: we don't know the error interface yet
export const fromGraphQLError = (error: any): DataError => {
  // Idempotent: the React SDK wrapper and the server DataClient both translate,
  // and callers may pass an already-translated error back in. Re-translating a
  // DataError would lose its message (it has no `response`).
  if (error instanceof DataError) return error;

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

/**
 * Wraps every SDK call so a failed GraphQL request surfaces as a `DataError`
 * with the backend's message + code — never the raw `graphql-request`
 * `ClientError`, whose `.message` is the whole serialized response.
 *
 * Both the server `DataClient` and the React hooks (`useSdk`) must use this;
 * a client that skips it leaves `error instanceof DataError` checks (and the
 * friendly copy keyed off them) permanently false.
 */
export function createSdkErrorWrapper(
  onError?: (error: DataError) => void,
): SdkFunctionWrapper {
  return async (action) => {
    try {
      return await action();
    } catch (error) {
      const dataError = fromGraphQLError(error);
      onError?.(dataError);
      throw dataError;
    }
  };
}

/** Shared, callback-less wrapper for callers that just need translation. */
export const sdkErrorTranslation: SdkFunctionWrapper = createSdkErrorWrapper();
