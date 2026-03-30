export const organizationUnitUrl = (organizationUnitId?: string) => {
  return `${process.env.NEXT_PUBLIC_WEB_URL}/invite/${organizationUnitId}`;
};
