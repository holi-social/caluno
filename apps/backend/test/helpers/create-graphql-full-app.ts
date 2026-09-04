import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { AppModule } from '../../src/app.module';
import { PermissionGuard } from '../../src/auth/guards/permission.guard';
import { getAuthMockUserId } from './auth-mocks';
import { ensureTestDatabase } from './ensure-test-database';

const applyRemainingTestEnvironmentDefaults = () => {
  process.env.WEB_URL ??= 'http://localhost:3000';
  process.env.COOKIE_DOMAIN ??= 'localhost';
};

export const createGraphqlFullTestApp = async (): Promise<INestApplication> => {
  await ensureTestDatabase();
  applyRemainingTestEnvironmentDefaults();

  (AuthGuard as any).prototype.canActivate = () => true;
  (PermissionGuard as any).prototype.canActivate = () => true;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ logger: false });
  app.use((req, _res, next) => {
    const mutableReq = req as {
      user?: { id: string };
      session?: { user: { id: string } };
    };
    mutableReq.user = { id: getAuthMockUserId() };
    mutableReq.session = { user: mutableReq.user };
    next();
  });

  await app.init();
  return app;
};
