import { DataError } from './data-error';

export class ForbiddenDataError extends DataError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { ...options, code: 'FORBIDDEN' });
    this.name = 'ForbiddenDataError';
  }
}
