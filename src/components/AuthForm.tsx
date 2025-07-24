import React, { useState } from "react"
import { AppUser } from "@/types"
import { Battery } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AuthFormProps {
  onAuthSuccess: (user: AppUser, password: string) => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        let msg = isLogin ? "ログインに失敗しました" : "新規登録に失敗しました"
        try {
          const data = await res.json()
          if (data.error) msg = data.error
        } catch {}
        setError(msg)
        setLoading(false)
        return
      }
      const data = await res.json()
      // JWTからuser情報を抽出しない（tokenはCookie管理）
      onAuthSuccess({ id: email, email }, password)
      setLoading(false)
    } catch (e: any) {
      setError("通信エラーが発生しました")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Battery className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">BatterySync</CardTitle>
          </div>
          <CardDescription>スマートフォンのバッテリー残量を管理しましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(value) => setIsLogin(value === "login")}> 
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="signup">新規登録</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input id="email" type="email" name="username" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  ログイン
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  新規登録
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 