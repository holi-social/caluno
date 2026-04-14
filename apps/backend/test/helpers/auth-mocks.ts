type RegisterModuleMock = (
  moduleName: string,
  factory: () => Record<string, unknown>,
) => void;

const createNoopDecorator = () => {
  return () => {
    return () => {
      return undefined;
    };
  };
};

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
    Session: createNoopDecorator(),
    AllowAnonymous: createNoopDecorator(),
  }));

  registerModuleMock('better-auth', () => ({
    betterAuth: () => ({}),
  }));

  registerModuleMock('@better-auth/drizzle-adapter', () => ({
    drizzleAdapter: () => ({}),
  }));

  registerModuleMock('nanoid', () => ({
    customAlphabet: () => () => 'test-generated-id',
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

export const applyBunAuthMocks = (
  registerModuleMock: RegisterModuleMock,
) => {
  registerCommonAuthMocks(registerModuleMock);

  registerModuleMock('rrule', () => ({
    RRule: class MockRRule {},
    rrulestr: () => ({
      all: () => [],
    }),
  }));
};
