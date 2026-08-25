import { createInviteRedirectResponse } from '@/lib/invite-redirect';

export async function GET(request: Request) {
  return createInviteRedirectResponse(request);
}
