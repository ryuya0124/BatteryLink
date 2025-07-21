export async function handleMe(request, env) {
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
    // DBからemailを取得
    const { results } = await env.DB.prepare("SELECT email FROM users WHERE id = ?").bind(payload.user_id).all();
    const email = results.length ? results[0].email : null;
    return new Response(JSON.stringify({ id: payload.user_id, email }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.log("ME ERROR", e && (e.stack || e.message || e.toString()));
    return new Response(JSON.stringify({ error: "認証エラー" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
} 