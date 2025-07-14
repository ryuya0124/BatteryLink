"use client"

import type React from "react"
import type { AppUser } from "@/types" // Import AppUser type
import { useState, useEffect, useCallback } from "react"
import {
  Battery,
  Smartphone,
  Plus,
  LogOut,
  UserIcon,
  AlertTriangle,
  RefreshCw,
  Zap,
  Thermometer,
  ListFilter,
  ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data and functions for demo purposes
const mockUser = { id: "demo-user", email: "demo@example.com" }

// Remove the supabase client creation and replace with mock functions
const createClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: mockUser } } }),
    signInWithPassword: ({ email, password }: any) => Promise.resolve({ data: { user: mockUser }, error: null }),
    signUp: ({ email, password }: any) => Promise.resolve({ data: { user: mockUser }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options: any) =>
          Promise.resolve({
            data: JSON.parse(localStorage.getItem(`${table}_${value}`) || "[]"),
            error: null,
          }),
      }),
    }),
    insert: (data: any[]) => ({
      select: () => {
        const newItem = { ...data[0], id: Date.now().toString() }
        const existing = JSON.parse(localStorage.getItem(`${table}_${data[0].user_id}`) || "[]")
        const updated = [...existing, newItem]
        localStorage.setItem(`${table}_${data[0].user_id}`, JSON.stringify(updated))
        return Promise.resolve({ data: [newItem], error: null })
      },
    }),
    update: (updateData: any) => ({
      eq: (column: string, value: any) => ({
        select: () => {
          const existing = JSON.parse(localStorage.getItem(`${table}_demo-user`) || "[]")
          const updated = existing.map((item: any) => (item.id === value ? { ...item, ...updateData } : item))
          localStorage.setItem(`${table}_demo-user`, JSON.stringify(updated))
          return Promise.resolve({ data: updated.filter((item: any) => item.id === value), error: null })
        },
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => {
        const existing = JSON.parse(localStorage.getItem(`${table}_demo-user`) || "[]")
        const updated = existing.filter((item: any) => item.id !== value)
        localStorage.setItem(`${table}_demo-user`, JSON.stringify(updated))
        return Promise.resolve({ error: null })
      },
    }),
  }),
})

const supabase = createClient()

// インターフェースを更新
interface Device {
  id: string
  name: string
  brand: string
  model: string
  os_version: string
  model_number: string
  battery_level: number
  battery_capacity?: number
  last_updated: string
  user_id: string
  is_charging?: boolean
  temperature?: number
  voltage?: string
  auto_update?: boolean
}

interface BatteryApiResponse {
  success: boolean
  data?: {
    deviceId: string
    batteryLevel: number
    isCharging: boolean
    lastUpdated: string
    batteryCapacity: number
    temperature?: number
    voltage?: string
  }
  error?: string
}

