import { handleLogin, handleRefresh, handleLogout, handleSignup } from "./authHandlers.js";
import { randomOpaqueToken, sha256 } from "./utils.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (pathname === "/api/auth/refresh" && request.method === "POST") {
      return handleRefresh(request, env);
    }
    if (pathname === "/api/auth/logout" && request.method === "POST") {
      return handleLogout(request, env);
    }
    if (pathname === "/api/auth/signup" && request.method === "POST") {
      return handleSignup(request, env);
    }
    // ...他API
    return new Response("Not found", { status: 404 });
  }
};