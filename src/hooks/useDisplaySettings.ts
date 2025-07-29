import { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchWithAuth } from "@/lib/utils";

interface DisplaySettings {
  show_temperature: boolean;
  show_voltage: boolean;
}

export function useDisplaySettings() {
  const [settings, setSettings] = useState<DisplaySettings>({
    show_temperature: true,
    show_voltage: true,
  });
  const [loading, setLoading] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/me", {}, getAccessTokenSilently);
      if (res && res.ok) {
        const data = await res.json();
        setSettings({
          show_temperature: data.show_temperature !== false,
          show_voltage: data.show_voltage !== false,
        });
      }
    } catch (e) {
      console.error("表示設定の取得に失敗しました:", e);
    }
    setLoading(false);
  }, [getAccessTokenSilently]);

  const updateSettings = useCallback(async (newSettings: Partial<DisplaySettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const res = await fetchWithAuth(
        "/api/auth/display-settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSettings),
        },
        getAccessTokenSilently
      );
      if (res && res.ok) {
        setSettings(updatedSettings);
        return true;
      }
      return false;
    } catch (e) {
      console.error("表示設定の更新に失敗しました:", e);
      return false;
    }
  }, [settings, getAccessTokenSilently]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    fetchSettings,
  };
} 