// phoneModelsを更新してOSバージョンと型番を含める
const phoneModels = {
  Apple: [
    { model: "iPhone 15 Pro", osVersions: ["iOS 17.0", "iOS 17.1", "iOS 17.2"], modelNumbers: ["A3102", "A3103"] },
    { model: "iPhone 15", osVersions: ["iOS 17.0", "iOS 17.1", "iOS 17.2"], modelNumbers: ["A3090", "A3091"] },
    { model: "iPhone 14 Pro", osVersions: ["iOS 16.0", "iOS 16.1", "iOS 17.0"], modelNumbers: ["A2890", "A2891"] },
    { model: "iPhone 14", osVersions: ["iOS 16.0", "iOS 16.1", "iOS 17.0"], modelNumbers: ["A2882", "A2883"] },
    { model: "iPhone 13", osVersions: ["iOS 15.0", "iOS 16.0", "iOS 17.0"], modelNumbers: ["A2482", "A2483"] },
    { model: "iPhone 12", osVersions: ["iOS 14.0", "iOS 15.0", "iOS 16.0"], modelNumbers: ["A2172", "A2173"] },
  ],
  Samsung: [
    { model: "Galaxy S24", osVersions: ["Android 14", "Android 13"], modelNumbers: ["SM-S921", "SM-S926"] },
    { model: "Galaxy S23", osVersions: ["Android 13", "Android 14"], modelNumbers: ["SM-S911", "SM-S916"] },
    { model: "Galaxy S22", osVersions: ["Android 12", "Android 13"], modelNumbers: ["SM-S901", "SM-S906"] },
    { model: "Galaxy Note 20", osVersions: ["Android 10", "Android 11"], modelNumbers: ["SM-N981", "SM-N986"] },
    { model: "Galaxy A54", osVersions: ["Android 13", "Android 14"], modelNumbers: ["SM-A546", "SM-A547"] },
  ],
  Google: [
    { model: "Pixel 8 Pro", osVersions: ["Android 14", "Android 15"], modelNumbers: ["GC3VE", "G1MNW"] },
    { model: "Pixel 8", osVersions: ["Android 14", "Android 15"], modelNumbers: ["GX7AS", "G9BQD"] },
    { model: "Pixel 7 Pro", osVersions: ["Android 13", "Android 14"], modelNumbers: ["GE2AE", "GP4BC"] },
    { model: "Pixel 7", osVersions: ["Android 13", "Android 14"], modelNumbers: ["GVU6C", "G03Z5"] },
    { model: "Pixel 6", osVersions: ["Android 12", "Android 13"], modelNumbers: ["GB7N6", "G9S9B"] },
  ],
  Xiaomi: [
    { model: "Mi 13", osVersions: ["Android 13", "Android 14"], modelNumbers: ["2210132C", "2210132G"] },
    { model: "Mi 12", osVersions: ["Android 12", "Android 13"], modelNumbers: ["2201123C", "2201123G"] },
    { model: "Redmi Note 12", osVersions: ["Android 13", "Android 14"], modelNumbers: ["22101316C", "22101316G"] },
    { model: "Redmi Note 11", osVersions: ["Android 11", "Android 12"], modelNumbers: ["21091116C", "21091116G"] },
    { model: "POCO F5", osVersions: ["Android 13", "Android 14"], modelNumbers: ["23013PC75C", "23013PC75G"] },
  ],
  Huawei: [
    { model: "P60 Pro", osVersions: ["HarmonyOS 3.1", "HarmonyOS 4.0"], modelNumbers: ["ALN-AL00", "ALN-TL00"] },
    { model: "P50 Pro", osVersions: ["HarmonyOS 2.0", "HarmonyOS 3.0"], modelNumbers: ["JAD-AL50", "JAD-TL50"] },
    { model: "Mate 50", osVersions: ["HarmonyOS 3.0", "HarmonyOS 4.0"], modelNumbers: ["DCO-AL00", "DCO-TL00"] },
    { model: "Nova 11", osVersions: ["HarmonyOS 3.1", "HarmonyOS 4.0"], modelNumbers: ["FOA-AL00", "FOA-TL00"] },
    { model: "Honor 90", osVersions: ["Android 13", "Android 14"], modelNumbers: ["REA-AN00", "REA-TN00"] },
  ],
  OnePlus: [
    { model: "OnePlus 11", osVersions: ["Android 13", "Android 14"], modelNumbers: ["PJD110", "PJZ110"] },
    { model: "OnePlus 10 Pro", osVersions: ["Android 12", "Android 13"], modelNumbers: ["NE2213", "NE2215"] },
    { model: "OnePlus Nord 3", osVersions: ["Android 13", "Android 14"], modelNumbers: ["CPH2493", "CPH2491"] },
    { model: "OnePlus 9", osVersions: ["Android 11", "Android 12"], modelNumbers: ["LE2113", "LE2115"] },
  ],
}

