'use client';

import { cn } from '../lib/utils';
import { Tabs, TabsList, TabsTrigger } from './base/tabs';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'default' | 'lg';
  variant?: 'default' | 'line';
  triggerClassName?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  size = 'default',
  variant = 'default',
  triggerClassName,
}: SegmentedControlProps) {
  return (
    <Tabs
      value={value}
      onValueChange={onChange}
      className={cn('w-full', className)}
    >
      <TabsList
        size={size}
        variant={variant}
        className="grid w-full grid-cols-2"
      >
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className={triggerClassName}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
