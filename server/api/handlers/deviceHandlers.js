import { isFiniteNumberInRange, json, verifyApiKeyAndUuid, verifyAuth0JWT } from "../utils.js";
import { errorResponse, readObject } from '../http.js';

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
  try {
    const payload = await verifyAuth0JWT(token, env);
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
    return errorResponse(e);
  }
}

export async function handlePostDevice(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const payload = await verifyAuth0JWT(token, env);
    const device = await readObject(request);
    for (const field of ['uuid', 'name', 'brand', 'model', 'model_number']) {
      if (device[field] != null && (typeof device[field] !== 'string' || device[field].length > 256)) return json({ error: `Invalid ${field}` }, 400);
    }
    if (device.is_charging != null && ![true, false, 0, 1].includes(device.is_charging)) return json({ error: 'Invalid is_charging' }, 400);
    if (device.temperature != null && !isFiniteNumberInRange(device.temperature, -100, 200)) return json({ error: 'Invalid temperature' }, 400);
    if (device.voltage != null && typeof device.voltage !== 'string' && typeof device.voltage !== 'number') return json({ error: 'Invalid voltage' }, 400);
    if (typeof device.uuid !== "string" || !device.uuid.trim() || typeof device.name !== "string" || !device.name.trim()) {
      return json({ error: "uuid and name are required" }, 400);
    }
    if (device.battery_level != null && !isFiniteNumberInRange(device.battery_level, 0, 100)) {
      return json({ error: "battery_level must be between 0 and 100" }, 400);
    }
    
    // デバイス名を半角に変換
    if (device.name) {
      device.name = convertToHalfWidth(device.name);
    }

    // undefinedの値をnullに変換
    const batteryLevel = device.battery_level !== undefined ? device.battery_level : null;
    const temperature = device.temperature !== undefined ? device.temperature : null;
    const voltage = device.voltage !== undefined ? device.voltage : null;
    const isCharging = device.is_charging !== undefined ? (device.is_charging ? 1 : 0) : 0;

    await env.DB.prepare(
      "INSERT INTO devices (uuid, user_id, name, brand, model, model_number, battery_level, last_updated, is_charging, temperature, voltage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      device.uuid,
      payload.sub,
      device.name,
      device.brand ?? null,
      device.model ?? null,
      device.model_number ?? null,
      batteryLevel,
      new Date().toISOString(),
      isCharging,
      temperature,
      voltage
    ).run();

    return new Response(JSON.stringify({ success: true, device }), { status: 201 });
  } catch (error) {
    console.error("デバイス作成エラー:", error);
    return errorResponse(error);
  }
}

export async function handlePutDevice(request, env, uuid) {
  const result = await verifyApiKeyAndUuid(request, env, uuid);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }
  const body = await readObject(request);
  if (!isFiniteNumberInRange(body.battery_level, 0, 100) || ![true, false, 0, 1].includes(body.is_charging)) {
    return json({ error: "battery_level (0-100) and boolean is_charging are required" }, 400);
  }
  if (body.temperature != null && !isFiniteNumberInRange(body.temperature, -100, 200)) return json({ error: 'Invalid temperature' }, 400);
  if (body.voltage != null && !(typeof body.voltage === 'string' || (typeof body.voltage === 'number' && Number.isFinite(body.voltage)))) return json({ error: 'Invalid voltage' }, 400);
  if (body.os_version != null && typeof body.os_version !== 'string') return json({ error: 'Invalid os_version' }, 400);
  await env.DB.prepare(
    `UPDATE devices SET battery_level=?, is_charging=?, temperature=?, voltage=?, os_version=?, last_updated=? WHERE uuid=? AND user_id=?`
  ).bind(
    body.battery_level,
    body.is_charging ? 1 : 0,
    body.temperature ?? null,
    body.voltage ?? null,
    body.os_version || null,
    new Date().toISOString(),
    uuid,
    result.userId
  ).run();
  return new Response("デバイス更新完了", { status: 200 });
}

export async function handlePatchDevice(request, env, uuid) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const payload = await verifyAuth0JWT(token, env);
    const updates = await readObject(request);
    for (const field of ['name', 'brand', 'model', 'model_number']) {
      if (field in updates && (typeof updates[field] !== 'string' || updates[field].length > 256)) return json({ error: `Invalid ${field}` }, 400);
    }
    if ('name' in updates && !updates.name.trim()) return json({ error: 'Name is required' }, 400);
    
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

    const result = await env.DB.prepare(
      `UPDATE devices SET ${setClause} WHERE uuid = ? AND user_id = ?`
    ).bind(...values).run();

    if ((result.meta?.changes ?? 0) === 0) {
      return new Response(JSON.stringify({ error: "Device not found or unauthorized" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("デバイス更新エラー:", error);
    return errorResponse(error);
  }
}

export async function handleDeleteDevice(request, env, uuid) {
  // まずJWT認証を試す
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const payload = await verifyAuth0JWT(token, env);
      const result = await env.DB.prepare(
        `DELETE FROM devices WHERE uuid=? AND user_id=?`
      ).bind(uuid, payload.sub).run();
      if ((result.meta?.changes ?? 0) === 0) return json({ error: "Device not found" }, 404);
      return json({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  }
  // Telemetry keys cannot perform destructive management operations.
  return json({ error: 'Auth0 login is required to delete a device' }, 401);
}

// /api/battery/:uuid
export async function handleGetBatteryInfo(request, env, uuid) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const token = auth.slice(7);
  try {
    const payload = await verifyAuth0JWT(token, env);
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
  } catch (error) {
    return errorResponse(error);
  }
}
