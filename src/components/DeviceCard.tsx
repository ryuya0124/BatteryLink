"use client"

import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Thermometer, RefreshCw, Trash2, Pencil, Battery, Smartphone } from "lucide-react"
import type { Device } from "@/types"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DeviceEditDialog } from "@/components/DeviceEditDialog"

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
  const [editOpen, setEditOpen] = React.useState(false)

  // バッテリーレベルに応じたプログレスバーのクラスを取得
  const getProgressBarClass = (level: number, isCharging: boolean) => {
    if (isCharging) {
      return "charging-progress"
    } else if (level <= 15) {
      return "critical-battery"
    } else if (level <= 30) {
      return "low-battery"
    } else if (level <= 60) {
      return "medium-battery"
    } else {
      return "high-battery"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* デバイスアイコン */}
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>

            {/* デバイス情報 */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {device.name || <span className="text-gray-400 italic">未登録デバイス</span>}
              </CardTitle>
              <div className="mt-1 space-y-1">
                <div className="text-sm text-gray-600 truncate">
                  {device.brand || device.model ? (
                    `${device.brand || "不明"} ${device.model || ""}`.trim()
                  ) : (
                    <span className="text-gray-400 italic">ブランド・モデル未登録</span>
                  )}
                </div>
                {(device.os_version || device.model_number) && (
                  <div className="text-xs text-gray-500 truncate">
                    {[device.os_version, device.model_number].filter(Boolean).join(" • ") || "詳細情報なし"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* メニューボタン → 編集ボタンに変更 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 py-0 flex items-center gap-1 hover:bg-gray-100"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="w-4 h-4" />
            編集
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* バッテリーレベル */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">バッテリー</span>
            </div>
            {typeof device.battery_level === "number" ? (
              <span className={`font-bold text-lg ${getBatteryColor(device.battery_level)}`}>
                {device.battery_level}%
              </span>
            ) : (
              <span className="text-gray-400 text-sm">未登録</span>
            )}
          </div>

          {typeof device.battery_level === "number" ? (
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressBarClass(device.battery_level, device.is_charging === true)}`}
                style={{ width: `${device.battery_level}%` }}
              >
                {device.is_charging === true && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.ceil(device.battery_level / 20) }).map((_, i) => (
                        <Zap key={i} className="w-2 h-2 text-white drop-shadow-sm" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-4 bg-gray-100 rounded-full">
              <div className="h-full bg-gray-300 rounded-full opacity-50" />
            </div>
          )}
        </div>

        {/* ステータスバッジ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {device.is_charging === true && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
              <Zap className="w-3 h-3 mr-1" />
              充電中
            </Badge>
          )}

          {/* バッテリー残量警告バッジ */}
          {typeof device.battery_level === "number" && device.battery_level <= 15 && device.is_charging !== true && (
            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
              <Battery className="w-3 h-3 mr-1" />
              残量少
            </Badge>
          )}

          <Badge
            variant="secondary"
            className={
              device.temperature !== undefined && device.temperature !== null && device.temperature !== 0
                ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }
          >
            <Thermometer className="w-3 h-3 mr-1" />
            {device.temperature !== undefined && device.temperature !== null && device.temperature !== 0
              ? `${device.temperature}℃`
              : "温度未登録"}
          </Badge>
        </div>

        {/* 詳細情報 */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">電圧</span>
            <span className={device.voltage ? "text-gray-700" : "text-gray-400"}>
              {device.voltage ? `${device.voltage}V` : "未登録"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">最終更新</span>
            <span className="text-gray-700">
              {device.last_updated ? new Date(device.last_updated).toLocaleString("ja-JP") : "未更新"}
            </span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate(device.uuid)}
            disabled={updating}
            className="flex-1 hover:bg-blue-50 hover:border-blue-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${updating ? "animate-spin" : ""}`} />
            {updating ? "更新中..." : "更新"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(device.uuid)}
            className="hover:bg-red-600 hover:border-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            削除
          </Button>
        </div>
      </CardContent>

      <DeviceEditDialog
        device={device}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(update) => {
          alert("保存: " + JSON.stringify(update))
          setEditOpen(false)
        }}
      />

      <style>{`
        /* 充電中 - 緑色のアニメーション */
        .charging-progress {
          background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
          background-size: 200% 100%;
          animation: charging-flow 2s ease-in-out infinite;
          position: relative;
        }

        /* 危険レベル (0-15%) - 赤色のパルス */
        .critical-battery {
          background: #ef4444;
          animation: critical-pulse 1.5s ease-in-out infinite;
        }

        /* 低レベル (16-30%) - オレンジ色 */
        .low-battery {
          background: #f97316;
        }

        /* 中レベル (31-60%) - 黄色 */
        .medium-battery {
          background: #eab308;
        }

        /* 高レベル (61-100%) - 青色 */
        .high-battery {
          background: #3b82f6;
        }

        @keyframes charging-flow {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes critical-pulse {
          0%, 100% { 
            opacity: 1; 
          }
          50% { 
            opacity: 0.7; 
          }
        }
      `}</style>
    </Card>
  )
}
