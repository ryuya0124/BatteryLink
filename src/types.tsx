export interface AppUser {
  id: string
  email: string
}

export interface Device {
  uuid: string
  name: string
  brand: string
  model: string
  os_version: string
  model_number: string
  battery_level: number
  battery_capacity?: number
  last_updated: string
  user_id: string
  is_charging?: boolean
  temperature?: number
  voltage?: string
}
