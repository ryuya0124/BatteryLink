import { verifyApiKeyAndUuid } from "./utils.js";
import { handleGetDevices, handlePostDevice, handlePutDevice, handleDeleteDevice } from "./handlers/deviceHandlers.js";
import { handleGetApiKeys, handlePostApiKey, handleDeleteApiKey, handlePatchApiKey } from "./handlers/apiKeyHandlers.js";
import { handleMe, handleAutoUpdate } from "./handlers/meHandler.js";
import { isApiKeyUpdate, withCORS, handlePreflight } from "./cors.js";
import { handleAccountLink } from "./handlers/accountLinkHandler.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const apiKeyUpdate = isApiKeyUpdate(request, pathname);

    // CORSプリフライト対応
    if (request.method === "OPTIONS") {
      return handlePreflight(apiKeyUpdate);
    }

    if (pathname === "/api/link-account" && request.method === "POST") {
      return withCORS(await handleAccountLink(request, env), apiKeyUpdate);
    }

    // デバイスAPI
    if (pathname === "/api/devices" && request.method === "GET") {
      return withCORS(await handleGetDevices(request, env), apiKeyUpdate);
    }
    if (pathname === "/api/devices" && request.method === "POST") {
      return withCORS(await handlePostDevice(request, env), apiKeyUpdate);
    }
    if (pathname.startsWith("/api/devices/") && request.method === "PUT") {
      const uuid = decodeURIComponent(pathname.split("/api/devices/")[1]);
      console.log("UUID:" + uuid)
      return withCORS(await handlePutDevice(request, env, uuid), apiKeyUpdate);
    }
    if (pathname.startsWith("/api/devices/") && request.method === "DELETE") {
      const uuid = decodeURIComponent(pathname.split("/api/devices/")[1]);
      return withCORS(await handleDeleteDevice(request, env, uuid), apiKeyUpdate);
    }
    // デバイスバッテリー情報API
    if (pathname.startsWith("/api/battery/") && request.method === "GET") {
      const uuid = decodeURIComponent(pathname.split("/api/battery/")[1]);
      const { handleGetBatteryInfo } = await import("./handlers/deviceHandlers.js");
      return withCORS(await handleGetBatteryInfo(request, env, uuid), apiKeyUpdate);
    }
    // APIキーAPI
    if (pathname === "/api/api-keys" && request.method === "GET") {
      return withCORS(await handleGetApiKeys(request, env), apiKeyUpdate);
    }
    if (pathname === "/api/api-keys" && request.method === "POST") {
      return withCORS(await handlePostApiKey(request, env), apiKeyUpdate);
    }
    if (pathname.startsWith("/api/api-keys/") && request.method === "DELETE") {
      const id = decodeURIComponent(pathname.split("/api/api-keys/")[1]);
      return withCORS(await handleDeleteApiKey(request, env, id), apiKeyUpdate);
    }
    if (pathname.startsWith("/api/api-keys/") && request.method === "PATCH") {
      const id = decodeURIComponent(pathname.split("/api/api-keys/")[1]);
      return withCORS(await handlePatchApiKey(request, env, id), apiKeyUpdate);
    }
    // auto_update取得API
    if (pathname === "/api/auth/me" && request.method === "GET") {
      return withCORS(await handleMe(request, env), apiKeyUpdate);
    }
    // auto_update更新API
    if (pathname === "/api/auth/auto-update" && request.method === "PATCH") {
      return withCORS(await handleAutoUpdate(request, env), apiKeyUpdate);
    }
    // ...他API
    if (pathname.startsWith("/api/")) {
      return withCORS(new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } }), apiKeyUpdate);
    }
    // /api以外は必ず404
    return new Response("Not found", { status: 404 });
  }
};