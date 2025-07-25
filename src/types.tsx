export interface AppUser {
  id: string
  email: string
}

export interface Device {
  uuid: string
  name: string
  brand: string
  model: string
  os_version?: string
  model_number: string
  battery_level: number
  last_updated: string
  is_charging?: boolean
  temperature?: number
  voltage?: string
}

export type ThemeMode = "light" | "dark" | "system";
