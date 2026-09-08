import { verifyAuth0JWT } from '../utils.js';
import { errorResponse, readObject } from '../http.js';
import { managementToken, managementRequest } from '../management.js';

// ユーザーJWT検証用
const AUTH0_DOMAIN = 'auth0.ryuya-dev.net'; // フロントのissuer


export async function handleAccountLink(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  try {
    const { originalToken, linkToken } = await readObject(request);
    // JWT検証には共通ユーティリティを利用
    const originalPayload = await verifyAuth0JWT(originalToken, env);
    const linkPayload = await verifyAuth0JWT(linkToken, env);
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

    const mgmtToken = await managementToken(env);
    const profiles = await Promise.all([originalPayload.sub, linkPayload.sub].map(async id =>
      (await managementRequest(env, mgmtToken, `users/${encodeURIComponent(id)}`)).json()
    ));
    if (!profiles.every(profile => profile.email_verified === true && typeof profile.email === 'string' && profile.email.length > 0) ||
        profiles[0].email.toLowerCase() !== profiles[1].email.toLowerCase()) {
      return Response.json({ error: '両アカウントの確認済みメールアドレスが一致している必要があります' }, { status: 400 });
    }
    // Auth0 linking does not migrate application data. Avoid making existing
    // secondary-account devices and keys inaccessible until migration is supported.
    const secondaryData = await env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM devices WHERE user_id = ?) + (SELECT COUNT(*) FROM api_keys WHERE user_id = ?) AS count"
    ).bind(linkUserId, linkUserId).first();
    if (secondaryData?.count > 0) return Response.json({ error: '連携先にデバイスまたはAPIキーがあります。データを整理してから連携してください。' }, { status: 409 });
    if (!mgmtToken) {
      return new Response(JSON.stringify({ error: '認証サービスに接続できません' }), { status: 502 });
    }

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
    return errorResponse(e);
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
