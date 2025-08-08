import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { FaGoogle, FaFacebook, FaTwitter, FaGithub, FaApple, FaMicrosoft } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { useThemeMode } from "@/hooks/useThemeMode";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";

const LINK_CLAIM = "https://batterysync.net/account_link_candidate";
const IDENTITIES_CLAIM = "https://batterysync.net/identities";

export const AccountPage: React.FC = () => {
  const { user, getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, logout, getIdTokenClaims } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [hasLinkCandidate, setHasLinkCandidate] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);
  const [claimsDebug, setClaimsDebug] = useState<any>(null);
  const [theme, setTheme] = useThemeMode();

  // クレームを読み込み（自動）
  useEffect(() => {
    const loadClaims = async () => {
      try {
        const claims = await getIdTokenClaims();
        setClaimsDebug(claims);
        setHasLinkCandidate(!!(claims && (claims as any)[LINK_CLAIM]));
        setIdentities(((claims && (claims as any)[IDENTITIES_CLAIM]) as any[]) || []);
      } catch (e) {
        // 取得失敗は無視（未ログインなど）
      }
    };
    if (isAuthenticated) {
      loadClaims();
    }
  }, [isAuthenticated, getIdTokenClaims]);

  // リダイレクト復帰後のリンク処理
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const linkingFlag = params.get("linking");
    if (linkingFlag === "1") {
      const originalToken = sessionStorage.getItem("linking_original_token");
      const provider = sessionStorage.getItem("linking_provider");
      if (!originalToken || !provider) {
        // 不整合ならクリーンアップ
        sessionStorage.removeItem("linking_original_token");
        sessionStorage.removeItem("linking_provider");
        return;
      }
      (async () => {
        setLinking(true);
        setLinkError(null);
        setLinkSuccess(false);
        try {
          // 現在のセッションは新規プロバイダ側になっている想定
          const linkToken = await getAccessTokenSilently();
          const res = await fetch("/api/link-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ originalToken, linkToken })
          });
          if (res.ok) {
            setLinkSuccess(true);
            // 成功したらクレームを再取得
            const claims = await getIdTokenClaims();
            setClaimsDebug(claims);
            setHasLinkCandidate(!!(claims && (claims as any)[LINK_CLAIM]));
            setIdentities(((claims && (claims as any)[IDENTITIES_CLAIM]) as any[]) || []);
          } else {
            const err = await res.json().catch(() => ({}));
            setLinkError(err.error || "リンクに失敗しました");
          }
        } catch (e: any) {
          setLinkError(e?.message || "エラーが発生しました");
        } finally {
          setLinking(false);
          // 使い終わったら後片付け
          sessionStorage.removeItem("linking_original_token");
          sessionStorage.removeItem("linking_provider");
        }
      })();
    }
  }, [location.search, getAccessTokenSilently, getIdTokenClaims]);

  // 汎用プロバイダ連携
  const handleLinkWithProvider = async (provider: string) => {
    setLinking(true);
    setLinkError(null);
    setLinkSuccess(false);
    try {
      // 1. 元アカウントのトークンを取得し保存
      const originalToken = await getAccessTokenSilently();
      sessionStorage.setItem("linking_original_token", originalToken);
      sessionStorage.setItem("linking_provider", provider);

      // 2. 指定SNSでログイン（この先はリダイレクトで戻るまで実行されない）
      await loginWithRedirect({
        authorizationParams: {
          connection: provider,
          prompt: "login"
        },
        appState: { returnTo: "/account?linking=1" }
      });
    } catch (e: any) {
      setLinkError(e.message || "エラーが発生しました");
      setLinking(false);
    }
  };

  const SOCIAL_PROVIDERS = [
    { provider: 'google-oauth2', label: 'Google' },
    { provider: 'facebook', label: 'Facebook' },
    { provider: 'twitter', label: 'Twitter' },
    { provider: 'github', label: 'GitHub' },
    { provider: 'apple', label: 'Apple' },
    { provider: 'windowslive', label: 'Microsoft' },
  ];

  if (isLoading) return <FullScreenLoader label="アカウント情報を取得中..." />;
  if (!isAuthenticated) return null;

  // Google連携済み判定（例）
  const isGoogleLinked = identities.some((id: any) => id.provider === 'google-oauth2');
  const shouldShowLinkButton = hasLinkCandidate && !isGoogleLinked;

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white dark:bg-card rounded shadow p-8 transition-colors">
            <h2 className="text-3xl font-bold mb-6 text-foreground">アカウント情報</h2>
            <div className="mb-6">
              <div className="mb-2 text-muted-foreground"><b>メール:</b> {user?.email}</div>
              <div className="mb-2 text-muted-foreground"><b>名前:</b> {user?.name}</div>
              <div className="mb-4 text-muted-foreground"><b>連携済みアカウント:</b></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {identities.map((id: any, idx: number) => (
                  <div key={id.provider} className="flex items-center gap-3 p-3 border rounded shadow-sm bg-gray-50 dark:bg-muted">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-2xl">
                      {id.provider === 'google-oauth2' && <FaGoogle className="text-[#4285F4] dark:text-[#8ab4f8]" />}
                      {id.provider === 'facebook' && <FaFacebook className="text-[#1877F3] dark:text-[#8ab4f8]" />}
                      {id.provider === 'twitter' && <FaTwitter className="text-[#1DA1F2] dark:text-[#8ab4f8]" />}
                      {id.provider === 'github' && <FaGithub className="text-black dark:text-gray-200" />}
                      {id.provider === 'apple' && <FaApple className="text-black dark:text-gray-200" />}
                      {id.provider === 'windowslive' && <FaMicrosoft className="text-[#00A4EF] dark:text-[#8ab4f8]" />}
                      {!['google-oauth2','facebook','twitter','github','apple','windowslive'].includes(id.provider) && id.provider.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">
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
                        {!id.isSocial && <span className="px-2 py-0.5 text-xs rounded bg-gray-400 dark:bg-gray-700 text-white">メール/パスワード</span>}
                        <span className="px-2 py-0.5 text-xs rounded bg-emerald-500 text-white">連携済み</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {/** 未リンクのSNSのみ連携ボタン表示 */}
              {SOCIAL_PROVIDERS.filter(p => !identities.some((id: any) => id.provider === p.provider)).length > 0 && (
                <div className="border rounded p-4 bg-blue-50 dark:bg-muted">
                  <div className="mb-2 font-bold text-blue-700 dark:text-blue-300">未リンクのSNSアカウントと連携できます。</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {SOCIAL_PROVIDERS.filter(p => !identities.some((id: any) => id.provider === p.provider)).map(p => {
                      let Icon: any = null;
                      let btnClass = "";
                      if (p.provider === 'google-oauth2') { Icon = FaGoogle; btnClass = "bg-[#4285F4] dark:bg-[#1a2a3a] hover:bg-[#357ae8] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'facebook') { Icon = FaFacebook; btnClass = "bg-[#1877F3] dark:bg-[#1a2a3a] hover:bg-[#145db2] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'twitter') { Icon = FaTwitter; btnClass = "bg-[#1DA1F2] dark:bg-[#1a2a3a] hover:bg-[#1a8cd8] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'github') { Icon = FaGithub; btnClass = "bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"; }
                      else if (p.provider === 'apple') { Icon = FaApple; btnClass = "bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"; }
                      else if (p.provider === 'windowslive') { Icon = FaMicrosoft; btnClass = "bg-[#00A4EF] dark:bg-[#1a2a3a] hover:bg-[#0078d4] dark:hover:bg-[#22334a] text-white"; }
                      else { btnClass = "bg-gray-400 dark:bg-gray-700 hover:bg-gray-500 dark:hover:bg-gray-600 text-white"; }
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
            <div className="mt-8">
              <h3 className="font-bold mb-2">テーマ設定</h3>
              <div className="flex items-center gap-4 mb-2">
                <Label htmlFor="theme-mode">テーマ</Label>
                <select
                  id="theme-mode"
                  value={theme}
                  onChange={e => setTheme(e.target.value as any)}
                  className="border rounded px-2 py-1 bg-background text-foreground"
                >
                  <option value="system">自動（OS設定に従う）</option>
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={checked => setTheme(checked ? "dark" : "light")}
                  id="theme-switch"
                />
                <Label htmlFor="theme-switch">ダークモード</Label>
              </div>
            </div>
      </div>
    </Layout>
  );
}; 