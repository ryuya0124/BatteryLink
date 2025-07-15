import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { RefreshCw } from "lucide-react"

interface AutoUpdateControlProps {
  autoUpdateEnabled: boolean
  setAutoUpdateEnabled: (v: boolean) => void
  onManualUpdate: () => void
  devicesCount: number
}

export const AutoUpdateControl: React.FC<AutoUpdateControlProps> = ({
  autoUpdateEnabled,
  setAutoUpdateEnabled,
  onManualUpdate,
  devicesCount,
}) => (
  <Card className="mb-6">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${autoUpdateEnabled ? "text-green-600" : "text-gray-400"}`} />
            <Label htmlFor="auto-update" className="text-sm font-medium">
              自動更新
            </Label>
          </div>
          <p className="text-xs text-gray-500">30秒ごとにAPIからバッテリー情報を自動取得します</p>
        </div>
        <div className="flex items-center gap-4">
          <Switch id="auto-update" checked={autoUpdateEnabled} onCheckedChange={setAutoUpdateEnabled} />
          <Button variant="outline" size="sm" onClick={onManualUpdate} disabled={devicesCount === 0}>
            <RefreshCw className="h-4 w-4 mr-2" />
            手動更新
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
) 