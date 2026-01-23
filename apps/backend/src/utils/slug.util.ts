import ShortUniqueId from 'short-unique-id';

const uid = new ShortUniqueId({ length: 10 });

export function slugify(name: string): string {
  const baseSlug = name.toLowerCase().replace(/\s+/g, '-');
  return `${baseSlug}-${uid.rnd()}`;
}
