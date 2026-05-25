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
}
