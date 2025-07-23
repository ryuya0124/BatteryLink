import { verifyAuth0JWT } from '../utils.js';

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
  const auto_update = results.length ? results[0].auto_update : false;
  return new Response(JSON.stringify({ id: payload.sub, auto_update }), { status: 200, headers: { "Content-Type": "application/json" } });
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
    ).bind(payload.sub, auto_update).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log("handleAutoUpdate error:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
} 