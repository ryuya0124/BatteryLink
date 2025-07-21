import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/AuthContext";
import AppRouter from "./AppRouter";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  let token = localStorage.getItem("token");
  if (!init.headers) init.headers = {};
  (init.headers as any)["Authorization"] = `Bearer ${token}`;

  // APIリクエストにもcredentials: \"include\"を付与
  init.credentials = "include";

  let res = await fetch(input, init);
  if (res.status === 401) {
    // リフレッシュ時もcredentials: \"include\"を付与
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (refreshRes.ok) {
      const { token: newToken } = await refreshRes.json();
      localStorage.setItem("token", newToken);
      (init.headers as any)["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(input, init);
    } else {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return res;
    }
  }
  return res;
}
