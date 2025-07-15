import React, { useState } from "react"
import { AppUser } from "@/types"
import { Battery } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// supabaseのmock
const mockUser = { id: "demo-user", email: "demo@example.com" }
const createClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: mockUser } } }),
    signInWithPassword: ({ email, password }: any) => Promise.resolve({ data: { user: mockUser }, error: null }),
    signUp: ({ email, password }: any) => Promise.resolve({ data: { user: mockUser }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
})
const supabase = createClient()

interface AuthFormProps {
  onAuthSuccess: (user: AppUser) => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (data.user) {
        onAuthSuccess({ id: data.user.id, email: data.user.email || "" })
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (data.user) {
        onAuthSuccess({ id: data.user.id, email: data.user.email || "" })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Battery className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">バッテリートラッカー</CardTitle>
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
                <Button type="submit" className="w-full">
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
                <Button type="submit" className="w-full">
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