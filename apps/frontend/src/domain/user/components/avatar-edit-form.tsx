'use client';

import { useUpdateMyImage } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { FileUpload } from '@/components/storage/file-upload';
import { Link, useRouter } from '@/i18n/navigation';

interface AvatarEditFormProps {
  imageUrl?: string | null;
}

export function AvatarEditForm({ imageUrl }: AvatarEditFormProps) {
  const t = useTranslations('Profile');
  const tUpload = useTranslations('Storage.upload');

  const tCommon = useTranslations('Common');
  const router = useRouter();
  const updateMyImage = useUpdateMyImage();

  const [imageFileId, setImageFileId] = useState<string | null | undefined>();

  const [isSaving, setIsSaving] = useState(false);

  const hasImageChange = imageFileId !== undefined;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (hasImageChange) {
        await updateMyImage.mutateAsync({
          imageFileId,
        });
        setImageFileId(undefined);
      }

      router.replace('/profile');
      toast.success(t('saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <FileUpload
        purpose="profile_picture"
        label={t('pictureLabel')}
        description={tUpload('imageHint')}
        value={imageFileId}
        initialPreviewUrl={imageUrl}
        disabled={isSaving}
        onUploaded={(result) => {
          setImageFileId(result.fileId);
        }}
        onClear={() => {
          setImageFileId(null);
        }}
      />

      <div className="flex gap-4">
        <Button variant="secondary" className="flex-1" asChild>
          <Link href={'/profile'}>{tCommon('cancel')}</Link>
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasImageChange || isSaving}
          className="flex-1"
        >
          {isSaving ? tCommon('saving') : tCommon('save')}
        </Button>
      </div>
    </div>
  );
}
