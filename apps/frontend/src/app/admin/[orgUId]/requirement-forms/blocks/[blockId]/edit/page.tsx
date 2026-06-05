import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgUId: string; blockId: string }>;
}

export default async function EditBlockPage({ params }: Props) {
  const { orgUId, blockId } = await params;
  redirect(
    `/admin/${orgUId}/requirement-forms/blocks?sheet=block-form&id=${blockId}`,
  );
}
