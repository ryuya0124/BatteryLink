import { ApiError } from './http.js';

export async function managementToken(env) {
  if (!env.MGMT_CLIENT_ID || !env.MGMT_CLIENT_SECRET) throw new ApiError(503, 'Account management is not configured');
  const domain = env.AUTH0_DOMAIN || 'auth0.ryuya-dev.net';
  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.MGMT_CLIENT_ID,
      client_secret: env.MGMT_CLIENT_SECRET,
      audience: env.MGMT_API_AUDIENCE || 'https://batterysync.jp.auth0.com/api/v2/',
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(502, 'Account management service unavailable');
  const data = await response.json();
  if (typeof data.access_token !== 'string' || !data.access_token) throw new ApiError(502, 'Account management service unavailable');
  return data.access_token;
}

export async function managementRequest(env, token, path, init = {}) {
  const response = await fetch(`https://${env.AUTH0_DOMAIN || 'auth0.ryuya-dev.net'}/api/v2/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok && !(init.method === 'DELETE' && response.status === 404)) {
    throw new ApiError(502, 'Account management operation failed');
  }
  return response;
}
