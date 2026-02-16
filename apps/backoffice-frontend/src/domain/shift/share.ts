export const shiftShareUrl = (id?: string) => `/shifts/${id}`;

export const copyToClipboard = (id?: string) => {
  navigator.clipboard.writeText(shiftShareUrl(id));
};
