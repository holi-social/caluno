import { PostHog } from 'posthog-node';
import { PostHogInterceptor } from 'posthog-node/nestjs';
import {
  createPostHogClient,
  createPostHogRequestInterceptor,
  NoOpPostHogInterceptor,
} from './posthog.client';

jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    shutdown: jest.fn(),
  })),
}));

const PostHogMock = PostHog as unknown as jest.Mock;

describe('createPostHogClient', () => {
  beforeEach(() => {
    PostHogMock.mockClear();
  });

  it('does not construct a PostHog client when the API key is unset', () => {
    expect(createPostHogClient({})).toBeNull();
    expect(PostHogMock).not.toHaveBeenCalled();
  });

  it('does not construct a PostHog client when the API key is empty', () => {
    expect(createPostHogClient({ POSTHOG_API_KEY: '' })).toBeNull();
    expect(PostHogMock).not.toHaveBeenCalled();
  });

  it('constructs a client with the EU host by default', () => {
    const client = createPostHogClient({ POSTHOG_API_KEY: 'phc_test' });
    expect(client).not.toBeNull();
    expect(PostHogMock).toHaveBeenCalledWith('phc_test', {
      host: 'https://eu.i.posthog.com',
    });
  });

  it('uses POSTHOG_HOST when set', () => {
    createPostHogClient({
      POSTHOG_API_KEY: 'phc_test',
      POSTHOG_HOST: 'https://us.i.posthog.com',
    });
    expect(PostHogMock).toHaveBeenCalledWith('phc_test', {
      host: 'https://us.i.posthog.com',
    });
  });
});

describe('createPostHogRequestInterceptor', () => {
  it('returns PostHogInterceptor when a client exists', () => {
    const interceptor = createPostHogRequestInterceptor(
      new PostHog('phc_test'),
    );
    expect(interceptor).toBeInstanceOf(PostHogInterceptor);
  });

  it('returns a no-op interceptor when the client is missing', () => {
    const interceptor = createPostHogRequestInterceptor(null);
    expect(interceptor).toBeInstanceOf(NoOpPostHogInterceptor);
  });
});
