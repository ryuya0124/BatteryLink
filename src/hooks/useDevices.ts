import { useState, useCallback } from "react"
import type { AppUser, Device } from "@/types"
import { fetchWithAuth } from "@/lib/utils"
import { useAuth0 } from "@auth0/auth0-react"

export function useDevices(user: AppUser | null) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingDevices, setUpdatingDevices] = useState<Set<string>>(new Set())
  const { getAccessTokenSilently } = useAuth0();

  // API経由でデバイス一覧取得
  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth("/api/devices", { cache: "no-store" }, getAccessTokenSilently)
      if (res && res.ok) {
        const data = await res.json()
        setDevices(data.map((d: any) => ({
          ...d,
          is_charging: Boolean(d.is_charging)
        })))
      } else {
        setDevices([])
      }
    } catch (e) {
      setDevices([])
    }
    setLoading(false)
  }, [getAccessTokenSilently])

  // デバイス追加
  const addDevice = useCallback(async (device: Omit<Device, "id">) => {
    const res = await fetchWithAuth("/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(device),
    }, getAccessTokenSilently)
    if (res && res.ok) {
      await fetchDevices()
    }
  }, [fetchDevices, getAccessTokenSilently])

  // デバイス更新
  const updateDevice = useCallback(async (uuid: string, updateData: Partial<Device>) => {
    setUpdatingDevices((prev) => new Set(prev).add(uuid));
    // 実際の更新処理（APIリクエストが必要ならここで）
    // await fetchWithAuth(...)
    await fetchDevices();
    setUpdatingDevices((prev) => {
      const newSet = new Set(prev);
      newSet.delete(uuid);
      return newSet;
    });
  }, [fetchDevices]);

  // デバイス削除
  const deleteDevice = useCallback(async (uuid: string) => {
    await fetchWithAuth(`/api/devices/${encodeURIComponent(uuid)}`, {
      method: "DELETE",
    }, getAccessTokenSilently)
    await fetchDevices()
  }, [fetchDevices, getAccessTokenSilently])

  return { devices, loading, updatingDevices, setUpdatingDevices, addDevice, updateDevice, deleteDevice, fetchDevices }
}