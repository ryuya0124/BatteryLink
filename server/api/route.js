import { Hono } from "hono";
import { handleGetDevices, handlePostDevice, handlePutDevice, handleDeleteDevice, handlePatchDevice } from "./handlers/deviceHandlers.js";
import { handleGetApiKeys, handlePostApiKey, handleDeleteApiKey, handlePatchApiKey } from "./handlers/apiKeyHandlers.js";
import { handleMe, handleAutoUpdate, handleDeviceDisplaySettings, handleIdentities } from "./handlers/meHandler.js";
import { corsMiddleware } from "./cors.js";
import { handleAccountLink } from "./handlers/accountLinkHandler.js";
import { handleDeleteAccount } from "./handlers/accountDeleteHandler.js";

const api = new Hono();

// CORSミドルウェアを適用
api.use("*", corsMiddleware);

// アカウントリンクAPI
api.post("/link-account", async (c) => {
  return handleAccountLink(c.req.raw, c.env);
});

// デバイスAPI
api.get("/devices", async (c) => {
  return handleGetDevices(c.req.raw, c.env);
});
api.post("/devices", async (c) => {
  return handlePostDevice(c.req.raw, c.env);
});
api.put("/devices/:uuid", async (c) => {
  const uuid = c.req.param("uuid");
  console.log("UUID:" + uuid);
  return handlePutDevice(c.req.raw, c.env, uuid);
});
api.delete("/devices/:uuid", async (c) => {
  const uuid = c.req.param("uuid");
  return handleDeleteDevice(c.req.raw, c.env, uuid);
});
api.patch("/devices/:uuid", async (c) => {
  const uuid = c.req.param("uuid");
  return handlePatchDevice(c.req.raw, c.env, uuid);
});

// APIキーAPI
api.get("/api-keys", async (c) => {
  return handleGetApiKeys(c.req.raw, c.env);
});
api.post("/api-keys", async (c) => {
  return handlePostApiKey(c.req.raw, c.env);
});
api.delete("/api-keys/:id", async (c) => {
  const id = c.req.param("id");
  return handleDeleteApiKey(c.req.raw, c.env, id);
});
api.patch("/api-keys/:id", async (c) => {
  const id = c.req.param("id");
  return handlePatchApiKey(c.req.raw, c.env, id);
});

// 認証API
api.get("/auth/me", async (c) => {
  return handleMe(c.req.raw, c.env);
});
api.get("/auth/identities", async (c) => {
  return handleIdentities(c.req.raw, c.env);
});
api.patch("/auth/auto-update", async (c) => {
  return handleAutoUpdate(c.req.raw, c.env);
});
api.get("/auth/device-display-settings", async (c) => {
  return handleDeviceDisplaySettings(c.req.raw, c.env);
});
api.patch("/auth/device-display-settings", async (c) => {
  return handleDeviceDisplaySettings(c.req.raw, c.env);
});

// アカウント削除API
api.delete("/auth/account", async (c) => {
  return handleDeleteAccount(c.req.raw, c.env);
});

export default api;