import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Smartphone, AlertTriangle } from "lucide-react"
import type { Device } from "@/types"

interface DeviceStatsProps {
  devices: Device[]
}

export const DeviceStats: React.FC<DeviceStatsProps> = ({ devices }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">登録デバイス数</CardTitle>
        <Smartphone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{devices.length}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">低バッテリー警告</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-500">
          {devices.filter((device) => device.battery_level <= 20).length}
        </div>
      </CardContent>
    </Card>
  </div>
) 