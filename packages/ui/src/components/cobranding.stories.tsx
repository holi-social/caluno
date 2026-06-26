import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cobranding } from '@/components/cobranding';

const meta: Meta<typeof Cobranding> = {
  title: 'ui/Cobranding',
  component: Cobranding,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLogo: Story = {
  args: {
    size: 'small',
    logoUrl: 'https://placehold.co/96x64',
  },
};

export const NoLogo: Story = {
  name: 'no logo — renders nothing',
  args: {
    size: 'small',
    logoUrl: null,
  },
};
