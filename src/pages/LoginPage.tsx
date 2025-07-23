import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading) return <div>Loading...</div>;
  if (isAuthenticated) return <div>ログイン済み</div>;

  return null;
} 