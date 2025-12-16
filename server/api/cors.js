import { cors } from "hono/cors";

// APIキー更新かどうかを判定
export function isApiKeyUpdate(request, pathname) {
  const apiKey = request.headers.get("x-api-key");
  return (
    pathname.startsWith("/api/devices/") && ["PUT", "DELETE"].includes(request.method) && apiKey
  );
}

// Hono用CORSミドルウェア
export const corsMiddleware = cors({
  origin: (origin, c) => {
    const pathname = new URL(c.req.url).pathname;
    const apiKeyUpdateFlag = isApiKeyUpdate(c.req.raw, pathname);
    return apiKeyUpdateFlag ? "*" : "https://batt.ryuya-dev.net";
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
  maxAge: 86400,
}); 