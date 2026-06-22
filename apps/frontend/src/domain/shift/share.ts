const shiftPath = (id?: string, instanceId?: string) => {
  const path = `/shifts/${id}`;
  if (!instanceId) return path;
  return `${path}?instanceId=${encodeURIComponent(instanceId)}`;
};

export const shiftShareUrl = (id?: string, instanceId?: string) => {
  return `${process.env.NEXT_PUBLIC_WEB_URL}${shiftPath(id, instanceId)}`;
};
