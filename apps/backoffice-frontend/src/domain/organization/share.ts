export const organizationShareUrl = (id?: string) => {
  return `${process.env.NEXT_PUBLIC_WEB_URL}/invite/${id}`;
};
