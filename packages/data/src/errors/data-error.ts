export class DataError extends Error {
  constructor(
    message: string,
    public readonly options?: {
      cause?: unknown;
      code?: string;
      statusCode?: number;
    },
  ) {
    super(message);
    this.name = 'DataError';
  }

  // biome-ignore lint/suspicious/noExplicitAny: we don't now the error interface yet
  static fromGraphQLError(error: any): DataError {
    if (error.response?.errors) {
      const gqlError = error.response.errors[0];
      return new DataError(gqlError.message, {
        code: gqlError.extensions?.code,
        statusCode: error.response.status,
        cause: error,
      });
    }
    return new DataError('An unexpected error occurred', { cause: error });
  }
}
