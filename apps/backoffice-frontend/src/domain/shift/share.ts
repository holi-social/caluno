import { toast } from 'sonner';

const shiftPath = (id?: string) => `/shifts/${id}`;

export const shiftShareUrl = (id?: string) => {
  return `${process.env.NEXT_PUBLIC_WEB_URL}${shiftPath(id)}`;
};

export const copyToClipboard = async (id?: string) => {
  await navigator.clipboard.writeText(shiftShareUrl(id));
  toast.info('Link copied to clipboard');
};
