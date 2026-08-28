import {
  FORBIDDEN_POSTHOG_PROPERTY_KEYS,
  omitForbiddenPostHogProperties,
  POSTHOG_ACTIONS,
  POSTHOG_EVENT,
  POSTHOG_EVENT_REGISTRY,
  POSTHOG_OBJECTS,
  POSTHOG_SURFACE,
  type PostHogEventName,
} from './posthog.events';

const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

function splitName(name: PostHogEventName): {
  object: string;
  action: string;
} {
  const knownActions = [...POSTHOG_ACTIONS].sort((a, b) => b.length - a.length);
  const action = knownActions.find((candidate) =>
    name.endsWith(`_${candidate}`),
  );
  if (!action) {
    throw new Error(`No known action in event name "${name}"`);
  }
  const object = name.slice(0, -(action.length + 1));
  return { object, action };
}

describe('POSTHOG_EVENT_REGISTRY', () => {
  const names = Object.keys(POSTHOG_EVENT_REGISTRY) as PostHogEventName[];

  it('uses snake_case names that match registry keys', () => {
    for (const name of names) {
      expect(name).toMatch(SNAKE_CASE);
      expect(POSTHOG_EVENT_REGISTRY[name].name).toBe(name);
      expect(POSTHOG_EVENT_REGISTRY[name].description.length).toBeGreaterThan(
        0,
      );
    }
  });

  it('pairs POSTHOG_EVENT constants to registry names', () => {
    for (const name of names) {
      const constantKey = name.toUpperCase() as Uppercase<PostHogEventName>;
      expect(POSTHOG_EVENT[constantKey]).toBe(name);
    }
  });

  it('uses closed object and action lists', () => {
    for (const name of names) {
      const { object, action } = splitName(name);
      expect(POSTHOG_OBJECTS).toContain(object);
      expect(POSTHOG_ACTIONS).toContain(action);
    }
  });

  it('does not keep overwritten live names', () => {
    expect(names).not.toContain('user_signed_up');
    expect(names).not.toContain('user_logged_in');
    expect(names).not.toContain('user_joined_org');
    expect(names).toContain('user_sign_up');
    expect(names).toContain('user_log_in');
    expect(names).toContain('organization_join');
  });

  it('forbids PII property keys in the denylist', () => {
    expect(FORBIDDEN_POSTHOG_PROPERTY_KEYS).toEqual(
      expect.arrayContaining(['email', 'name', 'token', 'ip']),
    );
  });

  it('strips denylisted keys without treating filename as name', () => {
    const { properties, droppedKeys } = omitForbiddenPostHogProperties({
      surface: POSTHOG_SURFACE.AUTH,
      email: 'volunteer@example.com',
      name: 'Volunteer',
      filename: 'id-scan.pdf',
      organization_id: 'org-1',
    });
    expect(droppedKeys.sort()).toEqual(['email', 'name']);
    expect(properties).toEqual({
      surface: POSTHOG_SURFACE.AUTH,
      filename: 'id-scan.pdf',
      organization_id: 'org-1',
    });
  });
});
