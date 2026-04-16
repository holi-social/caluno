import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

type RegisterModuleMock = (
  moduleName: string,
  factory: () => Record<string, unknown>,
) => void;
let mockedUserId = 'test-user-id';

const createNoopDecorator = () => {
  return () => {
    return () => {
      return undefined;
    };
  };
};

const sessionDecorator = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    return gqlContext?.req?.user
      ? { user: gqlContext.req.user }
      : { user: { id: mockedUserId } };
  },
);

class MockBetterAuthModule {
  static forRootAsync() {
    return {
      module: MockBetterAuthModule,
      providers: [],
      exports: [],
    };
  }
}

class MockAuthGuard {
  canActivate() {
    return true;
  }
}

const registerCommonAuthMocks = (registerModuleMock: RegisterModuleMock) => {
  registerModuleMock('@thallesp/nestjs-better-auth', () => ({
    AuthGuard: MockAuthGuard,
    AuthModule: MockBetterAuthModule,
    Session: () => sessionDecorator(),
    AllowAnonymous: createNoopDecorator(),
  }));

  registerModuleMock('better-auth', () => ({
    betterAuth: (options: unknown) => ({
      options,
      api: {
        getSession: async () => ({
          user: { id: mockedUserId },
        }),
      },
    }),
  }));

  registerModuleMock('@better-auth/drizzle-adapter', () => ({
    drizzleAdapter: () => ({}),
  }));

  registerModuleMock('nanoid', () => ({
    customAlphabet: () => () => `test-generated-id-${crypto.randomUUID()}`,
  }));
};

export const applyJestAuthMocks = () => {
  registerCommonAuthMocks((moduleName, factory) => {
    jest.mock(moduleName, factory);
  });

  jest.mock(
    'rrule',
    () => ({
      RRule: class MockRRule {},
      rrulestr: () => ({
        all: () => [],
      }),
    }),
    { virtual: true },
  );
};

export const applyBunAuthMocks = (registerModuleMock: RegisterModuleMock) => {
  registerCommonAuthMocks(registerModuleMock);

  registerModuleMock('rrule', () => ({
    RRule: class MockRRule {},
    rrulestr: () => ({
      all: () => [],
    }),
  }));
};

export const setAuthMockUserId = (userId: string) => {
  mockedUserId = userId;
};
