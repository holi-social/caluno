import { toast } from 'sonner';

export const copyToClipboard = async (text: string, toastMessage: string) => {
  await navigator.clipboard.writeText(text);
  toast.info(toastMessage);
};
