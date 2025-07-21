import React from "react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, Thermometer, RefreshCw, Trash2, MoreVertical, Copy } from "lucide-react"
import type { Device } from "@/types"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DeviceEditDialog } from "./DeviceEditDialog";

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
}) => {
  const [editOpen, setEditOpen] = React.useState(false);
  return (
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
                {device.os_version || <span className="text-gray-400">未登録</span>}
                {(device.os_version && device.model_number) ? " • " : ""}
                {device.model_number || (device.os_version ? <span className="text-gray-400">-</span> : <span className="text-gray-400">未登録</span>)}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            {/* 3点ボタンでDeviceEditDialogを開く */}
            <button className="p-1 rounded hover:bg-gray-100" onClick={() => setEditOpen(true)}>
              <MoreVertical className="w-5 h-5" />
            </button>
            {device.is_charging && (
              <Badge variant="outline" className="text-green-600 border-green-400">
                <Zap className="h-4 w-4 mr-1 inline" />充電中
              </Badge>
            )}
            {(device.temperature !== undefined && device.temperature !== null && device.temperature !== 0) ? (
              <Badge variant="outline" className="text-orange-600 border-orange-400">
                <Thermometer className="h-4 w-4 mr-1 inline" />{device.temperature}℃
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-400 border-gray-300">
                <Thermometer className="h-4 w-4 mr-1 inline" />未登録
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-2">
          {typeof device.battery_level === "number" ? (
            <>
              <Progress value={device.battery_level} className="flex-1 h-3" />
              <span className={`ml-2 font-bold text-lg ${getBatteryColor(device.battery_level)}`}>{device.battery_level}%</span>
            </>
          ) : (
            <>
              <div className="flex-1 h-3 bg-gray-200 rounded overflow-hidden relative">
                <div className="absolute left-0 top-0 h-full w-full bg-gray-400 opacity-40" />
              </div>
              <span className="ml-2 text-gray-400">未登録</span>
            </>
          )}
        </div>
        {typeof device.battery_capacity === "number" ? (
          <div className={`text-xs font-medium px-2 py-1 rounded ${getBatteryCapacityBg(device.battery_capacity)} ${getBatteryCapacityColor(device.battery_capacity)}`}>
            バッテリー容量: {device.battery_capacity}mAh
          </div>
        ) : (
          <div className="text-xs text-gray-400">バッテリー容量: 未登録</div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          電圧: {device.voltage ? `${device.voltage}V` : <span className="text-gray-400">未登録</span>}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onUpdate(device.uuid)} disabled={updating}>
            <RefreshCw className={`h-4 w-4 mr-1 ${updating ? "animate-spin" : ""}`} />
            更新
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(device.uuid)}>
            <Trash2 className="h-4 w-4 mr-1" />
            削除
          </Button>
        </div>
      </CardContent>
      <DeviceEditDialog
        device={device}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(update) => { alert("保存: " + JSON.stringify(update)); setEditOpen(false); }}
      />
    </Card>
  );
}; 