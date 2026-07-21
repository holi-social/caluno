export function eventShareUrl(id: string): string {
  return `${process.env.NEXT_PUBLIC_WEB_URL}/events/${id}`;
}
