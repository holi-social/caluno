/**
 * Mask an email address so it is safe for logs:
 * `john.doe@example.com` → `jo***@***.com`.
 * Never log raw email addresses.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) {
    return '***';
  }
  const maskedLocal =
    local.length <= 2 ? `${local[0] ?? ''}***` : `${local.slice(0, 2)}***`;

  const dotIndex = domain.lastIndexOf('.');
  const maskedDomain = dotIndex === -1 ? '***' : `***${domain.slice(dotIndex)}`;

  return `${maskedLocal}@${maskedDomain}`;
}
