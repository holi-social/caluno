'use client';

import { Button } from '@repo/ui';
import { Input } from '@repo/ui/input';
import { useActionState } from 'react';
import { createOrganization } from '@/domain/organization/actions';

export function CreateOrganizationForm() {
  const [state, formAction, isPending] = useActionState(
    createOrganization,
    null,
  );

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Organization Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1"
            placeholder="My Organization"
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            name="description"
            type="text"
            className="mt-1"
            placeholder="What does your organization do?"
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            className="mt-1"
            placeholder="contact@organization.org"
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            className="mt-1"
            placeholder="+1 (555) 123-4567"
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium">
            Website
          </label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            className="mt-1"
            placeholder="https://organization.org"
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium">
            Address
          </label>
          <Input
            id="address"
            name="address"
            type="text"
            className="mt-1"
            placeholder="123 Main St, City, State 12345"
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating organization...' : 'Create organization'}
      </Button>
    </form>
  );
}
