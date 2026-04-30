import { NextResponse } from 'next/server';
import { getFormConfig } from '@/lib/store-configs';
import { getBlocksByIds } from '@/lib/store-blocks';
import { resolveBlockRefs } from '@/lib/resolve-blocks';
import {
  createSubmission,
  listSubmissions,
} from '@/lib/store-submissions';
import { validateStepFields } from '@/lib/validation';

export async function GET() {
  const submissions = await listSubmissions();
  return NextResponse.json(submissions);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    formSlug: string;
    data: Record<string, string | boolean | string[]>;
  };

  if (!body.formSlug || !body.data) {
    return NextResponse.json(
      { error: 'formSlug und data sind erforderlich' },
      { status: 400 },
    );
  }

  const config = await getFormConfig(body.formSlug);
  if (!config) {
    return NextResponse.json(
      { error: 'Formular nicht gefunden' },
      { status: 404 },
    );
  }

  // Resolve blocks and apply block-level required-ness
  const blockIds = config.blockRefs.map((r) => r.blockId);
  const blocks = await getBlocksByIds(blockIds);
  const resolved = resolveBlockRefs(config.blockRefs, blocks);

  const allFields = resolved.flatMap((block) =>
    block.fields.map((f) => ({
      ...f,
      required: block.effectiveRequired,
    })),
  );

  const errors = validateStepFields(allFields, body.data);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const submission = await createSubmission({
    formConfigId: config.id,
    formSlug: config.slug,
    data: body.data,
  });

  return NextResponse.json(
    { id: submission.id, submittedAt: submission.submittedAt },
    { status: 201 },
  );
}
