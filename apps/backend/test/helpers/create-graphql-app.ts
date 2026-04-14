import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import {
  createParamDecorator,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GqlExecutionContext, GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';

type CreateGraphqlTestAppOptions = {
  testUserId?: string;
};

const ensureBackendBuild = () => {
  const currentWorkingDirectory = process.cwd();
  const backendRoot = existsSync(
    join(currentWorkingDirectory, 'apps', 'backend', 'tsconfig.json'),
  )
    ? join(currentWorkingDirectory, 'apps', 'backend')
    : currentWorkingDirectory;
  const buildMarker = join(
    backendRoot,
    'dist',
    'src',
    'database',
    'database.module.js',
  );
  if (existsSync(buildMarker)) {
    return backendRoot;
  }

  const tscResult = spawnSync('npm', ['run', 'build'], {
    cwd: backendRoot,
    stdio: 'inherit',
  });

  if (tscResult.status !== 0) {
    throw new Error('Failed to compile backend sources for Bun test runtime.');
  }

  return backendRoot;
};

const ensureDatabaseSchema = (backendRoot: string) => {
  const migrateResult = spawnSync(
    'npx',
    ['drizzle-kit', 'migrate', '--config', 'drizzle.config.ts'],
    {
      cwd: backendRoot,
      stdio: 'inherit',
    },
  );

  if (migrateResult.status !== 0) {
    throw new Error('Failed to run database migrations for Bun test runtime.');
  }
};

export const createGraphqlTestApp = async (
  options: CreateGraphqlTestAppOptions = {},
): Promise<INestApplication> => {
  const { testUserId = 'test-user-id' } = options;
  const backendRoot = ensureBackendBuild();
  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= process.env.POSTGRES_PORT ?? '5432';
  process.env.DB_USER ??= process.env.POSTGRES_USER ?? 'postgres';
  process.env.DB_PASSWORD ??= process.env.POSTGRES_PASSWORD ?? 'postgres';
  process.env.DB_NAME ??= process.env.POSTGRES_DB ?? 'clippy';
  ensureDatabaseSchema(backendRoot);
  const betterAuthModule = require('@thallesp/nestjs-better-auth') as {
    Session: () => ParameterDecorator;
  };
  const sessionDecorator = createParamDecorator(
    (_data: unknown, context: ExecutionContext) => {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      return gqlContext?.req?.user
        ? { user: gqlContext.req.user }
        : { user: { id: testUserId } };
    },
  );
  betterAuthModule.Session = () => sessionDecorator();

  const { DatabaseModule } = await import(
    pathToFileURL(
      join(backendRoot, 'dist', 'src', 'database', 'database.module.js'),
    ).href
  );
  const { MembershipMapper } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'membership',
        'mappers',
        'membership.mepper.js',
      ),
    ).href
  );
  const { MembershipRequestMapper } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'membership',
        'mappers',
        'membership-request.mepper.js',
      ),
    ).href
  );
  const { UserMapper } = await import(
    pathToFileURL(
      join(backendRoot, 'dist', 'src', 'user', 'mappers', 'user.mapper.js'),
    ).href
  );
  const { UserService } = await import(
    pathToFileURL(
      join(backendRoot, 'dist', 'src', 'user', 'user.service.js'),
    ).href
  );
  const { OrganizationUserProfileMapper } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'requirement-profile',
        'mappers',
        'organization-user-profile.mapper.js',
      ),
    ).href
  );
  const { RequirementFulfillmentMapper } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'requirement-profile',
        'mappers',
        'requirement-fulfillment.mapper.js',
      ),
    ).href
  );
  const { RequirementMapper } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'requirement-profile',
        'mappers',
        'requirement.mapper.js',
      ),
    ).href
  );
  const { RequirementProfileMapper } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'requirement-profile',
        'mappers',
        'requirement-profile.mapper.js',
      ),
    ).href
  );
  const { RequirementProfileSubmissionMapper } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'requirement-profile',
        'mappers',
        'requirement-profile-submission.mapper.js',
      ),
    ).href
  );
  const {
    RequirementFulfillmentFieldResolver,
    RequirementFulfillmentMutationResolver,
    RequirementFulfillmentQueryResolver,
    RequirementMutationResolver,
    RequirementProfileFieldResolver,
    RequirementProfileMutationResolver,
    RequirementProfileQueryResolver,
    RequirementProfileSubmissionFieldResolver,
    RequirementProfileSubmissionMutationResolver,
    RequirementProfileSubmissionQueryResolver,
    RequirementQueryResolver,
  } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'requirement-profile',
        'resolvers',
        'index.js',
      ),
    ).href
  );
  const {
    RequirementProfileService,
    RequirementProfileSubmissionService,
    RequirementService,
  } = await import(
    pathToFileURL(
      join(
        backendRoot,
        'dist',
        'src',
        'requirement-profile',
        'services',
        'index.js',
      ),
    ).href
  );

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [
          join(backendRoot, '.env.test'),
          join(backendRoot, '.env'),
          '.env.test',
          '.env',
        ],
      }),
      DatabaseModule,
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: join(process.cwd(), 'apps/backend/src/schema.gql'),
        graphiql: false,
        sortSchema: true,
        context: ({ req }) => ({
          req,
          user: req.user,
          organizationUnitId: req.headers['x-organization-unit-id'],
        }),
      }),
    ],
    providers: [
      UserService,
      UserMapper,
      RequirementService,
      RequirementProfileService,
      RequirementProfileSubmissionService,
      RequirementProfileMapper,
      RequirementMapper,
      RequirementProfileSubmissionMapper,
      RequirementFulfillmentMapper,
      MembershipMapper,
      MembershipRequestMapper,
      OrganizationUserProfileMapper,
      RequirementProfileQueryResolver,
      RequirementProfileMutationResolver,
      RequirementProfileFieldResolver,
      RequirementQueryResolver,
      RequirementMutationResolver,
      RequirementProfileSubmissionQueryResolver,
      RequirementProfileSubmissionMutationResolver,
      RequirementProfileSubmissionFieldResolver,
      RequirementFulfillmentQueryResolver,
      RequirementFulfillmentMutationResolver,
      RequirementFulfillmentFieldResolver,
    ],
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
