/** Public volunteer shift detail path. Pass instanceId when a concrete occurrence is known. */
export const shiftPublicPath = (id?: string, instanceId?: string) => {
  const path = `/shifts/${id}`;
  if (!instanceId) return path;
  return `${path}?instanceId=${encodeURIComponent(instanceId)}`;
};

export const shiftShareUrl = (id?: string, instanceId?: string) => {
  return `${process.env.NEXT_PUBLIC_WEB_URL}${shiftPublicPath(id, instanceId)}`;
};
