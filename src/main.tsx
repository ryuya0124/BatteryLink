import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import AppRouter from "./AppRouter";
import "./index.css";
import { AuthLoadingProvider } from "@/hooks/AuthLoadingContext";
import { useThemeMode } from "@/hooks/useThemeMode";

function ThemeModeEffect() {
  useThemeMode();
  return null;
}

const domain = "auth0.batt.ryuya-dev.net";
const clientId = "flFVecIEsCGbfbzV7uUAqQsYBbkAcDEg";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeModeEffect />
    <AuthLoadingProvider>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: "https://batt.ryuya-dev.net/"
        }}
        onRedirectCallback={(appState) => {
          if (appState?.returnTo) {
            window.location.assign(appState.returnTo);
          } else {
            window.location.assign("/");
          }
        }}
      >
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </Auth0Provider>
    </AuthLoadingProvider>
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
