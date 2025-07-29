import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchWithAuth } from "@/lib/utils";

interface DeviceDisplaySettings {
  show_temperature: boolean;
  show_voltage: boolean;
}

// グローバルキャッシュ
const settingsCache = new Map<string, { settings: DeviceDisplaySettings; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

export function useDeviceDisplaySettings(deviceUuid: string) {
  const [settings, setSettings] = useState<DeviceDisplaySettings>({
    show_temperature: true,
    show_voltage: true,
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { getAccessTokenSilently } = useAuth0();
  const isMountedRef = useRef(true);

  // キャッシュから設定を取得
  const getCachedSettings = useCallback((uuid: string): DeviceDisplaySettings | null => {
    const cached = settingsCache.get(uuid);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Using cached settings for device:", uuid);
      return cached.settings;
    }
    return null;
  }, []);

  // キャッシュに設定を保存
  const setCachedSettings = useCallback((uuid: string, newSettings: DeviceDisplaySettings) => {
    settingsCache.set(uuid, {
      settings: newSettings,
      timestamp: Date.now()
    });
    console.log("Cached settings for device:", uuid, newSettings);
  }, []);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!deviceUuid) return;
    
    // キャッシュから取得を試行（強制更新でない場合）
    if (!forceRefresh) {
      const cachedSettings = getCachedSettings(deviceUuid);
      if (cachedSettings) {
        setSettings(cachedSettings);
        setInitialized(true);
        return;
      }
    }
    
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/auth/device-display-settings?device_uuid=${encodeURIComponent(deviceUuid)}`, 
        {}, 
        getAccessTokenSilently
      );
      if (res && res.ok) {
        const data = await res.json();
        console.log("Fetched settings from server:", data);
        const newSettings = {
          show_temperature: Boolean(data.show_temperature),
          show_voltage: Boolean(data.show_voltage),
        };
        
        if (isMountedRef.current) {
          setSettings(newSettings);
          setCachedSettings(deviceUuid, newSettings);
        }
      }
    } catch (e) {
      console.error("デバイス表示設定の取得に失敗しました:", e);
    }
    if (isMountedRef.current) {
      setLoading(false);
      setInitialized(true);
    }
  }, [deviceUuid, getAccessTokenSilently, getCachedSettings, setCachedSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<DeviceDisplaySettings>) => {
    if (!deviceUuid) return false;
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      console.log("Updating settings:", updatedSettings);
      
      const res = await fetchWithAuth(
        "/api/auth/device-display-settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_uuid: deviceUuid,
            ...updatedSettings,
          }),
        },
        getAccessTokenSilently
      );
      if (res && res.ok) {
        if (isMountedRef.current) {
          setSettings(updatedSettings);
          setCachedSettings(deviceUuid, updatedSettings);
        }
        console.log("Settings updated successfully:", updatedSettings);
        return true;
      }
      return false;
    } catch (e) {
      console.error("デバイス表示設定の更新に失敗しました:", e);
      return false;
    }
  }, [deviceUuid, settings, getAccessTokenSilently, setCachedSettings]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSettings();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSettings]);

  return {
    settings,
    loading: loading && initialized, // 初期化済みの場合のみloadingを表示
    updateSettings,
    fetchSettings,
  };
} 