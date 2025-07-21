import { verifyJWT } from "../jwt.js";
import { randomOpaqueToken, sha256 } from "../utils.js";

export async function handleGetApiKeys(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) {
    return new Response("認証が必要です", { status: 401 });
  }
  try {
    const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
    const { results } = await env.DB.prepare(
      "SELECT id, label, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(payload.user_id).all();
    return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("認証エラー", { status: 401 });
  }
}

export async function handlePostApiKey(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) {
    return new Response("認証が必要です", { status: 401 });
  }
  try {
    const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
    const { label } = await request.json();
    const apiKey = randomOpaqueToken();
    const keyHash = await sha256(apiKey);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO api_keys (id, user_id, key_hash, label) VALUES (?, ?, ?, ?)`
    ).bind(id, payload.user_id, keyHash, label || null).run();
    return new Response(JSON.stringify({ apiKey, id }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("発行エラー", { status: 400 });
  }
}

export async function handlePatchApiKey(request, env, id) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) {
    return new Response("認証が必要です", { status: 401 });
  }
  try {
    const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
    const { label } = await request.json();
    await env.DB.prepare(
      `UPDATE api_keys SET label = ? WHERE id = ? AND user_id = ?`
    ).bind(label, id, payload.user_id).run();
    return new Response("ラベル更新完了", { status: 200 });
  } catch (e) {
    return new Response("ラベル更新エラー", { status: 400 });
  }
}

export async function handleDeleteApiKey(request, env, id) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) {
    return new Response("認証が必要です", { status: 401 });
  }
  try {
    const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
    await env.DB.prepare(
      `DELETE FROM api_keys WHERE id = ? AND user_id = ?`
    ).bind(id, payload.user_id).run();
    return new Response("削除完了", { status: 200 });
  } catch (e) {
    return new Response("削除エラー", { status: 400 });
  }
} 