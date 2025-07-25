import { verifyAuth0JWT } from '../utils.js';

// ユーザーJWT検証用
const AUTH0_DOMAIN = 'auth0.batterysync.net'; // フロントのissuer
const AUTH0_AUDIENCE = 'https://batterysync.net/'; // フロントのaudience

// 管理API用audience（トークン取得用）
const MGMT_API_AUDIENCE = 'https://batterysync.jp.auth0.com/api/v2/';

async function getManagementApiToken(env) {
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.MGMT_CLIENT_ID,
      client_secret: env.MGMT_CLIENT_SECRET,
      audience: MGMT_API_AUDIENCE
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
    // JWT検証には共通ユーティリティを利用
    const originalPayload = await verifyAuth0JWT(originalToken);
    const linkPayload = await verifyAuth0JWT(linkToken);
    if (originalPayload.email !== linkPayload.email) {
      return new Response(JSON.stringify({ error: 'メールアドレスが一致しません' }), { status: 400 });
    }
    const mgmtToken = await getManagementApiToken(env);
    console.log('mgmtToken', mgmtToken);
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
    console.error('accountLink error', e, typeof e, JSON.stringify(e));
    return new Response(JSON.stringify({ error: e && e.message ? e.message : String(e) }), { status: 500 });
  }
} 