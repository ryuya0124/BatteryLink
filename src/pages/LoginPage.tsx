import { useAuth0 } from "@auth0/auth0-react";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useEffect } from "react";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const showLoader = useDelayedLoader(isLoading);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  if (showLoader) return <FullScreenLoader label="ログインページを読み込み中..." />;
  if (isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">ログイン済み</div>;
  return null;
} 