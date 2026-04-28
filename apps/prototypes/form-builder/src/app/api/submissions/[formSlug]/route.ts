import { NextResponse } from 'next/server';
import { listSubmissionsByForm } from '@/lib/store-submissions';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formSlug: string }> },
) {
  const { formSlug } = await params;
  const submissions = await listSubmissionsByForm(formSlug);
  return NextResponse.json(submissions);
}
