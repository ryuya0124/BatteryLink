export async function limitBody(c, next) {
  const request = c.req.raw;
  if (!request.body) return next();
  const maxSize = 16 * 1024;
  const tooLarge = () => c.json({ error: 'Request body exceeds 16 KiB' }, 413);
  if (Number(request.headers.get('Content-Length')) > maxSize) return tooLarge();
  // Count actual streamed bytes too: never trust a missing or false length header.
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxSize) {
      await reader.cancel().catch(() => {});
      return tooLarge();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  c.req.raw = new Request(request, { body });
  return next();
}

export async function rateLimit(c, next) {
  if (c.req.method === 'OPTIONS') return next();
  const ip = c.req.header('CF-Connecting-IP') || 'local';
  const sensitive = c.req.path === '/api/link-account' || c.req.path === '/api/auth/account' ||
    (c.req.path === '/api/api-keys' && c.req.method === 'POST');
  const limiter = sensitive ? c.env?.ACCOUNT_RATE_LIMITER : c.env?.API_RATE_LIMITER;
  if (limiter) {
    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      c.header('Retry-After', '60');
      return c.json({ error: 'Too many requests. Please retry later.' }, 429);
    }
  }
  return next();
}
