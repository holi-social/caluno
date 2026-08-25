import { afterAll, beforeAll } from 'bun:test';
import {
  ensureTestDatabase,
  teardownTestDatabase,
} from './helpers/ensure-test-database';

const isBackendIntegrationPath = (path: string): boolean =>
  path.includes('apps/backend/test') ||
  path.startsWith('test/') ||
  path === 'test' ||
  path.endsWith('/test');

const shouldProvisionTestDatabase = (): boolean => {
  const paths = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  if (paths.length === 0) {
    return true;
  }
  return paths.some(isBackendIntegrationPath);
};

if (shouldProvisionTestDatabase()) {
  beforeAll(async () => {
    await ensureTestDatabase();
  }, 60_000);
}

afterAll(async () => {
  await teardownTestDatabase();
}, 60_000);
