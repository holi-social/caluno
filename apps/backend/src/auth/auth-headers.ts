export function headersFromRequest(request?: Request): Record<string, unknown> {
  if (!request?.headers) {
    return {};
  }

  const headers: Record<string, unknown> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}
