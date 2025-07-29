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
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";
import { useAuthLoading } from "@/hooks/AuthLoadingContext";
import type { Device } from "../types";

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

  // 初回デバイス取得・設定取得は明示的なボタン/イベントで呼ぶ
  const handleManualFetchDevices = async () => {
    if (user) await fetchDevices();
  };
  const handleManualFetchUserSettings = async () => {
    setAutoUpdateLoading(true);
    const res = await fetchWithAuth("/api/auth/me", {}, getAccessTokenSilently);
    if (res.ok) {
      const data = await res.json();
      setAutoUpdateEnabled(!!data.auto_update);
    }
    setAutoUpdateLoading(false);
  };
  // deviceBrand/deviceModelの副作用はonChangeで直接
  const handleDeviceBrandChange = (brand: string) => {
    setDeviceBrand(brand);
    setDeviceModel("");
    setDeviceOsVersion("");
    setDeviceModelNumber("");
    setSelectedModelInfo(null);
  };
  const handleDeviceModelChange = (model: string) => {
    setDeviceModel(model);
    const brandModels = phoneModels[deviceBrand as keyof typeof phoneModels];
    const modelInfo = brandModels?.find((m: any) => m.model === model);
    setSelectedModelInfo(modelInfo);
    setDeviceOsVersion("");
    setDeviceModelNumber("");
  };

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

  const handleEditDevice = async (uuid: string, updates: Partial<Device>) => {
    setError(null);
    try {
      await updateDevice(uuid, updates);
    } catch (err: any) {
      setError("デバイス編集に失敗しました: " + (err?.message || "不明なエラー"));
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

  // 初回表示時のみ自動fetch（どうしても必要な副作用）
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDevices();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserSettings();
    } else {
      setAutoUpdateLoading(false); // 未認証時も必ず解除
    }
  }, [isAuthenticated]);

  const fetchUserSettings = async () => {
    setAutoUpdateLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/me", {}, getAccessTokenSilently);
      if (res.ok) {
        const data = await res.json();
        setAutoUpdateEnabled(!!data.auto_update);
      }
    } catch (e) {
      // エラー時も何もしない
    }
    setAutoUpdateLoading(false); // 必ず最後に呼ぶ
  };

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
    <div className="min-h-screen bg-background text-foreground transition-colors px-4 sm:px-8 lg:px-16">
      <div className="container w-full max-w-full mx-auto px-0 sm:px-1 lg:px-2 py-4 sm:py-8 my-2 sm:my-4 lg:my-8">
        {error && <div className="mb-4 text-red-600 font-bold bg-red-50 border border-red-200 rounded px-4 py-2">{error}</div>}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start min-w-0">
            <Battery className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground drop-shadow min-w-0 max-w-full flex-shrink-0 truncate">BatterySync</h1>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 w-full min-w-0">
            <Button variant="outline" onClick={handleManualFetchDevices} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">デバイス再取得</Button>
            <Button variant="outline" onClick={handleManualFetchUserSettings} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">設定再取得</Button>
            <Button variant="outline" onClick={() => navigate("/account")} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center"> <UserIcon className="h-4 w-4 mr-1" />アカウント</Button>
            <Button variant="outline" onClick={() => navigate("/apikeys")} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">APIキー管理</Button>
            <Button variant="outline" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">
              <LogOut className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </div>
        {/* 左右分割 */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 h-screen overflow-hidden">
          {/* 左カラム: 固定 */}
          <div className="w-full lg:w-1/4 flex-shrink-0 flex flex-col gap-4 sticky top-0 h-[calc(100vh-64px)] px-0">
            <AutoUpdateControl
              autoUpdateEnabled={autoUpdateEnabled}
              setAutoUpdateEnabled={handleAutoUpdateChange}
              onManualUpdate={handleManualRefresh}
              devicesCount={devices.length}
              manualRefresh={manualRefresh}
            />
            <DeviceStats devices={devices} />
            {/* デバイス追加ボタン */}
            {devices.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button variant="default" onClick={() => setShowAddDevice(true)}>
                  デバイスを追加
                </Button>
              </div>
            )}
          </div>
          {/* 右カラム: スクロール＋フィルタ上部 */}
          <div className="w-full lg:w-3/4 flex flex-col h-screen overflow-y-auto px-0" style={{ maxHeight: '100vh' }}>
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
              setDeviceBrand={handleDeviceBrandChange}
              deviceModel={deviceModel}
              setDeviceModel={handleDeviceModelChange}
              deviceModelNumber={deviceModelNumber}
              setDeviceModelNumber={setDeviceModelNumber}
              phoneModels={phoneModels}
              selectedModelInfo={selectedModelInfo}
              onSubmit={handleAddDevice}
            />
            {/* デバイスカードセクション ラップ */}
            {/* デバイスカードセクション ラップ */}
            <div className="w-full px-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                {filteredAndSortedDevices.map((device) => (
                  <div key={device.uuid} className="w-full">
                    <DeviceCard
                      device={device}
                      onUpdate={handleUpdateDevice}
                      onDelete={handleDeleteDevice}
                      onEdit={handleEditDevice}
                      updating={updatingDevices.has(device.uuid)}
                      getBatteryColor={getBatteryColor}
                      getBatteryCapacityColor={getBatteryCapacityColor}
                      getBatteryCapacityBg={getBatteryCapacityBg}
                    />
                  </div>
                ))}
              </div>
            </div>
            {filteredAndSortedDevices.length === 0 && devices.length > 0 && (
              <NoDevices type="filtered" />
            )}
            {filteredAndSortedDevices.length === 0 && devices.length === 0 && (
              <NoDevices type="empty" onAddDevice={() => setShowAddDevice(true)} />
            )}
          </div>
        </div>
        <footer className="mt-8 sm:mt-16 text-center text-muted-foreground text-xs sm:text-sm w-full">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
} 