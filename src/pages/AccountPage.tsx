import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { FaGoogle, FaFacebook, FaTwitter, FaGithub, FaApple, FaMicrosoft } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { useThemeMode } from "@/hooks/useThemeMode";
import { Label } from "@/components/ui/label";
import { Battery, LogOut, UserIcon } from "lucide-react";

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
  const [theme, setTheme] = useThemeMode();
  
  // 明示的なボタンでアカウント情報再取得
  const handleManualFetchAccount = async () => {
    const claims = await getIdTokenClaims();
    setClaimsDebug(claims);
    setHasLinkCandidate(!!(claims && claims[LINK_CLAIM]));
    setIdentities((claims && claims[IDENTITIES_CLAIM]) || []);
  };

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
      // デバッグ: originalToken
      console.log('originalToken', originalToken);
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
      // デバッグ: linkToken
      console.log('linkToken', linkToken);
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
        // デバッグ: APIエラー内容
        console.error('link-account API error', err);
        setLinkError(err.error || "リンクに失敗しました");
      }
    } catch (e: any) {
      setLinkError(e.message || "エラーが発生しました");
      // デバッグ: 例外内容
      console.error('handleLinkWithProvider error', e);
    } finally {
      setLinking(false);
    }
  };

  if (isLoading) return <FullScreenLoader label="アカウント情報を取得中..." />;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="container w-full max-w-full mx-auto px-0 sm:px-1 lg:px-2 py-4 sm:py-8 my-2 sm:my-4 lg:my-8">
        {/* Header（他ページと統一） */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start min-w-0">
            <Battery className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground drop-shadow min-w-0 max-w-full flex-shrink-0 truncate">BatterySync</h1>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 w-full min-w-0">
            <Button variant="outline" onClick={handleManualFetchAccount} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">アカウント情報再取得</Button>
            <Button variant="outline" onClick={() => navigate("/apikeys")} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">APIキー管理</Button>
            <Button variant="outline" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
        <div className="max-w-lg mx-auto bg-white dark:bg-card rounded shadow p-8 transition-colors">
          <h2 className="text-3xl font-bold mb-6 text-foreground">アカウント情報</h2>
          <div className="mb-6">
            <div className="mb-2 text-muted-foreground"><b>メール:</b> {user?.email}</div>
            <div className="mb-2 text-muted-foreground"><b>名前:</b> {user?.name}</div>
            <div className="mb-4 text-muted-foreground"><b>連携済みアカウント:</b></div>
            {/* identitiesをグラフィカルなカード表示に */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {identities.map((id: any, idx: number) => (
                <div key={id.provider} className="flex items-center gap-3 p-3 border rounded shadow-sm bg-gray-50 dark:bg-muted">
                  {/* Providerアイコン */}
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
            {/* デバッグ表示や警告は削除済み */}
          </div>
          <div className="flex flex-col gap-4">
            {/* 未リンクのSNSごとに連携ボタンを動的に表示 */}
            {SOCIAL_PROVIDERS.filter(
              p => !identities.some((id: any) => id.provider === p.provider)
            ).length > 0 && (
              <div className="border rounded p-4 bg-blue-50 dark:bg-muted">
                <div className="mb-2 font-bold text-blue-700 dark:text-blue-300">未リンクのSNSアカウントと連携できます。</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SOCIAL_PROVIDERS.filter(
                    p => !identities.some((id: any) => id.provider === p.provider)
                  ).map(p => {
                    // SNSごとのアイコンと色
                    let Icon = null;
                    let btnClass = "";
                    if (p.provider === 'google-oauth2') {
                      Icon = FaGoogle;
                      btnClass = "bg-[#4285F4] dark:bg-[#1a2a3a] hover:bg-[#357ae8] dark:hover:bg-[#22334a] text-white";
                    } else if (p.provider === 'facebook') {
                      Icon = FaFacebook;
                      btnClass = "bg-[#1877F3] dark:bg-[#1a2a3a] hover:bg-[#145db2] dark:hover:bg-[#22334a] text-white";
                    } else if (p.provider === 'twitter') {
                      Icon = FaTwitter;
                      btnClass = "bg-[#1DA1F2] dark:bg-[#1a2a3a] hover:bg-[#1a8cd8] dark:hover:bg-[#22334a] text-white";
                    } else if (p.provider === 'github') {
                      Icon = FaGithub;
                      btnClass = "bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white";
                    } else if (p.provider === 'apple') {
                      Icon = FaApple;
                      btnClass = "bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white";
                    } else if (p.provider === 'windowslive') {
                      Icon = FaMicrosoft;
                      btnClass = "bg-[#00A4EF] dark:bg-[#1a2a3a] hover:bg-[#0078d4] dark:hover:bg-[#22334a] text-white";
                    } else {
                      btnClass = "bg-gray-400 dark:bg-gray-700 hover:bg-gray-500 dark:hover:bg-gray-600 text-white";
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
        <footer className="mt-8 sm:mt-16 text-center text-muted-foreground text-xs sm:text-sm w-full">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
}; 