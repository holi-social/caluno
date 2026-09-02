import { type NextRequest, NextResponse } from 'next/server';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

interface Context {
  params: Promise<{ locale: string; token: string }>;
}

export async function GET(request: NextRequest, { params }: Context) {
  const { locale, token } = await params;
  const data = await getDataClient();

  const form = await data.requirementForm.findFormByShareToken(token);
  if (!form?.organizationUnitId) {
    return new NextResponse(null, { status: 404 });
  }

  const path = `/${resolveLocale(locale)}/orgs/${form.organizationUnitId}/forms/${token}`;
  return NextResponse.redirect(new URL(path, request.url));
}
