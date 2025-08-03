"use client"

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeviceEditDialog } from "./DeviceEditDialog";
import { Smartphone, Battery, Zap, Pencil, Trash2, RefreshCw, Thermometer, Gauge } from "lucide-react";
import { Device } from "../types";
import { useDeviceDisplaySettings } from "@/hooks/useDeviceDisplaySettings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeviceCardProps {
  device: Device;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Device>) => void;
  updating: boolean;
  getBatteryColor: (level: number) => string;
  getBatteryCapacityColor: (capacity: number) => string;
  getBatteryCapacityBg: (capacity: number) => string;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onUpdate,
  onDelete,
  onEdit,
  updating,
  getBatteryColor,
  getBatteryCapacityColor,
  getBatteryCapacityBg,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const { settings, loading, fetchSettings } = useDeviceDisplaySettings(device.uuid);
  const isMountedRef = useRef(true);

  const getProgressBarClass = (level: number, isCharging: boolean) => {
    if (isCharging) return "bg-green-500";
    if (level <= 15) return "bg-red-500";
    if (level <= 30) return "bg-orange-500";
    return "bg-blue-500";
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setShowSkeleton(true);
    fetchSettings();
    setTimeout(() => setShowSkeleton(false), 300);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (editOpen) {
      fetchSettings();
    }
  }, [editOpen, fetchSettings]);

  return (
    <Card className="w-full max-w-md sm:max-w-lg mx-auto hover:shadow-lg transition-all duration-200 border-0 shadow-md flex flex-col min-w-64">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2 sm:gap-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* デバイスアイコン */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-900 shrink-0">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>

            {/* デバイス情報 */}
            <div className="flex-1 min-w-0">
              <CardTitle 
                className="text-base sm:text-lg font-semibold text-foreground cursor-help truncate"
                title={device.name || "未登録デバイス"}
              >
                {device.name || <span className="text-muted-foreground italic">未登録デバイス</span>}
              </CardTitle>
              <div className="mt-1 space-y-1">
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {device.brand || device.model ? (
                    `${device.brand || "不明"} ${device.model || ""}`.trim()
                  ) : (
                    "詳細情報なし"
                  )}
                </div>
                {device.model_number && (
                  <div className="text-xs text-muted-foreground truncate">
                    {device.model_number}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 編集ボタン */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 py-0 flex items-center gap-1 whitespace-nowrap shrink-0 min-w-fit"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden xs:inline">編集</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* バッテリーレベル */}
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">バッテリー</span>
            </div>
            {typeof device.battery_level === "number" ? (
              <span className={`font-bold text-base sm:text-lg ${getBatteryColor(device.battery_level)}`}>{device.battery_level}%</span>
            ) : (
              <span className="text-muted-foreground text-xs sm:text-sm">未登録</span>
            )}
          </div>

          {typeof device.battery_level === "number" ? (
            <div className="relative h-3 sm:h-4 bg-muted rounded-full overflow-hidden">
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
            <div className="h-3 sm:h-4 bg-muted rounded-full">
              <div className="h-full bg-muted-foreground rounded-full opacity-50" />
            </div>
          )}
        </div>

        {/* ステータスバッジ */}
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0 min-h-[28px]">
          {device.is_charging === true && (
            <Badge variant="secondary" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-200 dark:border-green-900 hover:bg-green-100 dark:hover:bg-green-800">
              <Zap className="w-3 h-3 mr-1" />
              充電中
            </Badge>
          )}

          {/* バッテリー残量警告バッジ */}
          {typeof device.battery_level === "number" && device.battery_level <= 15 && device.is_charging !== true && (
            <Badge variant="secondary" className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-800">
              <Battery className="w-3 h-3 mr-1" />
              残量少
            </Badge>
          )}

          {/* 温度バッジ - 常にDOMに存在し、設定に基づいて透明にする */}
          {!loading && (
            <Badge
              variant="secondary"
              className={`transition-opacity duration-200 ${
                settings.show_temperature 
                  ? "opacity-100" 
                  : "opacity-0 pointer-events-none"
              } ${
                device.temperature !== undefined && device.temperature !== null && device.temperature !== 0
                  ? "bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-200 border-orange-200 dark:border-orange-900 hover:bg-orange-100 dark:hover:bg-orange-800"
                  : "bg-muted text-muted-foreground border-muted-foreground/20"
              }`}
            >
              <Thermometer className="w-3 h-3 mr-1" />
              {device.temperature !== undefined && device.temperature !== null && device.temperature !== 0
                ? `${device.temperature}℃`
                : "温度未登録"}
            </Badge>
          )}
        </div>

        {/* 詳細情報 */}
        <div className="space-y-1 mb-4 flex-1">
          {/* 電圧 - 常にDOMに存在し、設定に基づいて透明にする */}
          {!loading && (
            <div className={`flex justify-between text-xs transition-opacity duration-200 ${
              settings.show_voltage 
                ? "opacity-100" 
                : "opacity-0 pointer-events-none"
            }`}>
              <span className="text-muted-foreground">電圧</span>
              <span className={device.voltage ? "text-foreground" : "text-muted-foreground"}>
                {device.voltage ? `${device.voltage}V` : "未登録"}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">最終更新</span>
            <span className="text-foreground">
              {device.last_updated ? new Date(device.last_updated).toLocaleString("ja-JP") : "未更新"}
            </span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 mt-auto min-w-0">
          <Button
            variant="outline"
            onClick={() => onUpdate(device.uuid)}
            disabled={updating}
            className="flex-1 min-w-0 h-9 sm:h-8 text-xs sm:text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${updating ? "animate-spin" : ""}`} />
            <span className="truncate">{updating ? "更新中..." : "更新"}</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmDeleteOpen(true)}
            className="flex-1 min-w-0 h-9 sm:h-8 text-xs sm:text-sm"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="truncate">削除</span>
          </Button>
        </div>

        {/* 編集ダイアログ */}
        <DeviceEditDialog
          device={device}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={(update) => {
            onEdit(device.uuid, update)
            setEditOpen(false)
          }}
        />

        {/* 削除確認ダイアログ */}
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>デバイスを削除</DialogTitle>
              <DialogDescription>
                「{device.name || "未登録デバイス"}」を削除しますか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(device.uuid)
                  setConfirmDeleteOpen(false)
                }}
              >
                削除
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
