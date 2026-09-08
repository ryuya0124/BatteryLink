import { cors } from "hono/cors";

// APIキー更新かどうかを判定
export function isApiKeyUpdate(request, pathname) {
  const apiKey = request.headers.get("x-api-key");
  const preflight = request.method === "OPTIONS";
  const method = preflight ? request.headers.get("Access-Control-Request-Method") : request.method;
  const headers = (request.headers.get("Access-Control-Request-Headers") || "").toLowerCase().split(",").map(value => value.trim());
  return (
    pathname.startsWith("/api/devices/") && method === "PUT" && (apiKey || (preflight && headers.includes("x-api-key")))
  );
}

// Hono用CORSミドルウェア
export const corsMiddleware = cors({
  origin: (origin, c) => {
    const pathname = new URL(c.req.url).pathname;
    const apiKeyUpdateFlag = isApiKeyUpdate(c.req.raw, pathname);
    const allowed = new Set([new URL(c.req.url).origin, "https://batt.ryuya-dev.net"]);
    return apiKeyUpdateFlag ? "*" : (allowed.has(origin) ? origin : "");
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
  maxAge: 86400,
});
