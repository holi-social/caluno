export const shiftPath = (id?: string) => `/shifts/${id}`;

export const shiftShareUrl = (id?: string) => {
  if (process.env.NEXT_PUBLIC_WEB_URL)
    return `${process.env.NEXT_PUBLIC_WEB_URL}${shiftPath(id)}`;
  // Fallback to relative path when no public URL is configured.
  if (typeof window === 'undefined') return shiftPath(id);
  return `${window.location.origin}${shiftPath(id)}`;
};

export const copyToClipboard = (id?: string) => {
  navigator.clipboard.writeText(shiftShareUrl(id));
};
