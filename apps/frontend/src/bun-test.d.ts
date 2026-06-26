declare module 'bun:test' {
  export const afterAll: (...args: unknown[]) => unknown;
  export const afterEach: (...args: unknown[]) => unknown;
  export const beforeAll: (...args: unknown[]) => unknown;
  export const beforeEach: (...args: unknown[]) => unknown;
  export const describe: (...args: unknown[]) => unknown;
  export const expect: typeof import('bun:test').expect;
  export const it: (...args: unknown[]) => unknown;
  export const mock: typeof import('bun:test').mock;
}
