// server/api/utils.js
export function randomOpaqueToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  export async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

// APIキー＋UUID認証ミドルウェア
export async function verifyApiKeyAndUuid(request, env, uuid) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return { ok: false, status: 401, message: "APIキーが必要です" };
  }
  console.log("uuid:", uuid);
  if (!uuid) {
    return { ok: false, status: 400, message: "UUIDが必要です" };
  }
  // APIキーのハッシュ化
  const keyHash = await sha256(apiKey);
  // api_keysテーブルでAPIキーの存在とuser_id取得
  const { results: keyResults } = await env.DB.prepare(
    "SELECT * FROM api_keys WHERE key_hash = ?"
  ).bind(keyHash).all();
  if (!keyResults.length) {
    return { ok: false, status: 403, message: "APIキーが不正です" };
  }
  const userId = keyResults[0].user_id;
  // devicesテーブルでuuidとuser_idの一致を確認
  const { results: deviceResults } = await env.DB.prepare(
    "SELECT * FROM devices WHERE uuid = ? AND user_id = ?"
  ).bind(uuid, userId).all();
  if (!deviceResults.length) {
    return { ok: false, status: 403, message: "UUIDが不正です" };
  }
  return { ok: true, userId, device: deviceResults[0] };
}