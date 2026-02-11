export const shiftShareUrl = (id?: string) =>
  `${process.env.NEXT_PUBLIC_BACKOFFICE_URL}/shifts/${id}`;

export const copyToClipboard = (id?: string) => {
  navigator.clipboard.writeText(shiftShareUrl(id));
};
