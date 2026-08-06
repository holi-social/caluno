'use client';

import {
  Button,
  cn,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui';
import { FileIcon, Loader2, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';
import { ActionTooltip } from '@/components/action-tooltip';
import {
  getAcceptForPurpose,
  isMimeTypeAllowedForPurpose,
} from '@/lib/storage/allowed-mime-types';
import {
  type UploadFileResult,
  type UploadPurpose,
  uploadFile,
} from '@/lib/storage/upload-file';
import { hasFileSelection } from './file-upload-state';

interface FileUploadProps {
  purpose: UploadPurpose;
  organizationUnitId?: string;
  value?: string | null;
  initialPreviewUrl?: string | null;
  initialFilename?: string | null;
  disabled?: boolean;
  accept?: string;
  label?: string;
  description?: string;
  hideLabel?: boolean;
  error?: string;
  id?: string;
  onUploaded: (result: UploadFileResult) => void;
  onClear?: () => void;
}

function isImageFile(mimeType: string | undefined, accept?: string): boolean {
  if (mimeType?.startsWith('image/')) {
    return true;
  }

  if (!accept) {
    return false;
  }

  return accept.split(',').some((type) => type.trim().startsWith('image/'));
}

export function FileUpload({
  purpose,
  organizationUnitId,
  value,
  initialPreviewUrl,
  initialFilename,
  disabled,
  accept,
  label,
  description,
  hideLabel,
  error: externalError,
  id: idProp,
  onUploaded,
  onClear,
}: FileUploadProps) {
  const t = useTranslations('Storage.upload');
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedResult, setUploadedResult] = useState<UploadFileResult | null>(
    null,
  );
  const initialKey = `${initialPreviewUrl ?? ''}\0${initialFilename ?? ''}`;
  const [clearedInitialKey, setClearedInitialKey] = useState<string | null>(
    null,
  );
  const initialCleared = clearedInitialKey === initialKey;

  const effectiveInitialPreviewUrl = initialCleared ? null : initialPreviewUrl;
  const effectiveInitialFilename = initialCleared ? null : initialFilename;
  const previewUrl = uploadedResult?.publicUrl ?? effectiveInitialPreviewUrl;
  const filename = uploadedResult?.filename ?? effectiveInitialFilename;
  const mimeType = uploadedResult?.mimeType ?? null;
  const displayError = externalError ?? error;
  const hasFile = hasFileSelection({
    value,
    initialPreviewUrl,
    initialCleared,
  });
  const resolvedAccept = accept ?? getAcceptForPurpose(purpose);
  const showImagePreview =
    Boolean(previewUrl) &&
    (mimeType ? isImageFile(mimeType, resolvedAccept) : true);
  const isInteractive = !disabled && !isUploading;

  const processFile = async (file: File) => {
    setError(null);

    const mimeType = file.type || 'application/octet-stream';
    if (!isMimeTypeAllowedForPurpose(purpose, mimeType)) {
      setError(t('invalidFileType'));
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFile({
        purpose,
        file,
        organizationUnitId,
      });
      setClearedInitialKey(null);
      setUploadedResult(result);
      onUploaded(result);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : t('failed'),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    await processFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (!isInteractive) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const openFilePicker = () => {
    if (isInteractive) {
      inputRef.current?.click();
    }
  };

  const handleClear = () => {
    setClearedInitialKey(initialKey);
    setUploadedResult(null);
    onClear?.();
  };

  return (
    <Field data-invalid={displayError ? true : undefined}>
      {!hideLabel ? (
        <FieldLabel htmlFor={inputId}>{label ?? t('label')}</FieldLabel>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        {...(resolvedAccept ? { accept: resolvedAccept } : {})}
        disabled={disabled || isUploading}
        className="sr-only"
        onChange={handleFileChange}
      />

      {hasFile || isUploading ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-md border bg-background p-3',
            displayError && 'border-destructive',
          )}
        >
          {showImagePreview ? (
            // biome-ignore lint/performance/noImgElement: blob/presigned preview URLs are not compatible with next/image
            <img
              src={previewUrl ?? undefined}
              alt={t('previewAlt')}
              className="size-12 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <EmptyMedia variant="icon" className="mb-0 size-12 shrink-0">
              <FileIcon />
            </EmptyMedia>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {filename ?? t('uploaded')}
            </p>
            {isUploading ? (
              <p className="text-sm text-muted-foreground">{t('uploading')}</p>
            ) : null}
          </div>

          {isUploading ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!isInteractive}
                onClick={openFilePicker}
              >
                <Upload />
                {t('replace')}
              </Button>
              {onClear ? (
                <ActionTooltip label={t('clear')}>
                  {!isInteractive ? (
                    <span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled
                        aria-label={t('clear')}
                      >
                        <X />
                      </Button>
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('clear')}
                      onClick={handleClear}
                    >
                      <X />
                    </Button>
                  )}
                </ActionTooltip>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <Empty
          className={cn(
            'cursor-pointer border border-dashed px-6 py-8 transition-colors',
            isDragging && 'border-primary bg-primary/5',
            disabled && 'cursor-not-allowed opacity-50',
            displayError && 'border-destructive',
          )}
          onClick={openFilePicker}
          onDragEnter={(event) => {
            event.preventDefault();
            if (isInteractive) {
              setIsDragging(true);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (isInteractive) {
              setIsDragging(true);
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Upload />
            </EmptyMedia>
            <EmptyTitle className="text-base">{t('chooseFile')}</EmptyTitle>
            <EmptyDescription>{description ?? t('dropHint')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isInteractive}
              onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
              }}
            >
              {t('browse')}
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {description && hasFile ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      {displayError ? <FieldError>{displayError}</FieldError> : null}
    </Field>
  );
}
