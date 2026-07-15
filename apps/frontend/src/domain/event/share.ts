export function eventShareUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_WEB_URL}/events/${slug}`;
}
