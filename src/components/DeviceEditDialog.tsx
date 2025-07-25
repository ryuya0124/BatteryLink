import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Copy, Check } from "lucide-react"
import type { Device } from "@/types"

interface DeviceEditDialogProps {
  device: Device
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (update: Partial<Device>) => void
}

export const DeviceEditDialog: React.FC<DeviceEditDialogProps> = ({ device, open, onOpenChange, onSave }) => {
  const [brand, setBrand] = useState(device.brand || "")
  const [model, setModel] = useState(device.model || "")
  const [name, setName] = useState(device.name || "")
  const [modelNumber, setModelNumber] = useState(device.model_number || "")

  // 表示/非表示設定（例: 温度・電圧・容量）
  const [showTemperature, setShowTemperature] = useState(true)
  const [showVoltage, setShowVoltage] = useState(true)
  const [showCapacity, setShowCapacity] = useState(true)
  const [copied, setCopied] = useState(false)

  const [osVersion] = useState(device.os_version || "")

  const handleCopy = async () => {
    await navigator.clipboard.writeText(device.uuid)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const handleSave = () => {
    onSave({ name, brand, model, model_number: modelNumber })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full py-8 px-6 rounded-xl bg-card text-card-foreground border-0 shadow-md transition-colors max-h-[80vh] overflow-y-auto">
        {/* ヘッダー部分 */}
        <div className="text-center mb-6">
          <div className="text-lg font-bold text-foreground mb-2">設定画面</div>
          <div className="text-2xl font-extrabold text-foreground">
            {device.name || <span className="text-muted-foreground italic">(未登録)</span>}
          </div>
        </div>

        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-foreground">端末の設定</DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            端末名や型番の編集、UUIDの確認・コピー、値の表示設定ができます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* 端末名 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">端末名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="端末名を入力してください"
            />
          </div>

          {/* ブランド */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">ブランド</label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="ブランド名を入力してください"
            />
          </div>

          {/* モデル */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">モデル</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="モデル名を入力してください"
            />
          </div>

          {/* 型番 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">型番</label>
            <Input
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="型番を入力してください"
            />
          </div>

          {/* OSバージョン */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">OSバージョン</label>
            <Input
              value={osVersion}
              disabled
              className="bg-muted/50 border-input text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* UUID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">UUID</label>
            <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-md">
              <code className="font-mono text-xs text-foreground break-all flex-1 select-all">{device.uuid}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0 h-8 px-3 bg-background hover:bg-accent hover:text-accent-foreground border-input"
              >
                {copied ? <Check className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "完了" : "コピー"}
              </Button>
            </div>
            {copied && (
              <div className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                クリップボードにコピーしました
              </div>
            )}
          </div>

          {/* 値の表示/非表示設定 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">値の表示/非表示</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-md">
                <span className="text-sm font-medium text-foreground">温度</span>
                <Switch checked={showTemperature} onCheckedChange={setShowTemperature} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-md">
                <span className="text-sm font-medium text-foreground">電圧</span>
                <Switch checked={showVoltage} onCheckedChange={setShowVoltage} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-md">
                <span className="text-sm font-medium text-foreground">容量</span>
                <Switch checked={showCapacity} onCheckedChange={setShowCapacity} />
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6 bg-background hover:bg-accent hover:text-accent-foreground border-input"
            >
              キャンセル
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}