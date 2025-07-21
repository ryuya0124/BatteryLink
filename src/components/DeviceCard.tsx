import React from "react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, Thermometer, RefreshCw, Trash2 } from "lucide-react"
import type { Device } from "@/types"

interface DeviceCardProps {
  device: Device
  onUpdate: (id: string) => void
  onDelete: (id: string) => void
  updating: boolean
  getBatteryColor: (level: number) => string
  getBatteryCapacityColor: (capacity: number) => string
  getBatteryCapacityBg: (capacity: number) => string
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onUpdate,
  onDelete,
  updating,
  getBatteryColor,
  getBatteryCapacityColor,
  getBatteryCapacityBg,
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">
            {device.name || <span className="text-gray-400">(未登録)</span>}
          </CardTitle>
          <div className="mt-1">
            <div className="text-sm text-gray-500">
              {(device.brand || device.model) ? `${device.brand || "-"} ${device.model || "-"}` : <span className="text-gray-400">(未登録)</span>}
            </div>
            <div className="text-xs text-gray-400">
              {device.os_version || "-"}
              {(device.os_version && device.model_number) ? " • " : ""}
              {device.model_number || (device.os_version ? "-" : "")}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {device.is_charging && (
            <Badge variant="outline" className="text-green-600 border-green-400">
              <Zap className="h-4 w-4 mr-1 inline" />充電中
            </Badge>
          )}
          {device.temperature !== undefined && (
            <Badge variant="outline" className="text-orange-600 border-orange-400">
              <Thermometer className="h-4 w-4 mr-1 inline" />{device.temperature}℃
            </Badge>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-4 mb-2">
        <Progress value={typeof device.battery_level === "number" ? device.battery_level : 0} className="flex-1 h-3" />
        <span className={`ml-2 font-bold text-lg ${getBatteryColor(typeof device.battery_level === "number" ? device.battery_level : 0)}`}>
          {typeof device.battery_level === "number" ? `${device.battery_level}%` : <span className="text-gray-400">未登録</span>}
        </span>
      </div>
      {typeof device.battery_capacity === "number" ? (
        <div className={`text-xs font-medium px-2 py-1 rounded ${getBatteryCapacityBg(device.battery_capacity)} ${getBatteryCapacityColor(device.battery_capacity)}`}>
          バッテリー容量: {device.battery_capacity}mAh
        </div>
      ) : (
        <div className="text-xs text-gray-400">バッテリー容量: 未登録</div>
      )}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => onUpdate(device.id)} disabled={updating}>
          <RefreshCw className={`h-4 w-4 mr-1 ${updating ? "animate-spin" : ""}`} />
          更新
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(device.id)}>
          <Trash2 className="h-4 w-4 mr-1" />
          削除
        </Button>
      </div>
    </CardContent>
  </Card>
) 