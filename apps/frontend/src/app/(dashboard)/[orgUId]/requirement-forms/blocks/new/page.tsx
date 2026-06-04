import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ orgUId: string }>;
}

export default async function NewBlockPage({ params }: Props) {
  const { orgUId } = await params;
  redirect(`/${orgUId}/requirement-forms/blocks?sheet=block-form`);
}
