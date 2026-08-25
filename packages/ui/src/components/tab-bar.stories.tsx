import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Building2Icon,
  CalendarDaysIcon,
  ClockIcon,
  FileClockIcon,
  HomeIcon,
  MenuIcon,
  QrCodeIcon,
  ScanQrCode,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { TabBar, type TabBarItem } from '@/components/tab-bar';

const volunteerTabs: TabBarItem[] = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'check-in', label: 'Check in', icon: QrCodeIcon },
  { key: 'my-time', label: 'My Time', icon: FileClockIcon },
];

const backofficeTabs: TabBarItem[] = [
  { key: 'shiftplan', label: 'Shiftplan', icon: CalendarDaysIcon },
  { key: 'check-in', label: 'Check in', icon: ScanQrCode },
  { key: 'timesheets', label: 'Timesheets', icon: ClockIcon },
  { key: 'volunteers', label: 'Volunteers', icon: UsersIcon },
];

/**
 * Floating bottom navigation. Presentational and router-agnostic: drive it with
 * `items`, `activeKey`, and `onSelect`. The active highlight is a single pill
 * that travels between tabs (snaps under `prefers-reduced-motion`).
 *
 * Three real-world configurations:
 * - **Volunteer** — three tabs, no island.
 * - **Volunteer (admin)** — volunteer tabs + a `right` "To admin" mode-switch island.
 * - **Backoffice** — a `left` icon-only sidebar island + four tabs.
 */
const meta: Meta<typeof TabBar> = {
  title: 'ui/TabBar',
  component: TabBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/** Volunteer: three tabs, no island. */
export const Volunteer: Story = {
  render: () => {
    const [activeKey, setActiveKey] = useState('check-in');
    return (
      <TabBar
        items={volunteerTabs}
        activeKey={activeKey}
        onSelect={setActiveKey}
      />
    );
  },
};

/** Volunteer with admin rights: volunteer tabs + a "To admin" mode switch. */
export const VolunteerAdmin: Story = {
  render: () => {
    const [activeKey, setActiveKey] = useState('check-in');
    return (
      <TabBar
        items={volunteerTabs}
        activeKey={activeKey}
        onSelect={setActiveKey}
        island={{
          side: 'right',
          icon: Building2Icon,
          label: 'Admin',
          onClick: () => {},
        }}
      />
    );
  },
};

/** Backoffice: an icon-only sidebar island plus the four backoffice tabs. */
export const Backoffice: Story = {
  render: () => {
    const [activeKey, setActiveKey] = useState('check-in');
    return (
      <TabBar
        items={backofficeTabs}
        activeKey={activeKey}
        onSelect={setActiveKey}
        island={{
          side: 'left',
          icon: MenuIcon,
          label: 'Open navigation',
          onClick: () => {},
        }}
      />
    );
  },
};

export const ShouldSelectAndMoveHighlight: Story = {
  name: 'when selecting tabs, should update active and arrow-navigate',
  tags: ['!dev', '!autodocs'],
  render: () => {
    const [activeKey, setActiveKey] = useState('check-in');
    return (
      <TabBar
        items={volunteerTabs}
        activeKey={activeKey}
        onSelect={setActiveKey}
      />
    );
  },
  play: async ({ canvas, step }) => {
    await step('click the My Time tab', async () => {
      const myTime = canvas.getByRole('button', { name: /My Time/ });
      await userEvent.click(myTime);
      await waitFor(() =>
        expect(myTime).toHaveAttribute('aria-current', 'page'),
      );
    });

    await step('arrow keys translate selection and select', async () => {
      const home = canvas.getByRole('button', { name: /Home/ });
      home.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() =>
        expect(
          canvas.getByRole('button', { name: /Check in/ }),
        ).toHaveAttribute('aria-current', 'page'),
      );
    });
  },
};
