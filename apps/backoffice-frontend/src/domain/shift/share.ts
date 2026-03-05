const shiftPath = (id?: string) => `/shifts/${id}`;

export const shiftShareUrl = (id?: string) => {
  return `${process.env.NEXT_PUBLIC_WEB_URL}${shiftPath(id)}`;
};
