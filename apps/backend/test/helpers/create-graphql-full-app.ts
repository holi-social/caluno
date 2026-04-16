import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

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

const ensureBackendBuild = (backendRoot: string) => {
  const buildMarker = join(backendRoot, 'dist', 'src', 'app.module.js');
  if (existsSync(buildMarker)) {
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

const applyTestEnvironmentDefaults = (backendRoot: string) => {
  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= process.env.POSTGRES_PORT ?? '5432';
  process.env.DB_USER ??= process.env.POSTGRES_USER ?? 'postgres';
  process.env.DB_PASSWORD ??= process.env.POSTGRES_PASSWORD ?? 'postgres';
  process.env.DB_NAME ??= process.env.POSTGRES_DB ?? 'clippy';
  process.env.WEB_URL ??= 'http://localhost:3000';
  process.env.COOKIE_DOMAIN ??= 'localhost';
  process.env.NODE_ENV = 'test';
};

export const createGraphqlFullTestApp = async (
  options: CreateGraphqlFullAppOptions = {},
): Promise<INestApplication> => {
  const { testUserId = 'test-user-id' } = options;
  const backendRoot = getBackendRoot();

  applyTestEnvironmentDefaults(backendRoot);
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
