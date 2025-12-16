import { verifyAuth0JWT } from '../utils.js';

// ユーザーJWT検証用
const AUTH0_DOMAIN = 'auth0.ryuya-dev.net'; // フロントのissuer
const AUTH0_AUDIENCE = 'https://batt.ryuya-dev.net/'; // フロントのaudience

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
    const mainUserId = originalPayload.sub;
    const linkUserId = linkPayload.sub;

    // 同一アカウントチェック
    if (mainUserId === linkUserId) {
      return new Response(JSON.stringify({ error: '同じアカウントはリンクできません。別のアカウントでログインしてください。' }), { status: 400 });
    }

    const [linkProvider, ...linkRest] = linkUserId.split('|');
    const [mainProvider] = mainUserId.split('|');
    const link_user_id = linkRest.join('|');

    if (!linkProvider || !link_user_id) {
      return new Response(JSON.stringify({ error: 'リンク元のIDが不正です' }), { status: 400 });
    }

    // 同じプロバイダー同士のリンクチェック
    if (mainProvider === linkProvider) {
      return new Response(JSON.stringify({ error: `既に${getProviderDisplayName(linkProvider)}でログインしています。別のプロバイダーのアカウントを連携してください。` }), { status: 400 });
    }

    const mgmtToken = await getManagementApiToken(env);
    console.log('mgmtToken', mgmtToken);

    // 既存のidentitiesを取得して、既にリンク済みか確認
    const userRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(mainUserId)}?fields=identities`, {
      headers: {
        Authorization: `Bearer ${mgmtToken}`
      }
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      const existingIdentities = userData.identities || [];
      const alreadyLinked = existingIdentities.some(id => id.provider === linkProvider && id.user_id === link_user_id);
      if (alreadyLinked) {
        return new Response(JSON.stringify({ error: `${getProviderDisplayName(linkProvider)}は既に連携済みです。` }), { status: 400 });
      }
    }

    const res = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(mainUserId)}/identities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider: linkProvider, user_id: link_user_id })
    });
    if (res.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      const err = await res.json().catch(() => ({}));
      // Auth0のエラーメッセージを日本語に変換
      if (err.message?.includes('Main identity and the new one are the same')) {
        return new Response(JSON.stringify({ error: '同じアカウントはリンクできません。' }), { status: 400 });
      }
      return new Response(JSON.stringify({ error: err.message || 'リンクに失敗しました' }), { status: 500 });
    }
  } catch (e) {
    console.error('accountLink error', e, typeof e, JSON.stringify(e));
    return new Response(JSON.stringify({ error: e && e.message ? e.message : String(e) }), { status: 500 });
  }
}

// プロバイダー名を日本語表示名に変換
function getProviderDisplayName(provider) {
  const names = {
    'google-oauth2': 'Google',
    'facebook': 'Facebook',
    'twitter': 'Twitter',
    'github': 'GitHub',
    'apple': 'Apple',
    'windowslive': 'Microsoft',
    'amazon': 'Amazon',
    'discord': 'Discord',
    'auth0': 'メール/パスワード'
  };
  return names[provider] || provider;
} 