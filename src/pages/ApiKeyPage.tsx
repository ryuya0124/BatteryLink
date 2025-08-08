import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ApiKeyManager } from "../components/ApiKeyManager";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";
import { Layout } from "@/components/Layout";

export default function ApiKeyPage() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const showLoader = useDelayedLoader(isLoading);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (showLoader) return <FullScreenLoader label="APIキー管理ページを読み込み中..." />;
  if (!isAuthenticated) return <div>未認証</div>;

  return (
    <Layout>
      <ApiKeyManager />
    </Layout>
  );
} 