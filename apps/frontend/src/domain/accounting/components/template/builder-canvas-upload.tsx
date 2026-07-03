'use client';

import { UploadCloudIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

interface TemplateBuilderUploadZoneProps {
  onFileSelected: (file: File) => void;
}

export function TemplateBuilderUploadZone({
  onFileSelected,
}: TemplateBuilderUploadZoneProps) {
  const t = useTranslations('Accounting.templates.builder.upload');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      onFileSelected(file);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/40 p-8 text-center"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background border border-border">
        <UploadCloudIcon
          size={28}
          className="text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{t('title')}</p>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>{t('dragHint')}</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
        >
          {t('browseButton')}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{t('fileConstraint')}</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handleChange}
        aria-label={t('browseButton')}
      />
    </div>
  );
}
