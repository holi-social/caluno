import { toast } from 'sonner';

export const copyToClipboard = async (
  text: string,
  toastMessage: string = 'Link copied to clipboard',
) => {
  await navigator.clipboard.writeText(text);
  toast.info(toastMessage);
};
