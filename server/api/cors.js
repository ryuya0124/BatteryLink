// CORSユーティリティ
export function isApiKeyUpdate(request, pathname) {
  const apiKey = request.headers.get("x-api-key");
  return (
    pathname.startsWith("/api/devices/") && ["PUT", "DELETE"].includes(request.method) && apiKey
  );
}

export function buildCORSHeaders(isApiKeyUpdate) {
  const allowOrigin = isApiKeyUpdate ? "*" : "https://batterysync.net";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function withCORS(res, isApiKeyUpdate) {
  const headers = buildCORSHeaders(isApiKeyUpdate);
  const newHeaders = new Headers(res.headers);
  for (const [k, v] of Object.entries(headers)) {
    newHeaders.set(k, v);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

export function handlePreflight(isApiKeyUpdate) {
  const headers = buildCORSHeaders(isApiKeyUpdate);
  return new Response(null, {
    status: 204,
    headers,
  });
} 