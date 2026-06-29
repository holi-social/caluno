import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ensureTestDatabase } from './ensure-test-database';

type CreateGraphqlFullAppOptions = {
  testUserId?: string;
};

const getBackendRoot = () => {
  const currentWorkingDirectory = process.cwd();
  return existsSync(
    join(currentWorkingDirectory, 'apps', 'backend', 'tsconfig.json'),
  )
    ? join(currentWorkingDirectory, 'apps', 'backend')
    : currentWorkingDirectory;
};

const getNewestModifiedAtMs = (directoryPath: string): number => {
  const directoryEntries = readdirSync(directoryPath, { withFileTypes: true });
  let newestModifiedAtMs = 0;

  for (const entry of directoryEntries) {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      newestModifiedAtMs = Math.max(
        newestModifiedAtMs,
        getNewestModifiedAtMs(entryPath),
      );
      continue;
    }

    newestModifiedAtMs = Math.max(
      newestModifiedAtMs,
      statSync(entryPath).mtimeMs,
    );
  }

  return newestModifiedAtMs;
};

const isBackendBuildStale = (
  backendRoot: string,
  buildMarker: string,
): boolean => {
  if (!existsSync(buildMarker)) {
    return true;
  }

  const buildModifiedAtMs = statSync(buildMarker).mtimeMs;
  const sourceModifiedAtMs = getNewestModifiedAtMs(join(backendRoot, 'src'));
  const testHelperModifiedAtMs = getNewestModifiedAtMs(
    join(backendRoot, 'test'),
  );
  const tsconfigModifiedAtMs = statSync(
    join(backendRoot, 'tsconfig.json'),
  ).mtimeMs;
  const packageJsonModifiedAtMs = statSync(
    join(backendRoot, 'package.json'),
  ).mtimeMs;
  const newestInputModifiedAtMs = Math.max(
    sourceModifiedAtMs,
    testHelperModifiedAtMs,
    tsconfigModifiedAtMs,
    packageJsonModifiedAtMs,
  );

  return newestInputModifiedAtMs > buildModifiedAtMs;
};

const ensureBackendBuild = (backendRoot: string) => {
  const buildMarker = join(backendRoot, 'dist', 'src', 'app.module.js');
  if (!isBackendBuildStale(backendRoot, buildMarker)) {
    return;
  }

  const buildResult = spawnSync('bun', ['run', 'build'], {
    cwd: backendRoot,
    stdio: 'inherit',
  });
  if (buildResult.status !== 0) {
    throw new Error('Failed to compile backend sources for Bun test runtime.');
  }
};

const applyRemainingTestEnvironmentDefaults = () => {
  process.env.WEB_URL ??= 'http://localhost:3000';
  process.env.COOKIE_DOMAIN ??= 'localhost';
};

export const createGraphqlFullTestApp = async (
  options: CreateGraphqlFullAppOptions = {},
): Promise<INestApplication> => {
  const { testUserId = 'test-user-id' } = options;
  const backendRoot = getBackendRoot();

  await ensureTestDatabase();
  applyRemainingTestEnvironmentDefaults();
  ensureBackendBuild(backendRoot);
  const { AuthGuard } = await import('@thallesp/nestjs-better-auth');
  const { AppModule } = await import(
    pathToFileURL(join(backendRoot, 'dist', 'src', 'app.module.js')).href
  );
  const { PermissionGuard } = await import(
    pathToFileURL(
      join(backendRoot, 'dist', 'src', 'auth', 'guards', 'permission.guard.js'),
    ).href
  );
  (AuthGuard as any).prototype.canActivate = () => true;
  (PermissionGuard as any).prototype.canActivate = () => true;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use((req, _res, next) => {
    const mutableReq = req as { user?: { id: string } };
    mutableReq.user = mutableReq.user ?? { id: testUserId };
    next();
  });

  await app.init();
  return app;
};
