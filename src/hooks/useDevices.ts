import { useState, useCallback } from "react"
import type { AppUser, Device } from "@/types"

// supabaseのmock
const createClient = () => ({
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
        // idを付与
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

export function useDevices(user: AppUser | null) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingDevices, setUpdatingDevices] = useState<Set<string>>(new Set())

  const fetchDevices = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from("devices").select("*").eq("user_id", user.id).order("last_updated", { ascending: false })
    setDevices(data || [])
    setLoading(false)
  }, [user])

  // 修正: Omit<Device, 'id'>型で受け取り、内部でidを付与
  const addDevice = useCallback(async (device: Omit<Device, "id">) => {
    if (!user) return
    const newDevice = { ...device, id: Date.now().toString() }
    const { data } = await supabase.from("devices").insert([newDevice]).select()
    if (data) setDevices((prev) => [...prev, data[0]])
  }, [user])

  const updateDevice = useCallback(async (id: string, updateData: Partial<Device>) => {
    setUpdatingDevices((prev) => new Set(prev).add(id))
    const { data } = await supabase.from("devices").update(updateData).eq("id", id).select()
    if (data) setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...data[0] } : d)))
    setUpdatingDevices((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  const deleteDevice = useCallback(async (id: string) => {
    await supabase.from("devices").delete().eq("id", id)
    setDevices((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { devices, loading, updatingDevices, addDevice, updateDevice, deleteDevice, fetchDevices }
} 