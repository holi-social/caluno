export const shiftShareUrl = (id?: string) => {
  if (process.env.NEXT_PUBLIC_WEB_URL)
    return `${process.env.NEXT_PUBLIC_WEB_URL}/shifts/${id}`;
  if (typeof window === 'undefined') return `/shifts/${id}`;
  return `${window.location.origin}/shifts/${id}`;
};

export const copyToClipboard = (id?: string) => {
  navigator.clipboard.writeText(shiftShareUrl(id));
};
