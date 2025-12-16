import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { FaGoogle, FaFacebook, FaTwitter, FaGithub, FaApple, FaMicrosoft, FaAmazon, FaDiscord } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { useThemeMode } from "@/hooks/useThemeMode";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const LINK_CLAIM = "https://batt.ryuya-dev.net/account_link_candidate";
const IDENTITIES_CLAIM = "https://batt.ryuya-dev.net/identities";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // user.subからプロバイダー情報を抽出するヘルパー（oauth2|discord|xxx に対応）
  const extractIdentityFromSub = (sub: string | undefined) => {
    if (!sub) return null;
    const parts = sub.split('|');
    const provider = parts[0];
    const user_id = parts.slice(1).join('|');
    const socialProviders = ['google-oauth2', 'facebook', 'twitter', 'github', 'apple', 'windowslive', 'amazon', 'discord'];
    const isDiscordViaOauth2 = provider === 'oauth2' && user_id.startsWith('discord|');
    const isAmazonViaOauth2 = provider === 'oauth2' && user_id.startsWith('amazon|');
    const normalizedProvider = isDiscordViaOauth2 ? 'discord' : isAmazonViaOauth2 ? 'amazon' : provider;
    return {
      provider,
      user_id,
      isSocial: socialProviders.includes(normalizedProvider)
    };
  };

  // APIからidentitiesを取得
  const fetchIdentitiesFromApi = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch('/api/auth/identities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.identities || [];
      }
    } catch (e) {
      console.error('Failed to fetch identities from API:', e);
    }
    return null;
  };

  // identitiesを読み込み（自動）
  useEffect(() => {
    const loadIdentities = async () => {
      try {
        // まずAPIからidentitiesを取得（正確なデータ）
        const apiIdentities = await fetchIdentitiesFromApi();
        if (apiIdentities && apiIdentities.length > 0) {
          setIdentities(apiIdentities);
        } else {
          // フォールバック: user.subから取得
          if (user?.sub) {
            const mainIdentity = extractIdentityFromSub(user.sub);
            if (mainIdentity) {
              setIdentities([mainIdentity]);
            }
          }
        }

        // クレームも読み込み（リンク候補の確認用）
        const claims = await getIdTokenClaims();
        setClaimsDebug(claims);
        setHasLinkCandidate(!!(claims && (claims as any)[LINK_CLAIM]));
      } catch (e) {
        // 取得失敗時のフォールバック
        if (user?.sub) {
          const mainIdentity = extractIdentityFromSub(user.sub);
          if (mainIdentity) {
            setIdentities([mainIdentity]);
          }
        }
      }
    };
    if (isAuthenticated) {
      loadIdentities();
    }
  }, [isAuthenticated, getAccessTokenSilently, getIdTokenClaims, user?.sub]);

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
            
            // APIから最新のidentitiesを取得
            const apiIdentities = await fetchIdentitiesFromApi();
            if (apiIdentities && apiIdentities.length > 0) {
              setIdentities(apiIdentities);
            }
            
            // クレームも更新
            const claims = await getIdTokenClaims();
            setClaimsDebug(claims);
            setHasLinkCandidate(!!(claims && (claims as any)[LINK_CLAIM]));
            
            // 2秒後にページをリロードして最新の状態を取得
            setTimeout(() => {
              window.location.href = '/account';
            }, 2000);
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
    { provider: 'amazon', label: 'Amazon' },
    { provider: 'discord', label: 'Discord' },
  ];

  // Auth0のgeneric oauth2コネクションはproviderがoauth2になるため、user_idで実際のプロバイダを判定
  const normalizeProvider = (identity: any) => {
    if (!identity) return '';
    const { provider, user_id } = identity;
    if (provider === 'oauth2' && typeof user_id === 'string') {
      if (user_id.startsWith('discord|')) return 'discord';
      if (user_id.startsWith('amazon|')) return 'amazon';
    }
    return provider;
  };

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "削除する") {
      setDeleteError("確認テキストが一致しません");
      return;
    }
    
    setDeleting(true);
    setDeleteError(null);
    
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        // 削除成功後、ログアウトしてトップページへ
        logout({ logoutParams: { returnTo: window.location.origin } });
      } else {
        const err = await res.json().catch(() => ({}));
        setDeleteError(err.error || "アカウントの削除に失敗しました");
      }
    } catch (e: any) {
      setDeleteError(e?.message || "エラーが発生しました");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <FullScreenLoader label="アカウント情報を取得中..." />;
  if (!isAuthenticated) return null;

  const normalizedIdentities = identities.map((id: any) => ({
    ...id,
    providerKey: normalizeProvider(id),
    isSocial: id.isSocial || ['google-oauth2','facebook','twitter','github','apple','windowslive','amazon','discord'].includes(normalizeProvider(id))
  }));

  // Google連携済み判定（例）
  const isGoogleLinked = normalizedIdentities.some((id: any) => id.providerKey === 'google-oauth2');
  const shouldShowLinkButton = hasLinkCandidate && !isGoogleLinked;

  return (
    <Layout>
      <SEO title="アカウント" noindex />
      <div className="max-w-lg mx-auto bg-white dark:bg-card rounded shadow p-8 transition-colors">
            <h2 className="text-3xl font-bold mb-6 text-foreground">アカウント情報</h2>
            <div className="mb-6">
              <div className="mb-2 text-muted-foreground"><b>メール:</b> {user?.email}</div>
              <div className="mb-2 text-muted-foreground"><b>名前:</b> {user?.name}</div>
              <div className="mb-4 text-muted-foreground"><b>連携済みアカウント:</b></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {normalizedIdentities.map((id: any, idx: number) => (
                  <div key={`${id.provider}-${id.user_id || idx}`} className="flex items-center gap-3 p-3 border rounded shadow-sm bg-gray-50 dark:bg-muted">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-2xl">
                      {id.providerKey === 'google-oauth2' && <FaGoogle className="text-[#4285F4] dark:text-[#8ab4f8]" />}
                      {id.providerKey === 'facebook' && <FaFacebook className="text-[#1877F3] dark:text-[#8ab4f8]" />}
                      {id.providerKey === 'twitter' && <FaTwitter className="text-[#1DA1F2] dark:text-[#8ab4f8]" />}
                      {id.providerKey === 'github' && <FaGithub className="text-black dark:text-gray-200" />}
                      {id.providerKey === 'apple' && <FaApple className="text-black dark:text-gray-200" />}
                      {id.providerKey === 'windowslive' && <FaMicrosoft className="text-[#00A4EF] dark:text-[#8ab4f8]" />}
                      {id.providerKey === 'amazon' && <FaAmazon className="text-[#FF9900] dark:text-[#ffb84d]" />}
                      {id.providerKey === 'discord' && <FaDiscord className="text-[#5865F2] dark:text-[#8a94f7]" />}
                      {!['google-oauth2','facebook','twitter','github','apple','windowslive','amazon','discord'].includes(id.providerKey) && id.providerKey.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">
                        {id.providerKey === 'google-oauth2' && 'Google'}
                        {id.providerKey === 'facebook' && 'Facebook'}
                        {id.providerKey === 'twitter' && 'Twitter'}
                        {id.providerKey === 'github' && 'GitHub'}
                        {id.providerKey === 'apple' && 'Apple'}
                        {id.providerKey === 'windowslive' && 'Microsoft'}
                        {id.providerKey === 'amazon' && 'Amazon'}
                        {id.providerKey === 'discord' && 'Discord'}
                        {!['google-oauth2','facebook','twitter','github','apple','windowslive','amazon','discord'].includes(id.providerKey) && id.providerKey}
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
              {SOCIAL_PROVIDERS.filter(p => !normalizedIdentities.some((id: any) => id.providerKey === p.provider)).length > 0 && (
                <div className="border rounded p-4 bg-blue-50 dark:bg-muted">
                  <div className="mb-2 font-bold text-blue-700 dark:text-blue-300">未リンクのSNSアカウントと連携できます。</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {SOCIAL_PROVIDERS.filter(p => !normalizedIdentities.some((id: any) => id.providerKey === p.provider)).map(p => {
                      let Icon: any = null;
                      let btnClass = "";
                      if (p.provider === 'google-oauth2') { Icon = FaGoogle; btnClass = "bg-[#4285F4] dark:bg-[#1a2a3a] hover:bg-[#357ae8] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'facebook') { Icon = FaFacebook; btnClass = "bg-[#1877F3] dark:bg-[#1a2a3a] hover:bg-[#145db2] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'twitter') { Icon = FaTwitter; btnClass = "bg-[#1DA1F2] dark:bg-[#1a2a3a] hover:bg-[#1a8cd8] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'github') { Icon = FaGithub; btnClass = "bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"; }
                      else if (p.provider === 'apple') { Icon = FaApple; btnClass = "bg-black dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white"; }
                      else if (p.provider === 'windowslive') { Icon = FaMicrosoft; btnClass = "bg-[#00A4EF] dark:bg-[#1a2a3a] hover:bg-[#0078d4] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'amazon') { Icon = FaAmazon; btnClass = "bg-[#FF9900] dark:bg-[#1a2a3a] hover:bg-[#e68a00] dark:hover:bg-[#22334a] text-white"; }
                      else if (p.provider === 'discord') { Icon = FaDiscord; btnClass = "bg-[#5865F2] dark:bg-[#1a2a3a] hover:bg-[#4752c4] dark:hover:bg-[#22334a] text-white"; }
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
              <Button variant="outline" onClick={() => navigate("/dashboard")}>ダッシュボードに戻る</Button>
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
            
            {/* 危険な操作セクション */}
            <div className="mt-8 border-t pt-6">
              <h3 className="font-bold mb-2 text-red-600 dark:text-red-400">危険な操作</h3>
              <p className="text-sm text-muted-foreground mb-4">
                アカウントを削除すると、すべてのデータ（デバイス、APIキー、設定など）が完全に削除されます。この操作は取り消せません。
              </p>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setDeleteDialogOpen(true);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
              >
                アカウントを削除
              </Button>
            </div>
      </div>
      
      {/* アカウント削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">アカウントの削除</DialogTitle>
            <DialogDescription>
              この操作は取り消すことができません。すべてのデータが完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm mb-4">
              削除されるデータ:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mb-4 space-y-1">
              <li>登録されたすべてのデバイス</li>
              <li>すべてのAPIキー</li>
              <li>表示設定</li>
              <li>Auth0のアカウント情報</li>
            </ul>
            <p className="text-sm mb-2">
              続行するには、下のフィールドに「<span className="font-bold text-red-600 dark:text-red-400">削除する</span>」と入力してください。
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="削除する"
              className="mt-2"
            />
            {deleteError && (
              <p className="text-red-500 text-sm mt-2">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmText !== "削除する"}
            >
              {deleting ? "削除中..." : "アカウントを完全に削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}; 