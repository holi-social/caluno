'use client';

import { cn } from '@repo/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/base/popover';
import { Button } from '@repo/ui/button';
import { Calendar } from '@repo/ui/calendar';
import { Input } from '@repo/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Textarea } from '@repo/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useActionState, useState } from 'react';
import { createProject } from '@/actions/project';

function formatDate(date: Date | undefined): string {
  if (!date) return '';
  return date.toISOString();
}

function formatDisplayDate(date: Date | undefined): string {
  if (!date) return 'Pick a date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function CreateProjectForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [state, formAction, isPending] = useActionState(createProject, null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields for server action */}
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="startsAt" value={formatDate(startDate)} />
      <input type="hidden" name="endsAt" value={formatDate(endDate)} />

      {/* Error display */}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Title field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Project Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          className="mt-1"
          placeholder="Community Garden Renovation"
          disabled={isPending}
        />
      </div>

      {/* Description field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="description"
          name="description"
          required
          className="mt-1"
          placeholder="Provide a detailed description of the project..."
          rows={4}
          disabled={isPending}
        />
      </div>

      {/* Location field */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Location <span className="text-destructive">*</span>
        </label>
        <Input
          id="location"
          name="location"
          type="text"
          required
          className="mt-1"
          placeholder="123 Main Street, City, State"
          disabled={isPending}
        />
      </div>

      {/* Date fields in grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Start date */}
        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium">
            Start Date <span className="text-destructive">*</span>
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'mt-1 w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground',
                )}
                disabled={isPending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDisplayDate(startDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End date */}
        <div>
          <label htmlFor="endsAt" className="block text-sm font-medium">
            End Date <span className="text-destructive">*</span>
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'mt-1 w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground',
                )}
                disabled={isPending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDisplayDate(endDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Status field */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium">
          Status
        </label>
        <Select name="status" defaultValue="DRAFT" disabled={isPending}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit button */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating project...' : 'Create project'}
      </Button>
    </form>
  );
}
