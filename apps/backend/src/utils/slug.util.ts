import ShortUniqueId from 'short-unique-id';

const uid = new ShortUniqueId({ length: 10 });

function sanitizeSlugPart(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugify(name: string): string {
  const baseSlug = sanitizeSlugPart(name);
  return baseSlug ? `${baseSlug}-${uid.rnd()}` : `slug-${uid.rnd()}`;
}
