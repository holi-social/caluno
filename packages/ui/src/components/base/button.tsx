import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../../lib/utils';
import { ActionTooltip } from '../action-tooltip';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        xs: "h-6 gap-1 rounded-xl px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-4",
        md: 'h-9 px-4 py-2 has-[>svg]:px-3',
        lg: 'h-10 rounded-xl py-2 px-9 has-[>svg]:px-8',
        xl: 'h-[52px] rounded-2xl px-9 text-lg font-bold has-[>svg]:px-8',
        icon: 'size-10',
        'icon-xs': "size-6 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': "size-8 [&_svg:not([class*='size-'])]:size-4",
        'icon-md': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'lg',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'lg',
  asChild = false,
  tooltip,
  disabled,
  'aria-label': ariaLabel,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    tooltip?: string;
  }) {
  const Comp = asChild ? Slot : 'button';
  const resolvedAriaLabel = ariaLabel ?? tooltip;

  const button = (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      {...props}
      {...(resolvedAriaLabel != null
        ? { 'aria-label': resolvedAriaLabel }
        : {})}
    />
  );

  // No tooltip on disabled buttons: wrapping them in a span breaks flex sizing.
  if (!tooltip || disabled) {
    return button;
  }

  return <ActionTooltip label={tooltip}>{button}</ActionTooltip>;
}

export { Button, buttonVariants };
