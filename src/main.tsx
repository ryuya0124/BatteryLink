import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { HelmetProvider } from "react-helmet-async";
import AppRouter from "./AppRouter";
import "./index.css";
import { AuthLoadingProvider } from "@/hooks/AuthLoadingContext";
import { useThemeMode } from "@/hooks/useThemeMode";

function ThemeModeEffect() {
  useThemeMode();
  return null;
}

const domain = import.meta.env.VITE_AUTH0_DOMAIN || "auth0.ryuya-dev.net";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "flFVecIEsCGbfbzV7uUAqQsYBbkAcDEg";
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || "https://batt.ryuya-dev.net/";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeModeEffect />
      <AuthLoadingProvider>
        <Auth0Provider
          domain={domain}
          clientId={clientId}
          authorizationParams={{
            redirect_uri: window.location.origin,
            audience,
          }}
          onRedirectCallback={(appState) => {
            const requested = new URL(appState?.returnTo || "/", window.location.origin);
            const target = requested.origin === window.location.origin
              ? requested.pathname + requested.search + requested.hash
              : "/";
            window.history.replaceState({}, document.title, target);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        >
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </Auth0Provider>
      </AuthLoadingProvider>
    </HelmetProvider>
  </React.StrictMode>
);
