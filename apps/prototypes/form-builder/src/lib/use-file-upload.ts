'use client';

import { useState } from 'react';

export type UploadedFile = { url: string; filename: string };

/** Posts a file to /api/uploads and tracks pending state. */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<UploadedFile | null> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as UploadedFile;
      return data;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, upload };
}
