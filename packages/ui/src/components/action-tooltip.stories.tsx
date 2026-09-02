import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pencil } from 'lucide-react';
import { ActionTooltip } from '@/components/action-tooltip';
import { Button } from '@/components/base/button';

const meta: Meta<typeof ActionTooltip> = {
  title: 'ui/ActionTooltip',
  component: ActionTooltip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Edit',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ActionTooltip {...args}>
      <Button size="icon-xs" variant="outline" aria-label={args.label}>
        <Pencil />
      </Button>
    </ActionTooltip>
  ),
};
