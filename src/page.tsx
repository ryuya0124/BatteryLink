"use client"

import type React from "react"
import type { AppUser, Device } from "@/types" // Import AppUser type
import { useState, useEffect, useCallback } from "react"
import {
  Battery,
  LogOut,
  UserIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeviceCard } from "@/components/DeviceCard"
import { AddDeviceDialog } from "@/components/AddDeviceDialog"
import { DeviceStats } from "@/components/DeviceStats"
import { DeviceFilterSort } from "@/components/DeviceFilterSort"
import { useDevices } from "@/hooks/useDevices"
import { getBatteryColor, getBatteryCapacityColor, getBatteryCapacityBg, phoneModels } from "@/lib/utils"
import { AuthForm } from "@/components/AuthForm"
import { AutoUpdateControl } from "@/components/AutoUpdateControl"
import { NoDevices } from "@/components/NoDevices"

// Mock data and functions for demo purposes
const mockUser = { id: "demo-user", email: "demo@example.com" }

// Remove the supabase client creation and replace with mock functions
const createClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: mockUser } } }),
    signOut: () => Promise.resolve({ error: null }),
  },
})

const supabase = createClient()

// インターフェースを更新
// Device型定義（interface Device { ... }）を削除

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

export default function BatteryTracker() {
  // 1. user, setUserのuseStateを関数の先頭で定義
  const [user, setUser] = useState<AppUser | null>(null)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)

  // 2. useDevicesで取得したstateを定義
  const { devices, loading, updatingDevices, addDevice, updateDevice, deleteDevice, fetchDevices } = useDevices(user)

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
  }

  const fetchBatteryInfo = async (deviceId: string): Promise<BatteryApiResponse> => {
    try {
      const response = await fetch(`/api/battery/${deviceId}`)
      return await response.json()
    } catch (error) {
      return { success: false, error: "Network error" }
    }
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
  const handleAddDevice = async (e: React.FormEvent) => {
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

    await addDevice(newDevice)
    setShowAddDevice(false)
    setDeviceName("")
    setDeviceBrand("")
    setDeviceModel("")
    setDeviceOsVersion("")
    setDeviceModelNumber("")
    setBatteryLevel(100)
    setSelectedModelInfo(null)
  }

  // updateDeviceBattery関数を更新
  const updateDeviceBattery = useCallback(async (deviceId: string) => {
    // setUpdatingDevices((prev) => new Set(prev).add(deviceId)) // useDevicesで管理

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
        // const existing = JSON.parse(localStorage.getItem("devices_demo-user") || "[]") // 古い関数
        // const updated = existing.map((item: any) => (item.id === deviceId ? { ...item, ...updatedDevice } : item))
        // localStorage.setItem("devices_demo-user", JSON.stringify(updated))

        // Stateを更新
        // setDevices((prevDevices) => // useDevicesで管理
        //   prevDevices.map((device) => (device.id === deviceId ? { ...device, ...updatedDevice } : device)),
        // )
      }
    } catch (error) {
      console.error("Failed to update battery:", error)
    } finally {
      // setUpdatingDevices((prev) => { // useDevicesで管理
      //   const newSet = new Set(prev)
      //   newSet.delete(deviceId)
      //   return newSet
      // })
    }
  }, [])

  const updateAllDevicesBattery = useCallback(async () => {
    const updatePromises = devices.map((device) => updateDeviceBattery(device.id))
    await Promise.all(updatePromises)
  }, [devices, updateDeviceBattery])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    // setDevices([]) // useDevicesで管理
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onAuthSuccess={setUser} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">BatteryLink</h1>
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
        <AutoUpdateControl
          autoUpdateEnabled={autoUpdateEnabled}
          setAutoUpdateEnabled={setAutoUpdateEnabled}
          onManualUpdate={updateAllDevicesBattery}
          devicesCount={devices.length}
        />

        {/* Stats */}
        <DeviceStats devices={devices} />

        {/* Sort and Filter Controls (Dropdown Menus) */}
        <DeviceFilterSort
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          filterBrand={filterBrand}
          setFilterBrand={setFilterBrand}
          filterBattery={filterBattery}
          setFilterBattery={setFilterBattery}
          phoneModels={phoneModels}
        />

        {/* Add Device Button */}
        <div className="mb-6">
          <AddDeviceDialog
            open={showAddDevice}
            onOpenChange={setShowAddDevice}
            deviceName={deviceName}
            setDeviceName={setDeviceName}
            deviceBrand={deviceBrand}
            setDeviceBrand={setDeviceBrand}
            deviceModel={deviceModel}
            setDeviceModel={setDeviceModel}
            deviceOsVersion={deviceOsVersion}
            setDeviceOsVersion={setDeviceOsVersion}
            deviceModelNumber={deviceModelNumber}
            setDeviceModelNumber={setDeviceModelNumber}
            batteryLevel={batteryLevel}
            setBatteryLevel={setBatteryLevel}
            phoneModels={phoneModels}
            selectedModelInfo={selectedModelInfo}
            onSubmit={handleAddDevice}
          />
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onUpdate={(id) => updateDevice(id, { /* 必要な更新データ */ })}
              onDelete={deleteDevice}
              updating={updatingDevices.has(device.id)}
              getBatteryColor={getBatteryColor}
              getBatteryCapacityColor={getBatteryCapacityColor}
              getBatteryCapacityBg={getBatteryCapacityBg}
            />
          ))}
        </div>

        {/* No Devices */}
        {filteredAndSortedDevices.length === 0 && devices.length > 0 && (
          <NoDevices type="filtered" />
        )}

        {filteredAndSortedDevices.length === 0 && devices.length === 0 && (
          <NoDevices type="empty" onAddDevice={() => setShowAddDevice(true)} />
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 BatteryLink</p>
        </footer>
      </div>
    </div>
  )
}