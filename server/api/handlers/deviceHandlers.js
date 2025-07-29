import { verifyAuth0JWT } from '../utils.js';
import { randomOpaqueToken, sha256, verifyApiKeyAndUuid } from "../utils.js";

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
    const body = await request.json();
    const uuid = body.uuid || crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO devices (id, user_id, uuid, name, brand, model, os_version, model_number, battery_level, is_charging, temperature, voltage, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      payload.sub,
      uuid,
      body.name !== undefined ? body.name : null,
      body.brand !== undefined ? body.brand : null,
      body.model !== undefined ? body.model : null,
      body.os_version !== undefined ? body.os_version : null,
      body.model_number !== undefined ? body.model_number : null,
      body.battery_level !== undefined ? body.battery_level : null,
      body.is_charging !== undefined ? body.is_charging : null,
      body.temperature !== undefined ? body.temperature : null,
      body.voltage !== undefined ? body.voltage : null,
      new Date().toISOString()
    ).run();
    return new Response("デバイス追加完了", { status: 201 });
  } catch (e) {
    console.log("handlePostDevice error:", e);
    return new Response("追加エラー", { status: 400 });
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

export async function handlePatchDevice(request, env, uuid) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const token = auth.slice(7);
  const payload = await verifyAuth0JWT(token);
  try {
    const body = await request.json();
    const updateFields = [];
    const bindValues = [];
    
    // 更新可能なフィールドをチェック
    if (body.name !== undefined) {
      updateFields.push('name = ?');
      bindValues.push(body.name);
    }
    if (body.brand !== undefined) {
      updateFields.push('brand = ?');
      bindValues.push(body.brand);
    }
    if (body.model !== undefined) {
      updateFields.push('model = ?');
      bindValues.push(body.model);
    }
    if (body.model_number !== undefined) {
      updateFields.push('model_number = ?');
      bindValues.push(body.model_number);
    }
    
    if (updateFields.length === 0) {
      return new Response("更新するフィールドがありません", { status: 400 });
    }
    
    updateFields.push('last_updated = ?');
    bindValues.push(new Date().toISOString());
    bindValues.push(uuid);
    bindValues.push(payload.sub);
    
    await env.DB.prepare(
      `UPDATE devices SET ${updateFields.join(', ')} WHERE uuid = ? AND user_id = ?`
    ).bind(...bindValues).run();
    
    return new Response("デバイス編集完了", { status: 200 });
  } catch (e) {
    console.log("handlePatchDevice error:", e);
    return new Response("編集エラー", { status: 400 });
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