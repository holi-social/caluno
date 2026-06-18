import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeHeader } from '@/components/home-header';

const meta: Meta<typeof HomeHeader> = {
  title: 'ui/HomeHeader',
  component: HomeHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    avatarUrl: 'https://placehold.co/112x112',
    title: 'Hi, Longfirstname!',
    orgLogoUrl: 'https://placehold.co/96x64',
    notificationCount: 3,
    onAvatarClick: () => {},
    onNotificationsClick: () => {},
    onOrgClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Expanded header with large avatar, greeting, and full cobranding. */
export const Open: Story = {
  args: {
    variant: 'open',
    notificationCount: 2,
    className: '',
  },
};

/** Compact header for scrolled state; greeting is removed from the DOM. */
export const OnScroll: Story = {
  args: {
    variant: 'on-scroll',
  },
};

/** No notification count — badge is hidden. */
export const NoNotifications: Story = {
  name: 'no notifications',
  args: {
    variant: 'open',
    notificationCount: 0,
  },
};

/** No org logo — Cobranding lockup is hidden entirely. */
export const NoOrgLogo: Story = {
  name: 'no org logo',
  args: {
    variant: 'open',
    orgLogoUrl: null,
  },
};

/** Long greeting wraps naturally while the top row stays single-line. */
export const LongGreeting: Story = {
  name: 'long greeting',
  args: {
    variant: 'open',
    title:
      'Hi, Longfirstname Longlastname! Willkommen zurück im Clippy Dashboard.',
  },
};

/** No callbacks — avatar, bell, and cobranding are non-interactive. */
export const NonInteractive: Story = {
  name: 'non-interactive',
  args: {
    variant: 'open',
    onAvatarClick: undefined,
    onNotificationsClick: undefined,
    onOrgClick: undefined,
  },
};
