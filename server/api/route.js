import { handleLogin, handleRefresh, handleLogout, handleSignup } from "./authHandlers.js";
import { verifyApiKeyAndUuid } from "./utils.js";
import { handleGetDevices, handlePostDevice, handlePutDevice, handleDeleteDevice } from "./handlers/deviceHandlers.js";
import { handleGetApiKeys, handlePostApiKey, handleDeleteApiKey, handlePatchApiKey } from "./handlers/apiKeyHandlers.js";
import { handleMe } from "./handlers/meHandler.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (pathname === "/api/auth/refresh") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
      }
      return handleRefresh(request, env);
    }
    if (pathname === "/api/auth/logout" && request.method === "POST") {
      return handleLogout(request, env);
    }
    if (pathname === "/api/auth/signup" && request.method === "POST") {
      return handleSignup(request, env);
    }
    if (pathname === "/api/auth/me" && request.method === "GET") {
      return handleMe(request, env);
    }
    // デバイスAPI
    if (pathname === "/api/devices" && request.method === "GET") {
      return handleGetDevices(request, env);
    }
    if (pathname === "/api/devices" && request.method === "POST") {
      return handlePostDevice(request, env);
    }
    if (pathname.startsWith("/api/devices/") && request.method === "PUT") {
      const uuid = decodeURIComponent(pathname.split("/api/devices/")[1]);
      return handlePutDevice(request, env, uuid);
    }
    if (pathname.startsWith("/api/devices/") && request.method === "DELETE") {
      const uuid = decodeURIComponent(pathname.split("/api/devices/")[1]);
      return handleDeleteDevice(request, env, uuid);
    }
    // APIキーAPI
    if (pathname === "/api/api-keys" && request.method === "GET") {
      return handleGetApiKeys(request, env);
    }
    if (pathname === "/api/api-keys" && request.method === "POST") {
      return handlePostApiKey(request, env);
    }
    if (pathname.startsWith("/api/api-keys/") && request.method === "DELETE") {
      const id = decodeURIComponent(pathname.split("/api/api-keys/")[1]);
      return handleDeleteApiKey(request, env, id);
    }
    if (pathname.startsWith("/api/api-keys/") && request.method === "PATCH") {
      const id = decodeURIComponent(pathname.split("/api/api-keys/")[1]);
      return handlePatchApiKey(request, env, id);
    }
    // ...他API
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    // /api以外は必ず404
    return new Response("Not found", { status: 404 });
  }
};