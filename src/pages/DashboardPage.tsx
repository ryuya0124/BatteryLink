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
import { Header } from "../components/Header";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";
import { useAuthLoading } from "@/hooks/AuthLoadingContext";
import { useFilterSettings } from "@/hooks/useFilterSettings";
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

  // フィルタ設定フックを使用
  const { settings: filterSettings } = useFilterSettings();

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
      const brandMatch = filterSettings.filterBrand === "all" || device.brand === filterSettings.filterBrand;
      const batteryMatch =
        filterSettings.filterBattery === "all" ||
        (filterSettings.filterBattery === "low" && device.battery_level <= 20) ||
        (filterSettings.filterBattery === "medium" && device.battery_level > 20 && device.battery_level <= 50) ||
        (filterSettings.filterBattery === "high" && device.battery_level > 50);
      return brandMatch && batteryMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (filterSettings.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "battery_level":
          comparison = a.battery_level - b.battery_level;
          break;
        case "last_updated":
          comparison = new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return filterSettings.sortOrder === "asc" ? comparison : -comparison;
    });

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;
    const newDevice = {
      uuid: crypto.randomUUID(),
      name: deviceName.trim(),
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
        const { battery_level, is_charging, temperature, voltage } = result.data;
        await updateDevice(deviceUuid, {
          battery_level,
          is_charging,
          temperature,
          voltage,
          last_updated: new Date().toISOString(),
        });
      } else {
        throw new Error(result.error || "バッテリー情報の取得に失敗しました");
      }
    } catch (error) {
      console.error("デバイス更新エラー:", error);
      throw error;
    }
  }, [updateDevice, getAccessTokenSilently]);

  const updateAllDevicesBattery = useCallback(async () => {
    if (!devices.length) return;
    const updatePromises = devices.map(device => updateDeviceBattery(device.uuid));
    try {
      await Promise.allSettled(updatePromises);
    } catch (error) {
      console.error("全デバイス更新エラー:", error);
    }
  }, [devices, updateDeviceBattery]);

  const fetchUserSettings = async () => {
    setAutoUpdateLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/me", {}, getAccessTokenSilently);
      if (res.ok) {
        const data = await res.json();
        setAutoUpdateEnabled(!!data.auto_update);
      }
    } catch (error) {
      console.error("ユーザー設定取得エラー:", error);
    }
    setAutoUpdateLoading(false);
  };

  const handleAutoUpdateChange = async (enabled: boolean) => {
    setAutoUpdateLoading(true);
    try {
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
      }
    } catch (error) {
      console.error("自動更新設定エラー:", error);
    }
    setAutoUpdateLoading(false);
  };

  const handleManualRefresh = async () => {
    setManualRefresh(true);
    try {
      await updateAllDevicesBattery();
    } finally {
      setManualRefresh(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      handleManualFetchDevices();
      fetchUserSettings();
    }
  }, [isAuthenticated, user]);

  if (authLoadingShown && isGlobalLoading) {
    return <FullScreenLoader label="ダッシュボードを読み込み中..." />;
  }
  if (showLoader) return <FullScreenLoader label="ダッシュボードを読み込み中..." />;
  if (!isAuthenticated) return <div>未認証</div>;

  return (
    <div className="h-screen bg-background text-foreground transition-colors px-4 sm:px-8 lg:px-16 overflow-hidden">
      <div className="container w-full max-w-full mx-auto px-0 sm:px-1 lg:px-2 py-4 sm:py-8 h-full flex flex-col">
        <Header 
          error={error}
        />
        {/* 左右分割 */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 flex-1 min-h-0">
          {/* 左カラム: 固定 */}
          <div className="w-full lg:w-1/4 flex-shrink-0 flex flex-col gap-4 px-0">
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
          <div className="w-full lg:w-3/4 flex flex-col min-h-0">
            <div className="flex-shrink-0">
              <DeviceFilterSort
                phoneModels={phoneModels}
              />
            </div>
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
            {/* デバイスカードセクション スクロール可能エリア */}
            <div className="flex-1 overflow-y-auto min-h-0 px-0">
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
        </div>
        <footer className="mt-8 sm:mt-16 text-center text-muted-foreground text-xs sm:text-sm w-full flex-shrink-0">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
} 