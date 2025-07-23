import { verifyApiKeyAndUuid } from "./utils.js";
import { handleGetDevices, handlePostDevice, handlePutDevice, handleDeleteDevice } from "./handlers/deviceHandlers.js";
import { handleGetApiKeys, handlePostApiKey, handleDeleteApiKey, handlePatchApiKey } from "./handlers/apiKeyHandlers.js";
import { handleMe, handleAutoUpdate } from "./handlers/meHandler.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // デバイスAPI
    if (pathname === "/api/devices" && request.method === "GET") {
      return handleGetDevices(request, env);
    }
    if (pathname === "/api/devices" && request.method === "POST") {
      return handlePostDevice(request, env);
    }
    if (pathname.startsWith("/api/devices/") && request.method === "PUT") {
      const uuid = decodeURIComponent(pathname.split("/api/devices/")[1]);
      console.log("UUID:" + uuid)
      return handlePutDevice(request, env, uuid);
    }
    if (pathname.startsWith("/api/devices/") && request.method === "DELETE") {
      const uuid = decodeURIComponent(pathname.split("/api/devices/")[1]);
      return handleDeleteDevice(request, env, uuid);
    }
    // デバイスバッテリー情報API
    if (pathname.startsWith("/api/battery/") && request.method === "GET") {
      const uuid = decodeURIComponent(pathname.split("/api/battery/")[1]);
      const { handleGetBatteryInfo } = await import("./handlers/deviceHandlers.js");
      return handleGetBatteryInfo(request, env, uuid);
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
    // auto_update取得API
    if (pathname === "/api/auth/me" && request.method === "GET") {
      return handleMe(request, env);
    }
    // auto_update更新API
    if (pathname === "/api/auth/auto-update" && request.method === "PATCH") {
      return handleAutoUpdate(request, env);
    }
    // ...他API
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    // /api以外は必ず404
    return new Response("Not found", { status: 404 });
  }
};