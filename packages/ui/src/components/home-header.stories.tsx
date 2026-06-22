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
    notificationCount: 3,
    onAvatarClick: () => {},
    onNotificationsClick: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Expanded header with large avatar, greeting, and logo. */
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

/** Long greeting wraps naturally while the top row stays single-line. */
export const LongGreeting: Story = {
  name: 'long greeting',
  args: {
    variant: 'open',
    title:
      'Hi, Longfirstname Longlastname! Willkommen zurück im Clippy Dashboard.',
  },
};

/** No callbacks — avatar and bell are non-interactive. */
export const NonInteractive: Story = {
  name: 'non-interactive',
  args: {
    variant: 'open',
    onAvatarClick: undefined,
    onNotificationsClick: undefined,
  },
};
