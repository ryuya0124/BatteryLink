import { useState, useRef, useCallback, useEffect } from "react"

export interface AuthContextValue {
  token: string | null
  user: any
  login: (email: string, password: string) => Promise<boolean>
  refresh: () => Promise<void>
  logout: () => Promise<void>
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

export function useAuth(): AuthContextValue & { authLoading: boolean } {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const refreshTimer = useRef<number | null>(null)

  // JWTの有効期限をデコード
  const getExp = useCallback((token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload.exp ? payload.exp * 1000 : null
    } catch {
      return null
    }
  }, [])

  // ログイン
  const login = useCallback(async (email: string, password: string) => {
    console.log("login called", email);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    })
    if (!res.ok) return false
    console.log("login success, calling refresh");
    await refresh()
    return true
  }, [])

  // JWTリフレッシュ
  const refresh = useCallback(async () => {
    console.log("refresh called");
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("リフレッシュ失敗");
      console.log("fetching /api/auth/me");
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) throw new Error("ユーザー情報取得失敗");
      const userData = await meRes.json();
      console.log("me userData", userData);
      setUser(userData);
      setToken("dummy");
      scheduleRefresh("dummy");
    } catch (e) {
      console.error("refresh error", e);
    }
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setToken(null)
    setUser(null)
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
  }, [])

  // JWTの有効期限直前に自動リフレッシュ
  const scheduleRefresh = useCallback((token: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    const exp = getExp(token)
    if (!exp) return
    const now = Date.now()
    const ms = exp - now - 10 * 1000 // 10秒前にリフレッシュ
    if (ms > 0) {
      refreshTimer.current = window.setTimeout(() => {
        refresh().catch(logout)
      }, ms)
    }
  }, [refresh, logout, getExp])

  // 初回マウント時にリフレッシュトークンで自動ログイン
  useEffect(() => {
    (async () => {
      try {
        await refresh()
      } catch {}
      setAuthLoading(false)
    })()
  }, [])

  // APIリクエスト時の自動リフレッシュ例
  const fetchWithAuth = useCallback(async (input: RequestInfo, init: RequestInit = {}) => {
    if (!token) throw new Error("未認証")
    let res = await fetch(input, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` }
    })
    if (res.status === 401) {
      // JWT期限切れ→リフレッシュ
      await refresh()
      if (!token) throw new Error("リフレッシュ失敗")
      res = await fetch(input, {
        ...init,
        headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` }
      })
    }
    return res
  }, [token, refresh])

  return { token, user, login, refresh, logout, fetchWithAuth, authLoading }
} 