-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  battery_level INTEGER NOT NULL CHECK (battery_level >= 0 AND battery_level <= 100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create battery_history table for tracking battery level changes
CREATE TABLE IF NOT EXISTS battery_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  battery_level INTEGER NOT NULL CHECK (battery_level >= 0 AND battery_level <= 100),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_history ENABLE ROW LEVEL SECURITY;

-- Create policies for devices table
CREATE POLICY "Users can view their own devices" ON devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices" ON devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" ON devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" ON devices
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for battery_history table
CREATE POLICY "Users can view their own battery history" ON battery_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM devices 
      WHERE devices.id = battery_history.device_id 
      AND devices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own battery history" ON battery_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM devices 
      WHERE devices.id = battery_history.device_id 
      AND devices.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_updated ON devices(last_updated);
CREATE INDEX IF NOT EXISTS idx_battery_history_device_id ON battery_history(device_id);
CREATE INDEX IF NOT EXISTS idx_battery_history_recorded_at ON battery_history(recorded_at);
