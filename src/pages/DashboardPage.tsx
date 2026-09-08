import React, { useState, useEffect, useCallback } from "react";
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
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";
import { useAuthLoading } from "@/hooks/AuthLoadingContext";
import { useFilterSettings } from "@/hooks/useFilterSettings";
import type { Device } from "../types";
import { Plus, Search } from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoUpdateLoading, setAutoUpdateLoading] = useState(true);
  const [manualRefresh, setManualRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const appUser = user?.sub ? { id: user.sub, email: user.email ?? "" } : null;
  const { devices, loading, updatingDevices, setUpdatingDevices, addDevice, updateDevice, deleteDevice, fetchDevices } = useDevices(appUser);
  const { authLoadingShown } = useAuthLoading();
  const isGlobalLoading = (isLoading || loading || autoUpdateLoading) && updatingDevices.size === 0 && !manualRefresh;
  const showLoader = useDelayedLoader(isGlobalLoading, authLoadingShown ? 200 : 50);

  // フィルタ設定フックを使用
  const { settings: filterSettings } = useFilterSettings();

  const [deviceName, setDeviceName] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceModelNumber, setDeviceModelNumber] = useState("");
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [selectedModelInfo, setSelectedModelInfo] = useState<any>(null);

  const MIN_SPIN_DURATION = 500; // ms

  // deviceBrand/deviceModelの副作用はonChangeで直接
  const handleDeviceBrandChange = (brand: string) => {
    setDeviceBrand(brand);
    setDeviceModel("");
    setDeviceModelNumber("");
    setSelectedModelInfo(null);
  };
  const handleDeviceModelChange = (model: string) => {
    setDeviceModel(model);
    const brandModels = phoneModels[deviceBrand as keyof typeof phoneModels];
    const modelInfo = brandModels?.find((m: any) => m.model === model);
    setSelectedModelInfo(modelInfo);
    setDeviceModelNumber("");
  };

  useEffect(() => {
    if (!autoUpdateEnabled || devices.length === 0) return;
    const interval = setInterval(() => {
      fetchDevices().catch(() => setError("デバイス情報の自動取得に失敗しました"));
    }, 30000);
    return () => clearInterval(interval);
  }, [autoUpdateEnabled, devices.length, fetchDevices]);


  const filteredAndSortedDevices = devices
    .filter((device) => {
      const query = search.trim().toLocaleLowerCase();
      if (query && ![device.name, device.brand, device.model, device.uuid].some(value => value?.toLocaleLowerCase().includes(query))) return false;
      const brandMatch = filterSettings.filterBrand === "all" || device.brand === filterSettings.filterBrand;
      const batteryMatch =
        filterSettings.filterBattery === "all" ||
        (device.battery_level !== null && filterSettings.filterBattery === "low" && device.battery_level <= 20) ||
        (device.battery_level !== null && filterSettings.filterBattery === "medium" && device.battery_level > 20 && device.battery_level <= 50) ||
        (device.battery_level !== null && filterSettings.filterBattery === "high" && device.battery_level > 50);
      return brandMatch && batteryMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (filterSettings.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "battery_level":
          comparison = (a.battery_level ?? -1) - (b.battery_level ?? -1);
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
      battery_level: batteryLevel ?? null,
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
      await fetchDevices();
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
      throw err;
    }
  };


  const fetchUserSettings = useCallback(async () => {
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
  }, [getAccessTokenSilently]);

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
      await fetchDevices();
    } catch {
      setError("デバイス情報の取得に失敗しました");
    } finally {
      setManualRefresh(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices().catch(() => setError("デバイス一覧の取得に失敗しました"));
      fetchUserSettings();
    }
  }, [isAuthenticated, user?.sub, fetchDevices, fetchUserSettings]);

  if (authLoadingShown && isGlobalLoading) {
    return <FullScreenLoader label="ダッシュボードを読み込み中..." />;
  }
  if (showLoader) return <FullScreenLoader label="ダッシュボードを読み込み中..." />;
  if (!isAuthenticated) return <div>未認証</div>;

  return (
    <Layout error={error}>
      <SEO title="ダッシュボード" noindex />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="page-kicker">OVERVIEW</p>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="page-description">デバイスの今を、まとめて確認。</p>
        </div>
        <Button onClick={() => setShowAddDevice(true)} className="gap-2"><Plus size={17} />デバイスを追加</Button>
      </div>
        {/* 左右分割 */}
        <div className="flex flex-col gap-6 min-h-0">
          {/* 左カラム: 固定 */}
          <div className="w-full flex flex-col gap-5">
            <DeviceStats devices={devices} />
            <AutoUpdateControl
              autoUpdateEnabled={autoUpdateEnabled}
              setAutoUpdateEnabled={handleAutoUpdateChange}
              onManualUpdate={handleManualRefresh}
              devicesCount={devices.length}
              manualRefresh={manualRefresh}
            />
          </div>
          {/* 右カラム: スクロール＋フィルタ上部 */}
          <div className="w-full flex flex-col flex-1 min-h-0">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="relative w-full xl:max-w-sm">
                <label htmlFor="device-search" className="sr-only">名前・ブランド・モデル・UUIDでデバイスを検索</label>
                <Search size={17} className="pointer-events-none absolute left-3.5 top-3 text-muted-foreground" />
                <input id="device-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="デバイスを検索…" className="h-11 w-full rounded-xl border bg-card pl-10 pr-3 text-sm" />
              </div>
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
            <div className="flex-1 min-h-0">
              <p className="mb-4 text-xs text-muted-foreground">{devices.length}台中 {filteredAndSortedDevices.length}台を表示</p>
              <div className="w-full px-0">
                <div 
                  className="grid gap-5 w-full grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                >
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
    </Layout>
  );
}
