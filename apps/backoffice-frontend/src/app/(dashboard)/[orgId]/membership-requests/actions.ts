'use server';

import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';

const rejectMembershipRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
});

export const rejectMembershipRequest = actionClient
  .inputSchema(rejectMembershipRequestSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationId);
    return await data.membershipRequest.reject(
      parsedInput.id,
      parsedInput.organizationId,
      parsedInput.rejectionReason,
    );
  });
