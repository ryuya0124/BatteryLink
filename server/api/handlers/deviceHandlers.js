import { verifyJWT } from "../jwt.js";
import { randomOpaqueToken, sha256, verifyApiKeyAndUuid } from "../utils.js";

export async function handleGetDevices(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) {
    return new Response("認証が必要です", { status: 401 });
  }
  try {
    const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
    const { results } = await env.DB.prepare(
      "SELECT * FROM devices WHERE user_id = ? ORDER BY last_updated DESC"
    ).bind(payload.user_id).all();
    return new Response(JSON.stringify(results), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("認証エラー", { status: 401 });
  }
}

export async function handlePostDevice(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) {
    return new Response("認証が必要です", { status: 401 });
  }
  try {
    const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
    const body = await request.json();
    const uuid = body.uuid || crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO devices (id, user_id, uuid, name, brand, model, os_version, model_number, battery_level, is_charging, battery_capacity, temperature, voltage, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      payload.user_id,
      uuid,
      body.name,
      body.brand,
      body.model,
      body.os_version,
      body.model_number,
      body.battery_level,
      body.is_charging || false,
      body.battery_capacity || null,
      body.temperature || null,
      body.voltage || null,
      new Date().toISOString()
    ).run();
    return new Response("デバイス追加完了", { status: 201 });
  } catch (e) {
    return new Response("追加エラー", { status: 400 });
  }
}

export async function handlePutDevice(request, env, uuid) {
  const result = await verifyApiKeyAndUuid(request, env);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }
  const body = await request.json();
  await env.DB.prepare(
    `UPDATE devices SET battery_level=?, is_charging=?, battery_capacity=?, temperature=?, voltage=?, last_updated=? WHERE uuid=? AND user_id=?`
  ).bind(
    body.battery_level,
    body.is_charging,
    body.battery_capacity,
    body.temperature,
    body.voltage,
    new Date().toISOString(),
    uuid,
    result.userId
  ).run();
  return new Response("デバイス更新完了", { status: 200 });
}

export async function handleDeleteDevice(request, env, uuid) {
  const result = await verifyApiKeyAndUuid(request, env);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }
  await env.DB.prepare(
    `DELETE FROM devices WHERE uuid=? AND user_id=?`
  ).bind(uuid, result.userId).run();
  return new Response("デバイス削除完了", { status: 200 });
} 