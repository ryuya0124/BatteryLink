import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

const ACCOUNT_LINK_URL = "https://auth0.batterysync.net/account-link-extension";

export const AccountPage: React.FC = () => {
  const { user, getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: "/account" } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  const handleAccountLink = async () => {
    const token = await getAccessTokenSilently();
    window.location.href = `${ACCOUNT_LINK_URL}?token=${token}`;
  };

  if (isLoading) return <FullScreenLoader label="アカウント情報を取得中..." />;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded shadow p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">アカウント情報</h2>
          <div className="mb-6">
            <div className="mb-2"><b>メール:</b> {user?.email}</div>
            <div className="mb-2"><b>名前:</b> {user?.name}</div>
            <div className="mb-2"><b>ログイン方法:</b></div>
            <ul className="list-disc ml-6 mb-2">
              {user?.identities?.map((id: any) => (
                <li key={id.provider + id.user_id}>
                  {id.provider}（{id.connection}）
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAccountLink}>
              他のSNSアカウントを連携・管理する
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>ダッシュボードに戻る</Button>
          </div>
        </div>
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
}; 