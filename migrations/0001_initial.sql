CREATE TABLE IF NOT EXISTS devices (
  uuid TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  os_version TEXT,
  model_number TEXT,
  battery_level REAL,
  last_updated TEXT NOT NULL,
  is_charging INTEGER NOT NULL DEFAULT 0 CHECK (is_charging IN (0, 1)),
  temperature REAL,
  voltage TEXT
);

CREATE INDEX IF NOT EXISTS idx_devices_user_updated
  ON devices(user_id, last_updated DESC);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_created
  ON api_keys(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  auto_update INTEGER NOT NULL DEFAULT 0 CHECK (auto_update IN (0, 1))
);

CREATE TABLE IF NOT EXISTS device_display_settings (
  user_id TEXT NOT NULL,
  device_uuid TEXT NOT NULL,
  show_temperature INTEGER NOT NULL DEFAULT 1 CHECK (show_temperature IN (0, 1)),
  show_voltage INTEGER NOT NULL DEFAULT 1 CHECK (show_voltage IN (0, 1)),
  PRIMARY KEY (user_id, device_uuid),
  FOREIGN KEY (device_uuid) REFERENCES devices(uuid) ON DELETE CASCADE
);