export default function BatteryTracker() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [updatingDevices, setUpdatingDevices] = useState<Set<string>>(new Set())

  // 新しいstateを追加
  const [sortBy, setSortBy] = useState<"name" | "battery" | "brand" | "updated">("updated")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterBrand, setFilterBrand] = useState<string>("all")
  const [filterBattery, setFilterBattery] = useState<string>("all")

  // Add device form states を更新
  const [deviceName, setDeviceName] = useState("")
  const [deviceBrand, setDeviceBrand] = useState("")
  const [deviceModel, setDeviceModel] = useState("")
  const [deviceOsVersion, setDeviceOsVersion] = useState("")
  const [deviceModelNumber, setDeviceModelNumber] = useState("")
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [selectedModelInfo, setSelectedModelInfo] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchDevices()
    }
  }, [user])

  // 自動更新のタイマー
  useEffect(() => {
    if (!autoUpdateEnabled || devices.length === 0) return

    const interval = setInterval(() => {
      updateAllDevicesBattery()
    }, 30000) // 30秒ごとに更新

    return () => clearInterval(interval)
  }, [autoUpdateEnabled, devices])

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      setUser({ id: session.user.id, email: session.user.email || "" })
    }
    setLoading(false)
  }

  const fetchDevices = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", user.id)
      .order("last_updated", { ascending: false })

    if (data) {
      setDevices(data)
    }
  }

  const fetchBatteryInfo = async (deviceId: string): Promise<BatteryApiResponse> => {
    try {
      const response = await fetch(`/api/battery/${deviceId}`)
      return await response.json()
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  // バッテリー容量に基づく色を取得する関数を追加
  const getBatteryCapacityColor = (capacity: number) => {
    if (capacity >= 5000) return "text-green-600"
    if (capacity >= 4000) return "text-blue-600"
    if (capacity >= 3500) return "text-yellow-600"
    return "text-orange-600"
  }

  const getBatteryCapacityBg = (capacity: number) => {
    if (capacity >= 5000) return "bg-green-100"
    if (capacity >= 4000) return "bg-blue-100"
    if (capacity >= 3500) return "bg-yellow-100"
    return "bg-orange-100"
  }

  // デバイスの並び替えとフィルタリング関数を追加
  const filteredAndSortedDevices = devices
    .filter((device) => {
      const brandMatch = filterBrand === "all" || device.brand === filterBrand
      const batteryMatch =
        filterBattery === "all" ||
        (filterBattery === "low" && device.battery_level <= 20) ||
        (filterBattery === "medium" && device.battery_level > 20 && device.battery_level <= 50) ||
        (filterBattery === "high" && device.battery_level > 50)

      return brandMatch && batteryMatch
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "battery":
          comparison = a.battery_level - b.battery_level
          break
        case "brand":
          comparison = a.brand.localeCompare(b.brand)
          break
        case "updated":
          comparison = new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

  // addDevice関数を更新
  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const newDevice = {
      name: deviceName,
      brand: deviceBrand,
      model: deviceModel,
      os_version: deviceOsVersion,
      model_number: deviceModelNumber,
      battery_level: batteryLevel,
      user_id: user.id,
      last_updated: new Date().toISOString(),
      auto_update: true,
      is_charging: false,
      temperature: deviceBrand !== "Apple" ? 30 : undefined,
      voltage: deviceBrand !== "Apple" ? "3.8" : undefined,
    }

    const { data, error } = await supabase.from("devices").insert([newDevice]).select()

    if (data) {
      setDevices([...devices, data[0]])
      setShowAddDevice(false)
      setDeviceName("")
      setDeviceBrand("")
      setDeviceModel("")
      setDeviceOsVersion("")
      setDeviceModelNumber("")
      setBatteryLevel(100)
      setSelectedModelInfo(null)
    }
  }

  // updateDeviceBattery関数を更新
  const updateDeviceBattery = useCallback(async (deviceId: string) => {
    setUpdatingDevices((prev) => new Set(prev).add(deviceId))

    try {
      const result = await fetchBatteryInfo(deviceId)

      if (result.success && result.data) {
        const updatedDevice: any = {
          battery_level: result.data.batteryLevel,
          is_charging: result.data.isCharging,
          battery_capacity: result.data.batteryCapacity,
          last_updated: result.data.lastUpdated,
        }

        // Androidの場合のみ温度と電圧を更新
        if (result.data.temperature !== undefined) {
          updatedDevice.temperature = result.data.temperature
        }
        if (result.data.voltage !== undefined) {
          updatedDevice.voltage = result.data.voltage
        }

        // LocalStorageを更新
        const existing = JSON.parse(localStorage.getItem("devices_demo-user") || "[]")
        const updated = existing.map((item: any) => (item.id === deviceId ? { ...item, ...updatedDevice } : item))
        localStorage.setItem("devices_demo-user", JSON.stringify(updated))

        // Stateを更新
        setDevices((prevDevices) =>
          prevDevices.map((device) => (device.id === deviceId ? { ...device, ...updatedDevice } : device)),
        )
      }
    } catch (error) {
      console.error("Failed to update battery:", error)
    } finally {
      setUpdatingDevices((prev) => {
        const newSet = new Set(prev)
        newSet.delete(deviceId)
        return newSet
      })
    }
  }, [])

  const updateAllDevicesBattery = useCallback(async () => {
    const updatePromises = devices.map((device) => updateDeviceBattery(device.id))
    await Promise.all(updatePromises)
  }, [devices, updateDeviceBattery])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || "" })
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || "" })
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDevices([])
  }

  // deviceBrandが変更された時の処理を追加
  useEffect(() => {
    if (deviceBrand && deviceModel) {
      const brandModels = phoneModels[deviceBrand as keyof typeof phoneModels]
      const modelInfo = brandModels.find((m: any) => m.model === deviceModel)
      setSelectedModelInfo(modelInfo)
      setDeviceOsVersion("")
      setDeviceModelNumber("")
    }
  }, [deviceBrand, deviceModel])

  const deleteDevice = async (deviceId: string) => {
    const { error } = await supabase.from("devices").delete().eq("id", deviceId)

    if (!error) {
      setDevices(devices.filter((device) => device.id !== deviceId))
    }
  }

  const getBatteryColor = (level: number) => {
    if (level <= 20) return "text-red-500"
    if (level <= 50) return "text-yellow-500"
    return "text-green-500"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">バッテリートラッカー</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="h-4 w-4" />
              {user.email}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>

        {/* Auto Update Control */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${autoUpdateEnabled ? "text-green-600" : "text-gray-400"}`} />
                  <Label htmlFor="auto-update" className="text-sm font-medium">
                    自動更新
                  </Label>
                </div>
                <p className="text-xs text-gray-500">30秒ごとにAPIからバッテリー情報を自動取得します</p>
              </div>
              <div className="flex items-center gap-4">
                <Switch id="auto-update" checked={autoUpdateEnabled} onCheckedChange={setAutoUpdateEnabled} />
                <Button variant="outline" size="sm" onClick={updateAllDevicesBattery} disabled={devices.length === 0}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  手動更新
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録デバイス数</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">低バッテリー警告</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {devices.filter((device) => device.battery_level <= 20).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sort and Filter Controls (Dropdown Menus) */}
        <div className="flex gap-4 mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                並び替え:{" "}
                {sortBy === "updated"
                  ? "更新日時"
                  : sortBy === "name"
                    ? "デバイス名"
                    : sortBy === "battery"
                      ? "バッテリー残量"
                      : "ブランド"}
                {sortOrder === "asc" ? " (昇順)" : " (降順)"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>並び替え</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("updated")}>
                更新日時 {sortBy === "updated" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                デバイス名 {sortBy === "name" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("battery")}>
                バッテリー残量 {sortBy === "battery" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("brand")}>
                ブランド {sortBy === "brand" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>順序</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                降順 {sortOrder === "desc" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("asc")}>昇順 {sortOrder === "asc" && "✓"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ListFilter className="h-4 w-4 mr-2" />
                ブランド: {filterBrand === "all" ? "全て" : filterBrand}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>ブランドでフィルタ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterBrand("all")}>
                全て {filterBrand === "all" && "✓"}
              </DropdownMenuItem>
              {Object.keys(phoneModels).map((brand) => (
                <DropdownMenuItem key={brand} onClick={() => setFilterBrand(brand)}>
                  {brand} {filterBrand === brand && "✓"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ListFilter className="h-4 w-4 mr-2" />
                残量:{" "}
                {filterBattery === "all"
                  ? "全て"
                  : filterBattery === "high"
                    ? "高 (50%以上)"
                    : filterBattery === "medium"
                      ? "中 (21-50%)"
                      : "低 (20%以下)"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>バッテリー残量でフィルタ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterBattery("all")}>
                全て {filterBattery === "all" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBattery("high")}>
                高 (50%以上) {filterBattery === "high" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBattery("medium")}>
                中 (21-50%) {filterBattery === "medium" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBattery("low")}>
                低 (20%以下) {filterBattery === "low" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Add Device Button */}
        <div className="mb-6">
          <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                デバイスを追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいデバイスを追加</DialogTitle>
                <DialogDescription>スマートフォンの情報を入力してください</DialogDescription>
              </DialogHeader>
              <form onSubmit={addDevice} className="space-y-4">
                <div>
                  <Label htmlFor="deviceName">デバイス名</Label>
                  <Input
                    id="deviceName"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="例: メインのiPhone"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deviceBrand">ブランド</Label>
                  <Select value={deviceBrand} onValueChange={setDeviceBrand} required>
                    <SelectTrigger>
                      <SelectValue placeholder="ブランドを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(phoneModels).map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {deviceBrand && (
                  <div>
                    <Label htmlFor="deviceModel">モデル</Label>
                    <Select value={deviceModel} onValueChange={setDeviceModel} required>
                      <SelectTrigger>
                        <SelectValue placeholder="モデルを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneModels[deviceBrand as keyof typeof phoneModels].map((modelInfo: any) => (
                          <SelectItem key={modelInfo.model} value={modelInfo.model}>
                            {modelInfo.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedModelInfo && (
                  <>
                    <div>
                      <Label htmlFor="deviceOsVersion">OSバージョン</Label>
                      <Select value={deviceOsVersion} onValueChange={setDeviceOsVersion} required>
                        <SelectTrigger>
                          <SelectValue placeholder="OSバージョンを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModelInfo.osVersions.map((version: string) => (
                            <SelectItem key={version} value={version}>
                              {version}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="deviceModelNumber">型番</Label>
                      <Select value={deviceModelNumber} onValueChange={setDeviceModelNumber} required>
                        <SelectTrigger>
                          <SelectValue placeholder="型番を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModelInfo.modelNumbers.map((modelNumber: string) => (
                            <SelectItem key={modelNumber} value={modelNumber}>
                              {modelNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="batteryLevel">初期バッテリー残量 (%)</Label>
                  <Input
                    id="batteryLevel"
                    type="number"
                    min="0"
                    max="100"
                    value={batteryLevel}
                    onChange={(e) => setBatteryLevel(Number(e.target.value))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  デバイスを追加
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{device.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {device.brand} {device.model}
                    </CardDescription>
                    <div className="text-xs text-gray-400 mt-1">
                      {device.os_version} • {device.model_number}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={device.battery_level <= 20 ? "destructive" : "default"}>
                      {device.battery_level <= 20 && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {device.battery_level}%
                    </Badge>
                    {device.is_charging && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        充電中
                      </Badge>
                    )}
                    {device.battery_capacity && (
                      <Badge variant="outline" className={`text-xs ${getBatteryCapacityBg(device.battery_capacity)}`}>
                        <Battery className={`h-3 w-3 mr-1 ${getBatteryCapacityColor(device.battery_capacity)}`} />
                        {device.battery_capacity}mAh
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Battery Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>バッテリー残量</span>
                    <span className={getBatteryColor(device.battery_level)}>{device.battery_level}%</span>
                  </div>
                  <Progress value={device.battery_level} className="h-3" />
                </div>

                {/* Device Stats - Androidのみ温度と電圧を表示 */}
                {device.brand !== "Apple" && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span>{device.temperature || 30}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>{device.voltage || "3.8"}V</span>
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                <div className="text-xs text-gray-500">
                  最終更新: {new Date(device.last_updated).toLocaleString("ja-JP")}
                </div>

                {/* Manual Update Button */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => updateDeviceBattery(device.id)}
                    disabled={updatingDevices.has(device.id)}
                  >
                    {updatingDevices.has(device.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        更新中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        今すぐ更新
                      </>
                    )}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteDevice(device.id)}>
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Devices */}
        {filteredAndSortedDevices.length === 0 && devices.length > 0 && (
          <div className="text-center py-12">
            <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">条件に一致するデバイスがありません</h3>
            <p className="text-gray-500">フィルター条件を変更してください</p>
          </div>
        )}

        {filteredAndSortedDevices.length === 0 && devices.length === 0 && (
          <div className="text-center py-12">
            <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">デバイスが登録されていません</h3>
            <p className="text-gray-500 mb-4">最初のスマートフォンを追加してバッテリー管理を始めましょう</p>
            <Button onClick={() => setShowAddDevice(true)}>
              <Plus className="h-4 w-4 mr-2" />
              デバイスを追加
            </Button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2024 バッテリートラッカー. APIによる自動更新対応</p>
        </footer>
      </div>
    </div>
  )
}
