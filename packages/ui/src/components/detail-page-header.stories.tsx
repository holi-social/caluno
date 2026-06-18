import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookmarkIcon, ShareIcon } from 'lucide-react';
import { DetailPageHeader } from '@/components/detail-page-header';

const meta: Meta<typeof DetailPageHeader> = {
  title: 'ui/DetailPageHeader',
  component: DetailPageHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onBack: () => {},
    backLabel: 'Zurück',
    logoUrl: 'https://placehold.co/96x64',
    title: 'Schicht Details',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleActions = (
  <>
    <button
      type="button"
      aria-label="Speichern"
      className="flex size-11 items-center justify-center rounded-full text-foreground hover:bg-accent"
    >
      <BookmarkIcon className="size-5" />
    </button>
    <button
      type="button"
      aria-label="Teilen"
      className="flex size-11 items-center justify-center rounded-full text-foreground hover:bg-accent"
    >
      <ShareIcon className="size-5" />
    </button>
  </>
);

/** Non-transparent / Full — back + title + cobranding + actions */
export const NonTransparentFull: Story = {
  name: 'Non-Transparent / Full',
  args: { variant: 'full', transparent: false, actions: SampleActions },
};

/** Non-transparent / NoActions — back + title + cobranding */
export const NonTransparentNoActions: Story = {
  name: 'Non-Transparent / NoActions',
  args: { variant: 'no-actions', transparent: false },
};

/** Non-transparent / Landing — back + cobranding (no title) */
export const NonTransparentLanding: Story = {
  name: 'Non-Transparent / Landing',
  args: { variant: 'landing', transparent: false },
};

/** Transparent / Full — frosted glass + back + title + cobranding + actions */
export const TransparentFull: Story = {
  name: 'Transparent / Full',
  args: { variant: 'full', transparent: true, actions: SampleActions },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/** Transparent / NoActions */
export const TransparentNoActions: Story = {
  name: 'Transparent / NoActions',
  args: { variant: 'no-actions', transparent: true },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/** Transparent / Landing */
export const TransparentLanding: Story = {
  name: 'Transparent / Landing',
  args: { variant: 'landing', transparent: true },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/** Gate 4: no org logo — Cobranding is hidden entirely */
export const NoOrgLogo: Story = {
  name: 'no org logo — Cobranding hidden',
  args: { variant: 'full', logoUrl: null, actions: SampleActions },
};

/** Gate 4: long page title truncates to a single line */
export const LongTitle: Story = {
  name: 'long title — truncates with ellipsis',
  args: {
    variant: 'full',
    title: 'Sehr langer Seitenname der nicht umbrechen darf',
    actions: SampleActions,
  },
};
