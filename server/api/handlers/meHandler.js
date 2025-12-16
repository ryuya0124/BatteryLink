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

export async function handleMe(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = auth.slice(7);
  const payload = await verifyAuth0JWT(token);
  const { results } = await env.DB.prepare(
    "SELECT auto_update FROM user_settings WHERE user_id = ?"
  ).bind(payload.sub).all();
  const auto_update = results.length ? Boolean(results[0].auto_update) : false;
  return new Response(JSON.stringify({ id: payload.sub, auto_update }), { status: 200, headers: { "Content-Type": "application/json" } });
}

// Auth0 Management APIからユーザーのidentitiesを取得
export async function handleIdentities(request, env) {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }
    const token = auth.slice(7);
    const payload = await verifyAuth0JWT(token);
    const userId = payload.sub;

    // Management APIトークンを取得
    const mgmtToken = await getManagementApiToken(env);
    if (!mgmtToken) {
      return new Response(JSON.stringify({ error: 'Failed to get management token' }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Auth0からユーザー情報を取得
    const userRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}?fields=identities`, {
      headers: {
        Authorization: `Bearer ${mgmtToken}`
      }
    });

    if (!userRes.ok) {
      const err = await userRes.text();
      console.log('Failed to get user identities:', err);
      return new Response(JSON.stringify({ error: 'Failed to get identities' }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const userData = await userRes.json();
    const identities = (userData.identities || []).map(id => ({
      provider: id.provider,
      user_id: id.user_id,
      isSocial: id.isSocial ?? ['google-oauth2', 'facebook', 'twitter', 'github', 'apple', 'windowslive'].includes(id.provider)
    }));

    return new Response(JSON.stringify({ identities }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log('handleIdentities error:', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function handleAutoUpdate(request, env) {
  try {
    if (request.method !== "PATCH") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }
    const token = auth.slice(7);
    const payload = await verifyAuth0JWT(token);
    const { auto_update } = await request.json();

    await env.DB.prepare(
      `INSERT INTO user_settings (user_id, auto_update) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET auto_update = excluded.auto_update`
    ).bind(payload.sub, auto_update ? 1 : 0).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log("handleAutoUpdate error:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function handleDeviceDisplaySettings(request, env) {
  try {
    if (request.method === "GET") {
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
      }
      const token = auth.slice(7);
      const payload = await verifyAuth0JWT(token);
      const url = new URL(request.url);
      const deviceUuid = url.searchParams.get('device_uuid');
      
      if (!deviceUuid) {
        return new Response(JSON.stringify({ error: "Device UUID is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const { results } = await env.DB.prepare(
        "SELECT show_temperature, show_voltage FROM device_display_settings WHERE user_id = ? AND device_uuid = ?"
      ).bind(payload.sub, deviceUuid).all();
      
      // SQLiteの1/0をJavaScriptのtrue/falseに変換
      const settings = results.length ? {
        show_temperature: Boolean(results[0].show_temperature),
        show_voltage: Boolean(results[0].show_voltage)
      } : { show_temperature: true, show_voltage: true };
      
      return new Response(JSON.stringify(settings), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    
    if (request.method === "PATCH") {
      const auth = request.headers.get('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
      }
      const token = auth.slice(7);
      const payload = await verifyAuth0JWT(token);
      const { device_uuid, show_temperature, show_voltage } = await request.json();

      // JavaScriptのtrue/falseをSQLiteの1/0に変換
      await env.DB.prepare(
        `INSERT INTO device_display_settings (user_id, device_uuid, show_temperature, show_voltage) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, device_uuid) DO UPDATE SET 
           show_temperature = excluded.show_temperature,
           show_voltage = excluded.show_voltage`
      ).bind(payload.sub, device_uuid, show_temperature ? 1 : 0, show_voltage ? 1 : 0).run();

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log("handleDeviceDisplaySettings error:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
} 