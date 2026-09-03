import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/base/dialog';

/**
 * A window overlaid on either the primary window or another dialog window,
 * rendering the content underneath inert.
 */
const meta = {
  title: 'ui/radix/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {},
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-4">
          <DialogClose className="hover:underline">Cancel</DialogClose>
          <DialogClose className="rounded bg-primary px-4 py-2 text-primary-foreground">
            Continue
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the dialog.
 */
export const Default: Story = {};

/**
 * The `lg` size, for content that needs most of the viewport (e.g. a
 * two-column layout with a preview pane).
 */
export const Large: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Large dialog</DialogTitle>
          <DialogDescription>
            Sized to most of the viewport instead of a fixed max width.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">Content area.</div>
        <DialogFooter className="gap-4 p-6 pt-0">
          <DialogClose className="hover:underline">Cancel</DialogClose>
          <DialogClose className="rounded bg-primary px-4 py-2 text-primary-foreground">
            Continue
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ShouldOpenCloseWithContinue: Story = {
  name: 'when clicking Continue button, should close the dialog',
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step('Open the dialog', async () => {
      await userEvent.click(
        await canvasBody.findByRole('button', { name: /open/i }),
      );
      const dialog = await canvasBody.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('Close the dialog', async () => {
      await userEvent.click(
        await canvasBody.findByRole('button', { name: /continue/i }),
      );
      expect(await canvasBody.findByRole('dialog')).toHaveAttribute(
        'data-state',
        'closed',
      );
    });
  },
};

export const ShouldOpenCloseWithCancel: Story = {
  name: 'when clicking Cancel button, should close the dialog',
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step('Open the dialog', async () => {
      await userEvent.click(
        await canvasBody.findByRole('button', { name: /open/i }),
      );
      const dialog = await canvasBody.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('Close the dialog', async () => {
      await userEvent.click(
        await canvasBody.findByRole('button', { name: /cancel/i }),
      );
      expect(await canvasBody.findByRole('dialog')).toHaveAttribute(
        'data-state',
        'closed',
      );
    });
  },
};

export const ShouldOpenCloseCross: Story = {
  name: 'when clicking Close icon, should close the dialog',
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step('Open the dialog', async () => {
      await userEvent.click(
        await canvasBody.findByRole('button', { name: /open/i }),
      );
      const dialog = await canvasBody.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('Close the dialog', async () => {
      await userEvent.click(
        await canvasBody.findByRole('button', { name: /close/i }),
      );
      expect(await canvasBody.findByRole('dialog')).toHaveAttribute(
        'data-state',
        'closed',
      );
    });
  },
};
