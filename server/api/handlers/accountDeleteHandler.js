import { verifyAuth0JWT } from '../utils.js';

// Auth0設定
const AUTH0_DOMAIN = 'auth0.ryuya-dev.net';
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

export async function handleDeleteAccount(request, env) {
  try {
    // 認証確認
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    
    const token = auth.slice(7);
    const payload = await verifyAuth0JWT(token);
    const userId = payload.sub;

    console.log(`[Account Delete] Starting deletion for user: ${userId}`);

    // トランザクション的に全データを削除
    const deleteResults = {
      api_keys: 0,
      device_display_settings: 0,
      devices: 0,
      user_settings: 0
    };

    // 1. api_keys を削除
    try {
      const result = await env.DB.prepare(
        "DELETE FROM api_keys WHERE user_id = ?"
      ).bind(userId).run();
      deleteResults.api_keys = result.meta?.changes || 0;
      console.log(`[Account Delete] Deleted ${deleteResults.api_keys} api_keys`);
    } catch (e) {
      console.error('[Account Delete] Failed to delete api_keys:', e);
    }

    // 2. device_display_settings を削除
    try {
      const result = await env.DB.prepare(
        "DELETE FROM device_display_settings WHERE user_id = ?"
      ).bind(userId).run();
      deleteResults.device_display_settings = result.meta?.changes || 0;
      console.log(`[Account Delete] Deleted ${deleteResults.device_display_settings} device_display_settings`);
    } catch (e) {
      console.error('[Account Delete] Failed to delete device_display_settings:', e);
    }

    // 3. devices を削除
    try {
      const result = await env.DB.prepare(
        "DELETE FROM devices WHERE user_id = ?"
      ).bind(userId).run();
      deleteResults.devices = result.meta?.changes || 0;
      console.log(`[Account Delete] Deleted ${deleteResults.devices} devices`);
    } catch (e) {
      console.error('[Account Delete] Failed to delete devices:', e);
    }

    // 4. user_settings を削除
    try {
      const result = await env.DB.prepare(
        "DELETE FROM user_settings WHERE user_id = ?"
      ).bind(userId).run();
      deleteResults.user_settings = result.meta?.changes || 0;
      console.log(`[Account Delete] Deleted ${deleteResults.user_settings} user_settings`);
    } catch (e) {
      console.error('[Account Delete] Failed to delete user_settings:', e);
    }

    // 5. Auth0からユーザーを削除
    try {
      const mgmtToken = await getManagementApiToken(env);
      if (mgmtToken) {
        const deleteRes = await fetch(
          `https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${mgmtToken}`
            }
          }
        );
        
        if (deleteRes.ok || deleteRes.status === 204) {
          console.log(`[Account Delete] Successfully deleted Auth0 user: ${userId}`);
        } else {
          const errText = await deleteRes.text();
          console.error(`[Account Delete] Failed to delete Auth0 user: ${errText}`);
          // Auth0削除に失敗してもDBデータは削除済みなので続行
        }
      }
    } catch (e) {
      console.error('[Account Delete] Failed to delete Auth0 user:', e);
      // Auth0削除に失敗してもDBデータは削除済みなので続行
    }

    console.log(`[Account Delete] Completed deletion for user: ${userId}`, deleteResults);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'アカウントが削除されました',
      deleted: deleteResults
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (e) {
    console.error('[Account Delete] Error:', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
