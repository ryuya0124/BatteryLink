import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useDevices } from "../hooks/useDevices";
import { Button } from "../components/ui/button";
import { DeviceCard } from "../components/DeviceCard";
import { AddDeviceDialog } from "../components/AddDeviceDialog";
import { DeviceStats } from "../components/DeviceStats";
import { DeviceFilterSort } from "../components/DeviceFilterSort";
import { getBatteryColor, getBatteryCapacityColor, getBatteryCapacityBg, phoneModels, fetchWithAuth } from "../lib/utils";
import { AutoUpdateControl } from "../components/AutoUpdateControl";
import { NoDevices } from "../components/NoDevices";
import { Battery, LogOut, UserIcon } from "lucide-react";
import type { Device } from "../types";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";
import { useAuthLoading } from "@/hooks/AuthLoadingContext";

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const navigate = useNavigate();
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoUpdateLoading, setAutoUpdateLoading] = useState(true);
  const [manualRefresh, setManualRefresh] = useState(false);
  const appUser = user ? { id: user.sub, email: user.email } : null;
  const { devices, loading, updatingDevices, setUpdatingDevices, addDevice, updateDevice, deleteDevice, fetchDevices } = useDevices(appUser);
  const { authLoadingShown } = useAuthLoading();
  const isGlobalLoading = (isLoading || loading || autoUpdateLoading) && updatingDevices.size === 0 && !manualRefresh;
  const showLoader = useDelayedLoader(isGlobalLoading, authLoadingShown ? 200 : 50);

  const [sortBy, setSortBy] = useState<"name" | "battery" | "brand" | "updated">("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterBattery, setFilterBattery] = useState<string>("all");

  const [deviceName, setDeviceName] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceOsVersion, setDeviceOsVersion] = useState("");
  const [deviceModelNumber, setDeviceModelNumber] = useState("");
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [selectedModelInfo, setSelectedModelInfo] = useState<any>(null);

  const MIN_SPIN_DURATION = 500; // ms

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  useEffect(() => {
    const fetchUserSettings = async () => {
      setAutoUpdateLoading(true);
      const res = await fetchWithAuth("/api/auth/me", {}, getAccessTokenSilently);
      if (res.ok) {
        const data = await res.json();
        setAutoUpdateEnabled(!!data.auto_update);
      }
      setAutoUpdateLoading(false);
    };
    if (isAuthenticated) fetchUserSettings();
    else setAutoUpdateLoading(false);
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (!autoUpdateEnabled || devices.length === 0) return;
    const interval = setInterval(() => {
      updateAllDevicesBattery();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoUpdateEnabled, devices]);

  const fetchBatteryInfo = async (deviceUuid: string) => {
    try {
      const response = await fetchWithAuth(`/api/battery/${deviceUuid}`, {}, getAccessTokenSilently);
      return await response.json();
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const filteredAndSortedDevices = devices
    .filter((device) => {
      const brandMatch = filterBrand === "all" || device.brand === filterBrand;
      const batteryMatch =
        filterBattery === "all" ||
        (filterBattery === "low" && device.battery_level <= 20) ||
        (filterBattery === "medium" && device.battery_level > 20 && device.battery_level <= 50) ||
        (filterBattery === "high" && device.battery_level > 50);
      return brandMatch && batteryMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "battery":
          comparison = a.battery_level - b.battery_level;
          break;
        case "brand":
          comparison = a.brand.localeCompare(b.brand);
          break;
        case "updated":
          comparison = new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;
    const newDevice = {
      uuid: crypto.randomUUID(),
      name: deviceName,
      brand: deviceBrand,
      model: deviceModel,
      model_number: deviceModelNumber,
      battery_level: batteryLevel,
      last_updated: new Date().toISOString(),
      auto_update: undefined, // 送らない
      is_charging: false,
      // temperature, voltageは未入力ならundefinedのまま
      temperature: undefined,
      voltage: undefined,
    };
    try {
      await addDevice(newDevice);
      setShowAddDevice(false);
      setDeviceName("");
      setDeviceBrand("");
      setDeviceModel("");
      setDeviceOsVersion("");
      setDeviceModelNumber("");
      setBatteryLevel(undefined);
      setSelectedModelInfo(null);
    } catch (err: any) {
      setError("デバイス追加に失敗しました: " + (err?.message || "不明なエラー"));
    }
  };

  // カード内の更新ボタンは個別バッテリー情報更新
  const handleUpdateDevice = async (uuid: string) => {
    setError(null);
    setUpdatingDevices((prev) => new Set(prev).add(uuid));
    const start = Date.now();
    try {
      await updateDeviceBattery(uuid);
    } catch (err: any) {
      setError("デバイス更新に失敗しました: " + (err?.message || "不明なエラー"));
    }
    const elapsed = Date.now() - start;
    if (elapsed < MIN_SPIN_DURATION) {
      await new Promise(res => setTimeout(res, MIN_SPIN_DURATION - elapsed));
    }
    setUpdatingDevices((prev) => {
      const newSet = new Set(prev);
      newSet.delete(uuid);
      return newSet;
    });
  };

  const handleDeleteDevice = async (uuid: string) => {
    setError(null);
    try {
      await deleteDevice(uuid);
    } catch (err: any) {
      setError("デバイス削除に失敗しました: " + (err?.message || "不明なエラー"));
    }
  };

  const updateDeviceBattery = useCallback(async (deviceUuid: string) => {
    try {
      const result = await fetchBatteryInfo(deviceUuid);
      if (result.success && result.data) {
        const updatedDevice: any = {
          battery_level: result.data.batteryLevel,
          is_charging: result.data.isCharging,
          battery_capacity: result.data.batteryCapacity,
          last_updated: result.data.lastUpdated,
        };
        if (result.data.temperature !== undefined) {
          updatedDevice.temperature = result.data.temperature;
        }
        if (result.data.voltage !== undefined) {
          updatedDevice.voltage = result.data.voltage;
        }
      }
    } catch (error) {
      console.error("Failed to update battery:", error);
    }
  }, []);

  const updateAllDevicesBattery = useCallback(async () => {
    for (const device of devices) {
      await updateDeviceBattery(device.uuid);
    }
  }, [devices, updateDeviceBattery]);

  useEffect(() => {
    if (deviceBrand && deviceModel) {
      const brandModels = phoneModels[deviceBrand as keyof typeof phoneModels];
      const modelInfo = brandModels.find((m: any) => m.model === deviceModel);
      setSelectedModelInfo(modelInfo);
      setDeviceOsVersion("");
      setDeviceModelNumber("");
    }
  }, [deviceBrand, deviceModel]);

  const handleAutoUpdateChange = async (enabled: boolean) => {
    const res = await fetchWithAuth(
      "/api/auth/auto-update",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_update: enabled }),
      },
      getAccessTokenSilently
    );
    if (res.ok) {
      setAutoUpdateEnabled(enabled);
    } else {
      alert("自動更新の変更に失敗しました");
    }
  };

  const handleManualRefresh = async () => {
    setManualRefresh(true);
    const start = Date.now();
    await fetchDevices();
    const elapsed = Date.now() - start;
    if (elapsed < MIN_SPIN_DURATION) {
      await new Promise(res => setTimeout(res, MIN_SPIN_DURATION - elapsed));
    }
    setManualRefresh(false);
  };

  if (authLoadingShown && isGlobalLoading) {
    return <FullScreenLoader label="ダッシュボードを読み込み中..." />;
  }
  if (showLoader) return <FullScreenLoader label="ダッシュボードを読み込み中..." />;
  if (!isAuthenticated) return <div>未認証</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {error && <div className="mb-4 text-red-600 font-bold bg-red-50 border border-red-200 rounded px-4 py-2">{error}</div>}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">BatteryLink</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/account")}> <UserIcon className="h-4 w-4 mr-1" />アカウント</Button>
            <Button variant="outline" onClick={() => navigate("/apikeys")}>APIキー管理</Button>
            <Button variant="outline" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
              <LogOut className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </div>
        <AutoUpdateControl
          autoUpdateEnabled={autoUpdateEnabled}
          setAutoUpdateEnabled={handleAutoUpdateChange}
          onManualUpdate={handleManualRefresh}
          devicesCount={devices.length}
          manualRefresh={manualRefresh}
        />
        <DeviceStats devices={devices} />
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
        {/* AddDeviceDialog本体は常にレンダリング */}
        <AddDeviceDialog
          open={showAddDevice}
          onOpenChange={setShowAddDevice}
          deviceName={deviceName}
          setDeviceName={setDeviceName}
          deviceBrand={deviceBrand}
          setDeviceBrand={setDeviceBrand}
          deviceModel={deviceModel}
          setDeviceModel={setDeviceModel}
          deviceModelNumber={deviceModelNumber}
          setDeviceModelNumber={setDeviceModelNumber}
          phoneModels={phoneModels}
          selectedModelInfo={selectedModelInfo}
          onSubmit={handleAddDevice}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDevices.map((device) => (
            <DeviceCard
              key={device.uuid}
              device={device}
              onUpdate={handleUpdateDevice}
              onDelete={handleDeleteDevice}
              updating={updatingDevices.has(device.uuid)}
              getBatteryColor={getBatteryColor}
              getBatteryCapacityColor={getBatteryCapacityColor}
              getBatteryCapacityBg={getBatteryCapacityBg}
            />
          ))}
        </div>
        {/* デバイスが1つ以上あるとき、リストの下に追加ボタン */}
        {devices.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="default" onClick={() => setShowAddDevice(true)}>
              デバイスを追加
            </Button>
          </div>
        )}
        {filteredAndSortedDevices.length === 0 && devices.length > 0 && (
          <NoDevices type="filtered" />
        )}
        {filteredAndSortedDevices.length === 0 && devices.length === 0 && (
          <NoDevices type="empty" onAddDevice={() => setShowAddDevice(true)} />
        )}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 BatteryLink</p>
        </footer>
      </div>
    </div>
  );
} 