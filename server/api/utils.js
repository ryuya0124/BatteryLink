// server/api/utils.js
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { ApiError } from './http.js';

const AUTH0_DOMAIN = 'auth0.ryuya-dev.net'; // 例: dev-xxxxxx.us.auth0.com
const AUTH0_AUDIENCE = 'https://batt.ryuya-dev.net/';
const keySets = new Map();

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
  if (!apiKey || apiKey.length > 256) {
    return { ok: false, status: 401, message: "APIキーが必要です" };
  }
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
  await env.DB.prepare(
    "UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(keyResults[0].id).run();
  return { ok: true, userId, device: deviceResults[0] };
}

export async function verifyAuth0JWT(token, env = {}) {
  const domain = env.AUTH0_DOMAIN || AUTH0_DOMAIN;
  if (!keySets.has(domain)) keySets.set(domain, createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`)));
  const JWKS = keySets.get(domain);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://${domain}/`,
    audience: env.AUTH0_AUDIENCE || AUTH0_AUDIENCE,
    algorithms: ['RS256'],
    requiredClaims: ['sub', 'exp', 'iat'],
  });
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.endsWith('@clients')) throw new ApiError(401, 'Unauthorized');
  return payload;
  } catch (error) {
    if (error.code === 'ERR_JWKS_TIMEOUT' || error instanceof TypeError) {
      throw new ApiError(503, 'Authentication service unavailable');
    }
    throw new ApiError(401, 'Unauthorized');
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function isFiniteNumberInRange(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
