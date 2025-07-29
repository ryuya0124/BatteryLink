import { verifyAuth0JWT } from '../utils.js';
import { randomOpaqueToken, sha256, verifyApiKeyAndUuid } from "../utils.js";

// 全角英数字を半角に変換する関数
function convertToHalfWidth(text) {
  if (!text) return text;
  return text
    .replace(/[Ａ-Ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[ａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

export async function handleGetDevices(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = auth.slice(7);
  const payload = await verifyAuth0JWT(token);
  try {
    // idを除外しuuidのみ返す
    const { results } = await env.DB.prepare(
      "SELECT uuid, name, brand, model, os_version, model_number, battery_level, last_updated, user_id, is_charging, temperature, voltage FROM devices WHERE user_id = ? ORDER BY last_updated DESC"
    ).bind(payload.sub).all();
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      }　
    });
  } catch (e) {
    console.log("handleGetDevices error:", e);
    return new Response("認証エラー", { status: 401 });
  }
}

export async function handlePostDevice(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = auth.slice(7);
  const payload = await verifyAuth0JWT(token);
  
  try {
    const device = await request.json();
    
    // デバイス名を半角に変換
    if (device.name) {
      device.name = convertToHalfWidth(device.name);
    }

    // undefinedの値をnullに変換
    const batteryLevel = device.battery_level !== undefined ? device.battery_level : null;
    const temperature = device.temperature !== undefined ? device.temperature : null;
    const voltage = device.voltage !== undefined ? device.voltage : null;
    const isCharging = device.is_charging !== undefined ? (device.is_charging ? 1 : 0) : 0;

    const { results } = await env.DB.prepare(
      "INSERT INTO devices (uuid, user_id, name, brand, model, model_number, battery_level, last_updated, is_charging, temperature, voltage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      device.uuid,
      payload.sub,
      device.name,
      device.brand,
      device.model,
      device.model_number,
      batteryLevel,
      device.last_updated,
      isCharging,
      temperature,
      voltage
    ).run();

    return new Response(JSON.stringify({ success: true, device }), { status: 201 });
  } catch (error) {
    console.error("デバイス作成エラー:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function handlePutDevice(request, env, uuid) {
  const result = await verifyApiKeyAndUuid(request, env, uuid);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }
  const body = await request.json();
  await env.DB.prepare(
    `UPDATE devices SET battery_level=?, is_charging=?, temperature=?, voltage=?, os_version=?, last_updated=? WHERE uuid=? AND user_id=?`
  ).bind(
    body.battery_level,
    body.is_charging,
    body.temperature,
    body.voltage,
    body.os_version || null,
    new Date().toISOString(),
    uuid,
    result.userId
  ).run();
  return new Response("デバイス更新完了", { status: 200 });
}

export async function handlePatchDevice(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = auth.slice(7);
  const payload = await verifyAuth0JWT(token);
  
  try {
    const url = new URL(request.url);
    const uuid = url.pathname.split('/').pop();
    const updates = await request.json();
    
    // デバイス名を半角に変換
    if (updates.name) {
      updates.name = convertToHalfWidth(updates.name);
    }

    // 更新可能なフィールドのみを許可
    const allowedFields = ['name', 'brand', 'model', 'model_number'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
      return new Response(JSON.stringify({ error: "No valid fields to update" }), { status: 400 });
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => updates[field]);
    values.push(uuid, payload.sub);

    const { results } = await env.DB.prepare(
      `UPDATE devices SET ${setClause} WHERE uuid = ? AND user_id = ?`
    ).bind(...values).run();

    if (results.changes === 0) {
      return new Response(JSON.stringify({ error: "Device not found or unauthorized" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("デバイス更新エラー:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function handleDeleteDevice(request, env, uuid) {
  // まずJWT認証を試す
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const payload = await verifyAuth0JWT(token);
      await env.DB.prepare(
        `DELETE FROM devices WHERE uuid=? AND user_id=?`
      ).bind(uuid, payload.sub).run();
      return new Response("デバイス削除完了", { status: 200 });
    } catch (e) {
      // JWT認証失敗時はAPIキー認証にフォールバック
    }
  }
  // APIキー認証（従来通り）
  const result = await verifyApiKeyAndUuid(request, env, uuid);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }
  await env.DB.prepare(
    `DELETE FROM devices WHERE uuid=? AND user_id=?`
  ).bind(uuid, result.userId).run();
  return new Response("デバイス削除完了", { status: 200 });
}

// /api/battery/:uuid
export async function handleGetBatteryInfo(request, env, uuid) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const token = auth.slice(7);
  const payload = await verifyAuth0JWT(token);
  try {
    const { results } = await env.DB.prepare(
      "SELECT battery_level, is_charging, temperature, voltage, last_updated FROM devices WHERE uuid = ? AND user_id = ?"
    ).bind(uuid, payload.sub).all();
    if (!results.length) {
      return new Response(JSON.stringify({ success: false, error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(
      JSON.stringify({ success: true, data: results[0] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "認証エラー" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
} 