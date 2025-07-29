import { useState, useEffect, useCallback } from "react";

interface FilterSettings {
  showCharging: boolean;
  showLowBattery: boolean;
  showTemperature: boolean;
  showVoltage: boolean;
  sortBy: 'name' | 'battery_level' | 'last_updated';
  sortOrder: 'asc' | 'desc';
  filterBrand: string;
  filterBattery: string;
}

const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  showCharging: true,
  showLowBattery: true,
  showTemperature: true,
  showVoltage: true,
  sortBy: 'name',
  sortOrder: 'asc',
  filterBrand: 'all',
  filterBattery: 'all'
};

const STORAGE_KEY = 'batterylink_filter_settings';

export function useFilterSettings() {
  const [settings, setSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);
  const [loading, setLoading] = useState(true);

  // ローカルストレージから設定を読み込み
  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 新しいフィールドが追加された場合の後方互換性を保つ
        const merged = { ...DEFAULT_FILTER_SETTINGS, ...parsed };
        setSettings(merged);
      }
    } catch (error) {
      console.error('フィルタ設定の読み込みに失敗しました:', error);
    }
    setLoading(false);
  }, []);

  // ローカルストレージに設定を保存
  const saveSettings = useCallback((newSettings: FilterSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('フィルタ設定を保存しました:', newSettings);
    } catch (error) {
      console.error('フィルタ設定の保存に失敗しました:', error);
    }
  }, []);

  // 設定を更新
  const updateSettings = useCallback((updates: Partial<FilterSettings>) => {
    const newSettings = { ...settings, ...updates };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 設定をリセット
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_FILTER_SETTINGS);
  }, [saveSettings]);

  // 初回読み込み
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    updateSettings,
    resetSettings,
  };
}