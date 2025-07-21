export async function handleMe(request, env) {
  if (request.method === "PATCH") {
    try {
      const cookie = request.headers.get("Cookie") || "";
      const match = cookie.match(/token=([^;]+)/);
      const token = match ? match[1] : null;
      if (!token) {
        return new Response(JSON.stringify({ error: "認証が必要です" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      const { verifyJWT } = await import("../jwt.js");
      const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
      const { auto_update } = await request.json();
      await env.DB.prepare("UPDATE users SET auto_update = ? WHERE id = ?").bind(auto_update, payload.user_id).run();
      // 最新値を返す
      const { results } = await env.DB.prepare("SELECT email, auto_update FROM users WHERE id = ?").bind(payload.user_id).all();
      const email = results.length ? results[0].email : null;
      const updated_auto_update = results.length ? results[0].auto_update : null;
      return new Response(JSON.stringify({ id: payload.user_id, email, auto_update: updated_auto_update }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "更新エラー" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  }
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) {
    return new Response(JSON.stringify({ error: "認証が必要です" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  try {
    const { verifyJWT } = await import("../jwt.js");
    const payload = await verifyJWT(token, env.JWT_PUBLIC_KEY);
    console.log("payload", payload);
    if (!payload) throw new Error("Invalid token");
    // DBからemailとauto_updateを取得
    const { results } = await env.DB.prepare("SELECT email, auto_update FROM users WHERE id = ?").bind(payload.user_id).all();
    const email = results.length ? results[0].email : null;
    const auto_update = results.length ? results[0].auto_update : null;
    return new Response(JSON.stringify({ id: payload.user_id, email, auto_update }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log("ME ERROR", e && (e.stack || e.message || e.toString()));
    return new Response(JSON.stringify({ error: "認証エラー" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
} 