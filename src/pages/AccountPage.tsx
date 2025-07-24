import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { FaGoogle, FaFacebook, FaTwitter, FaGithub, FaApple, FaMicrosoft } from "react-icons/fa";

const LINK_CLAIM = "https://batterysync.net/account_link_candidate";
const IDENTITIES_CLAIM = "https://batterysync.net/identities";

export const AccountPage: React.FC = () => {
  const { user, getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, logout, getIdTokenClaims } = useAuth0();
  const navigate = useNavigate();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [hasLinkCandidate, setHasLinkCandidate] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);
  const [claimsDebug, setClaimsDebug] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: "/account" } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  useEffect(() => {
    (async () => {
      const claims = await getIdTokenClaims();
      setClaimsDebug(claims); // デバッグ用
      setHasLinkCandidate(!!(claims && claims[LINK_CLAIM]));
      setIdentities((claims && claims[IDENTITIES_CLAIM]) || []);
    })();
  }, [getIdTokenClaims]);

  // Googleアカウントがすでにリンク済みか判定
  const isGoogleLinked = identities.some(
    (id: any) => id.provider === 'google-oauth2'
  );
  const shouldShowLinkButton = hasLinkCandidate && !isGoogleLinked;

  const SOCIAL_PROVIDERS = [
    { provider: 'google-oauth2', label: 'Google' },
    { provider: 'facebook', label: 'Facebook' },
    { provider: 'twitter', label: 'Twitter' },
    { provider: 'github', label: 'GitHub' },
    { provider: 'apple', label: 'Apple' },
    { provider: 'windowslive', label: 'Microsoft' },
  ];

  // Googleログインでリンク用トークン取得→API呼び出し
  // const handleLinkWithGoogle = async () => { ... } を削除し、汎用化
  const handleLinkWithProvider = async (provider: string) => {
    setLinking(true);
    setLinkError(null);
    setLinkSuccess(false);
    try {
      // 1. 元アカウントのトークン
      const originalToken = await getAccessTokenSilently();
      // 2. 指定SNSで新トークン取得
      await loginWithRedirect({
        authorizationParams: {
          connection: provider,
          prompt: "login"
        },
        appState: { returnTo: "/account?linking=1" }
      });
      // ページリロード後、SNSでログイン済みなら再度トークン取得
      const linkToken = await getAccessTokenSilently();
      // 3. APIにPOST
      const res = await fetch("/api/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalToken, linkToken })
      });
      if (res.ok) {
        setLinkSuccess(true);
      } else {
        const err = await res.json();
        setLinkError(err.error || "リンクに失敗しました");
      }
    } catch (e: any) {
      setLinkError(e.message || "エラーが発生しました");
    } finally {
      setLinking(false);
    }
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
            <div className="mb-4"><b>連携済みアカウント:</b></div>
            {/* identitiesをグラフィカルなカード表示に */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {identities.map((id: any, idx: number) => (
                <div key={id.provider} className="flex items-center gap-3 p-3 border rounded shadow-sm bg-gray-50">
                  {/* Providerアイコン */}
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-2xl">
                    {id.provider === 'google-oauth2' && <FaGoogle className="text-[#4285F4]" />}
                    {id.provider === 'facebook' && <FaFacebook className="text-[#1877F3]" />}
                    {id.provider === 'twitter' && <FaTwitter className="text-[#1DA1F2]" />}
                    {id.provider === 'github' && <FaGithub className="text-black" />}
                    {id.provider === 'apple' && <FaApple className="text-black" />}
                    {id.provider === 'windowslive' && <FaMicrosoft className="text-[#00A4EF]" />}
                    {!['google-oauth2','facebook','twitter','github','apple','windowslive'].includes(id.provider) && id.provider.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      {id.provider === 'google-oauth2' && 'Google'}
                      {id.provider === 'facebook' && 'Facebook'}
                      {id.provider === 'twitter' && 'Twitter'}
                      {id.provider === 'github' && 'GitHub'}
                      {id.provider === 'apple' && 'Apple'}
                      {id.provider === 'windowslive' && 'Microsoft'}
                      {!['google-oauth2','facebook','twitter','github','apple','windowslive'].includes(id.provider) && id.provider}
                    </div>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {idx === 0 && <span className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white">メイン</span>}
                      {id.isSocial && <span className="px-2 py-0.5 text-xs rounded bg-green-500 text-white">SNS</span>}
                      {!id.isSocial && <span className="px-2 py-0.5 text-xs rounded bg-gray-400 text-white">メール/パスワード</span>}
                      <span className="px-2 py-0.5 text-xs rounded bg-emerald-500 text-white">連携済み</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* デバッグ表示や警告は削除済み */}
          </div>
          <div className="flex flex-col gap-4">
            {/* 未リンクのSNSごとに連携ボタンを動的に表示 */}
            {SOCIAL_PROVIDERS.filter(
              p => !identities.some((id: any) => id.provider === p.provider)
            ).length > 0 && (
              <div className="border rounded p-4 bg-blue-50">
                <div className="mb-2 font-bold text-blue-700">未リンクのSNSアカウントと連携できます。</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SOCIAL_PROVIDERS.filter(
                    p => !identities.some((id: any) => id.provider === p.provider)
                  ).map(p => {
                    // SNSごとのアイコンと色
                    let Icon = null;
                    let btnClass = "";
                    if (p.provider === 'google-oauth2') {
                      Icon = FaGoogle;
                      btnClass = "bg-[#4285F4] hover:bg-[#357ae8] text-white";
                    } else if (p.provider === 'facebook') {
                      Icon = FaFacebook;
                      btnClass = "bg-[#1877F3] hover:bg-[#145db2] text-white";
                    } else if (p.provider === 'twitter') {
                      Icon = FaTwitter;
                      btnClass = "bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white";
                    } else if (p.provider === 'github') {
                      Icon = FaGithub;
                      btnClass = "bg-black hover:bg-gray-800 text-white";
                    } else if (p.provider === 'apple') {
                      Icon = FaApple;
                      btnClass = "bg-black hover:bg-gray-800 text-white";
                    } else if (p.provider === 'windowslive') {
                      Icon = FaMicrosoft;
                      btnClass = "bg-[#00A4EF] hover:bg-[#0078d4] text-white";
                    } else {
                      btnClass = "bg-gray-400 hover:bg-gray-500 text-white";
                    }
                    return (
                      <Button
                        key={p.provider}
                        onClick={() => handleLinkWithProvider(p.provider)}
                        disabled={linking}
                        className={`flex items-center gap-2 ${btnClass}`}
                      >
                        {Icon && <Icon className="text-lg" />}
                        {linking ? "連携中..." : `${p.label}と連携`}
                      </Button>
                    );
                  })}
                </div>
                {linkError && <div className="text-red-500 mt-2">{linkError}</div>}
                {linkSuccess && <div className="text-green-600 mt-2">連携に成功しました！</div>}
              </div>
            )}
            <Button variant="outline" onClick={() => navigate("/")}>ダッシュボードに戻る</Button>
            <Button variant="destructive" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>ログアウト</Button>
          </div>
        </div>
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
}; 