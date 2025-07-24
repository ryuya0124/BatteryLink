// Auth0 Post Login Action サンプルコード（トークン取得エラー詳細ログ追加）
// Secrets: AUTH0_DOMAIN, MGMT_CLIENT_ID, MGMT_CLIENT_SECRET

exports.onExecutePostLogin = async (event, api) => {
  try {
    const domain = event.secrets.AUTH0_DOMAIN;
    const clientId = event.secrets.MGMT_CLIENT_ID;
    const clientSecret = event.secrets.MGMT_CLIENT_SECRET;

    // デバッグログ追加
    console.log('event.user:', event.user);
    console.log('event.user.identities:', event.user && event.user.identities);

    // 1. Management APIトークンを取得
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`
      })
    });
    const tokenJson = await tokenRes.json();
    console.log('tokenJson:', tokenJson); // 追加
    const access_token = tokenJson.access_token;
    if (!access_token) {
      console.log('Failed to get management API token:', tokenJson);
      if (tokenJson.error) {
        console.log('token error:', tokenJson.error, tokenJson.error_description);
      }
      return;
    }

    // 2. users-by-emailエンドポイントで同じメールのユーザーを検索
    const res = await fetch(`https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(event.user.email)}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });
    const users = await res.json();

    let sameEmailUsers = [];
    if (Array.isArray(users)) {
      sameEmailUsers = users.filter(u => u.user_id !== event.user.user_id);
    } else {
      console.log('users-by-email API error:', users);
      return;
    }

    if (sameEmailUsers.length > 0) {
      api.idToken.setCustomClaim('https://batterysync.net/account_link_candidate', true);
      api.idToken.setCustomClaim('https://batterysync.net/account_link_candidates', sameEmailUsers.map(u => u.user_id));
    }

    // identitiesをidTokenに含める（配列で1件以上ある場合のみ）
    if (event.user && Array.isArray(event.user.identities) && event.user.identities.length > 0) {
      api.idToken.setCustomClaim('https://batterysync.net/identities', event.user.identities);
    }
  } catch (e) {
    console.log('Post Login Action error:', e);
  }
}; 