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
    if (context.getType() === 'http') {
      const request = context
        .switchToHttp()
        .getRequest<{ user?: { id: string } }>();
      return {
        user: request.user ?? { id: mockedUserId },
      };
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    return gqlContext?.req?.user
      ? { user: gqlContext.req.user }
      : { user: { id: mockedUserId } };
  },
);

class MockBetterAuthModule {
  static forRootAsync() {
    const mockAuthService = {
      provide: MockAuthService,
      useValue: new MockAuthService(),
    };
    return {
      module: MockBetterAuthModule,
      providers: [mockAuthService],
      exports: [mockAuthService],
    };
  }
}

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<{
        user?: { id: string };
        session?: { user: { id: string } };
      }>();
      request.user = { id: mockedUserId };
      request.session = { user: request.user };
    }

    return true;
  }
}

const mockAuthInstance = (options: unknown) => ({
  options,
  api: {
    getSession: async () => ({
      user: { id: mockedUserId },
    }),
  },
});

class MockAuthService {
  get api() {
    return mockAuthInstance({}).api;
  }

  get instance() {
    return mockAuthInstance({});
  }
}

const registerCommonAuthMocks = (registerModuleMock: RegisterModuleMock) => {
  registerModuleMock('@thallesp/nestjs-better-auth', () => ({
    AuthGuard: MockAuthGuard,
    AuthModule: MockBetterAuthModule,
    AuthService: MockAuthService,
    Session: () => sessionDecorator(),
    AllowAnonymous: createNoopDecorator(),
  }));

  registerModuleMock('better-auth', () => ({
    betterAuth: mockAuthInstance,
  }));

  registerModuleMock('@better-auth/drizzle-adapter', () => ({
    drizzleAdapter: () => ({}),
  }));

  registerModuleMock('nanoid', () => ({
    customAlphabet: () => () => `test-generated-id-${crypto.randomUUID()}`,
  }));
};

const weekday = (n: number) => ({ weekday: n });

class MockRRule {
  static MO = weekday(0);
  static TU = weekday(1);
  static WE = weekday(2);
  static TH = weekday(3);
  static FR = weekday(4);
  static SA = weekday(5);
  static SU = weekday(6);
  static WEEKLY = 2;
  static DAILY = 3;
  static MONTHLY = 1;

  toString() {
    return 'FREQ=WEEKLY';
  }
}

const mockRruleModule = () => ({
  RRule: MockRRule,
  rrulestr: () => ({
    all: () => [],
    between: () => [],
    options: { until: undefined },
  }),
});

export const applyJestAuthMocks = () => {
  registerCommonAuthMocks((moduleName, factory) => {
    jest.mock(moduleName, factory);
  });

  jest.mock('rrule', mockRruleModule, { virtual: true });
};

export const applyBunAuthMocks = (registerModuleMock: RegisterModuleMock) => {
  registerCommonAuthMocks(registerModuleMock);

  registerModuleMock('rrule', mockRruleModule);
};

export const setAuthMockUserId = (userId: string) => {
  mockedUserId = userId;
};

export const getAuthMockUserId = (): string => mockedUserId;
