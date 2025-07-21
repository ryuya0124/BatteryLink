import bcrypt from "bcryptjs";
import { signJWT } from "./jwt.js";
import { randomOpaqueToken, sha256 } from "./utils.js";

export async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    const { results } = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).all();
    console.log("LOGIN results:", results);
    if (!results.length) return new Response("Unauthorized", { status: 401 });
    const user = results[0];
    console.log("LOGIN user:", user);
    if (!user.password_hash) {
      console.log("LOGIN ERROR: password_hash missing");
      return new Response("Unauthorized", { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    console.log("bcrypt.compare result:", ok);
    if (!ok) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.log("before signJWT");
    const jwt = await signJWT(
      { user_id: user.id, scope: "user" },
      env.JWT_PRIVATE_KEY,
      { expiresIn: 900 }
    );
    console.log("after signJWT");
    const refresh = randomOpaqueToken();
    console.log("after randomOpaqueToken");
    const refreshHash = await sha256(refresh);
    console.log("after sha256");
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await env.DB.prepare(
      "INSERT INTO refresh_tokens (id, user_id, token_hash, issued_at, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      crypto.randomUUID(),
      user.id,
      refreshHash,
      now.toISOString(),
      expires.toISOString(),
      request.headers.get("CF-Connecting-IP") || "",
      request.headers.get("User-Agent") || ""
    ).run();
    console.log("after DB insert");
    const cookieRefresh = `refresh_token=${refresh}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
    const cookieToken = `token=${jwt}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`;
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Set-Cookie", cookieToken);
    headers.append("Set-Cookie", cookieRefresh);
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    let detail = "";
    try {
      detail = err && (err.message || err.toString()) ? (err.message || err.toString()) : JSON.stringify(err);
    } catch (e) {
      detail = "unknown";
    }
    console.log("LOGIN ERROR", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", detail }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleRefresh(request, env) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/refresh_token=([^;]+)/);
    if (!match) return new Response("Unauthorized", { status: 401 });
    const refresh = match[1];
    const refreshHash = await sha256(refresh);
    const { results } = await env.DB.prepare(
      "SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > ?"
    ).bind(refreshHash, new Date().toISOString()).all();
    if (!results.length) return new Response("Unauthorized", { status: 401 });
    const token = results[0];
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const ua = request.headers.get("User-Agent") || "";
    if (token.ip !== ip || token.user_agent !== ua) {
      return new Response("Suspicious", { status: 403 });
    }
    const jwt = await signJWT(
      { user_id: token.user_id, scope: "user" },
      env.JWT_PRIVATE_KEY,
      { expiresIn: 900 }
    );
    const newRefresh = randomOpaqueToken();
    const newRefreshHash = await sha256(newRefresh);
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await env.DB.prepare(
      "UPDATE refresh_tokens SET token_hash = ?, issued_at = ?, expires_at = ? WHERE id = ?"
    ).bind(
      newRefreshHash,
      now.toISOString(),
      expires.toISOString(),
      token.id
    ).run();
    const cookieRefresh = `refresh_token=${newRefresh}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
    const cookieToken = `token=${jwt}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`;
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Set-Cookie", cookieToken);
    headers.append("Set-Cookie", cookieRefresh);
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.log("REFRESH ERROR", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", detail: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function handleLogout(request, env) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/refresh_token=([^;]+)/);
    if (!match) return new Response("OK", { status: 200 });
    const refresh = match[1];
    const refreshHash = await sha256(refresh);
    await env.DB.prepare("DELETE FROM refresh_tokens WHERE token_hash = ?").bind(refreshHash).run();
    const delCookie = `refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": delCookie
      }
    });
  } catch (err) {
    console.log("LOGOUT ERROR", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", detail: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function handleSignup(request, env) {
  try {
    const { email, password } = await request.json();
    const { results } = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).all();
    if (results.length) {
      return new Response(
        JSON.stringify({ error: "既に登録されています" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user_id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
    ).bind(
      user_id,
      email,
      password_hash,
      new Date().toISOString()
    ).run();
    const jwt = await signJWT(
      { user_id, scope: "user" },
      env.JWT_PRIVATE_KEY,
      { expiresIn: 900 }
    );
    const refresh = randomOpaqueToken();
    const refreshHash = await sha256(refresh);
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await env.DB.prepare(
      "INSERT INTO refresh_tokens (id, user_id, token_hash, issued_at, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      crypto.randomUUID(),
      user_id,
      refreshHash,
      now.toISOString(),
      expires.toISOString(),
      request.headers.get("CF-Connecting-IP") || "",
      request.headers.get("User-Agent") || ""
    ).run();
    const cookieRefresh = `refresh_token=${refresh}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
    const cookieToken = `token=${jwt}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`;
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Set-Cookie", cookieToken);
    headers.append("Set-Cookie", cookieRefresh);
    return new Response(JSON.stringify({ token: jwt }), { headers });
  } catch (err) {
    console.log("SIGNUP ERROR", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", detail: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}