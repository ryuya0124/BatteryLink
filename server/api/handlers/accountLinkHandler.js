import { jwtVerify, createRemoteJWKSet } from 'jose';

// Auth0の設定
const AUTH0_DOMAIN = 'auth0.batterysync.net';
const AUTH0_AUDIENCE = 'https://batterysync.net/';
const JWKS = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));

async function verifyJWT(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://${AUTH0_DOMAIN}/`,
    audience: AUTH0_AUDIENCE,
  });
  return payload;
}

async function getManagementApiToken(env) {
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.MGMT_CLIENT_ID,
      client_secret: env.MGMT_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`
    })
  });
  const data = await res.json();
  return data.access_token;
}

export async function handleAccountLink(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  try {
    const { originalToken, linkToken } = await request.json();
    const originalPayload = await verifyJWT(originalToken);
    const linkPayload = await verifyJWT(linkToken);
    if (originalPayload.email !== linkPayload.email) {
      return new Response(JSON.stringify({ error: 'メールアドレスが一致しません' }), { status: 400 });
    }
    const mgmtToken = await getManagementApiToken(env);
    const mainUserId = originalPayload.sub;
    const linkUserId = linkPayload.sub;
    const [provider, user_id] = linkUserId.split('|');
    const res = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${mainUserId}/identities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider, user_id })
    });
    if (res.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
} 