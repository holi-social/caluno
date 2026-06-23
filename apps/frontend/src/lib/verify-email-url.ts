interface VerifyEmailPathOptions {
  email?: string;
  redirectTo?: string;
  codeSent?: boolean;
}

export function getVerifyEmailPath({
  email,
  redirectTo,
  codeSent = false,
}: VerifyEmailPathOptions = {}) {
  const params = new URLSearchParams();

  if (email) {
    params.set('email', email);
  }

  if (codeSent) {
    params.set('codeSent', '1');
  }

  if (redirectTo && redirectTo !== '/') {
    params.set('redirectTo', redirectTo);
  }

  const query = params.toString();
  return query ? `/verify-email?${query}` : '/verify-email';
}
