import { createHash, timingSafeEqual } from 'node:crypto';

function sha256Utf8(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function timingSafeEqualString(a: string, b: string): boolean {
  const ha = sha256Utf8(a);
  const hb = sha256Utf8(b);
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  return timingSafeEqualString(username, u) && timingSafeEqualString(password, p);
}
