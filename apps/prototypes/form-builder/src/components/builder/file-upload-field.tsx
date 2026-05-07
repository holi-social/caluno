'use client';

import { useRef } from 'react';
import { Button } from '@repo/ui';
import { Upload, X } from 'lucide-react';
import { useFileUpload, type UploadedFile } from '@/lib/use-file-upload';

const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

export function FileUploadField({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
}: {
  value: UploadedFile | null;
  onChange: (next: UploadedFile | null) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useFileUpload();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await upload(file);
    if (uploaded) onChange(uploaded);
  }

  function clear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
          <span className="flex-1 truncate">{value.filename}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={clear}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 size-4" />
          {uploading ? 'Wird hochgeladen...' : 'Datei auswählen'}
        </Button>
      )}
    </>
  );
}
