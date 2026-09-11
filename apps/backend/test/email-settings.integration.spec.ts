import 'reflect-metadata';
import {
  beforeAll,
  describe,
  expect,
  it,
  mock,
  setDefaultTimeout,
} from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import { applyBunAuthMocks } from './helpers/auth-mocks';
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

const SETTINGS_FIELDS = `
  emailWeeklyUpdateEnabled
  emailUrgentCallsEnabled
  emailPlatformEnabled
`;

type EmailSettings = {
  emailWeeklyUpdateEnabled: boolean;
  emailUrgentCallsEnabled: boolean;
  emailPlatformEnabled: boolean;
};

describe('Volunteer email settings integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
  });

  /** Reads the settings back through `me`, so every assertion is a real round trip. */
  const getSettings = async (): Promise<EmailSettings> => {
    const data = await graphqlRequestRequiringData<{ me: EmailSettings }>(
      app,
      {
        query: `
          query GetMyEmailSettings {
            me {
              ${SETTINGS_FIELDS}
            }
          }
        `,
      },
      'me',
    );

    return data.me;
  };

  const updateSettings = async (
    input: Partial<EmailSettings> & { locale?: string | null },
  ): Promise<EmailSettings> => {
    const data = await graphqlRequestRequiringData<{
      updateMyAccountSettings: EmailSettings;
    }>(
      app,
      {
        query: `
          mutation UpdateMyAccountSettings($input: UpdateMyAccountSettingsInput!) {
            updateMyAccountSettings(input: $input) {
              ${SETTINGS_FIELDS}
            }
          }
        `,
        variables: { input },
      },
      'updateMyAccountSettings',
    );

    return data.updateMyAccountSettings;
  };

  it('defaults all three settings to on', async () => {
    expect(await getSettings()).toEqual({
      emailWeeklyUpdateEnabled: true,
      emailUrgentCallsEnabled: true,
      emailPlatformEnabled: true,
    });
  });

  it('switches one setting off without touching the other two', async () => {
    const updated = await updateSettings({ emailWeeklyUpdateEnabled: false });

    expect(updated).toEqual({
      emailWeeklyUpdateEnabled: false,
      emailUrgentCallsEnabled: true,
      emailPlatformEnabled: true,
    });
    // Re-read, so the change is proven persisted rather than echoed.
    expect(await getSettings()).toEqual(updated);
  });

  it('leaves an omitted setting at its stored value', async () => {
    await updateSettings({ emailUrgentCallsEnabled: false });

    expect(await getSettings()).toEqual({
      emailWeeklyUpdateEnabled: false,
      emailUrgentCallsEnabled: false,
      emailPlatformEnabled: true,
    });
  });

  it('commits language and all three toggles in one action', async () => {
    await updateSettings({
      locale: 'de',
      emailWeeklyUpdateEnabled: true,
      emailUrgentCallsEnabled: true,
      emailPlatformEnabled: false,
    });

    expect(await getSettings()).toEqual({
      emailWeeklyUpdateEnabled: true,
      emailUrgentCallsEnabled: true,
      emailPlatformEnabled: false,
    });

    const me = await graphqlRequestRequiringData<{ me: { locale: string } }>(
      app,
      { query: `query { me { locale } }` },
      'me',
    );
    expect(me.me.locale).toBe('de');
  });

  it('rejects an unknown locale without changing anything', async () => {
    const response = await graphqlRequest<unknown>(app, {
      query: `
        mutation UpdateMyAccountSettings($input: UpdateMyAccountSettingsInput!) {
          updateMyAccountSettings(input: $input) {
            ${SETTINGS_FIELDS}
          }
        }
      `,
      variables: { input: { locale: 'fr' } },
    });

    expect(response.errors?.[0]?.message).toBe('Unsupported locale: fr');
  });
});
