import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";
import type { Device } from "@/types";
import { useDeviceDisplaySettings } from "@/hooks/useDeviceDisplaySettings";

interface DeviceEditDialogProps {
  device: Device
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (update: Partial<Device>) => void | Promise<void>
}

export const DeviceEditDialog: React.FC<DeviceEditDialogProps> = ({ device, open, onOpenChange, onSave }) => {
  const [brand, setBrand] = useState(device.brand || "")
  const [model, setModel] = useState(device.model || "")
  const [name, setName] = useState(device.name || "")
  const [modelNumber, setModelNumber] = useState(device.model_number || "")
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const { settings, updateSettings, fetchSettings } = useDeviceDisplaySettings(device.uuid)

  // 表示設定の状態
  const [showTemperature, setShowTemperature] = useState(settings.show_temperature)
  const [showVoltage, setShowVoltage] = useState(settings.show_voltage)

  // 設定が変更されたときに状態を更新
  useEffect(() => {
    setShowTemperature(settings.show_temperature)
    setShowVoltage(settings.show_voltage)
  }, [settings])

  // ダイアログが開いたときに設定を再取得
  useEffect(() => {
    if (open) {
      setName(device.name || "")
      setBrand(device.brand || "")
      setModel(device.model || "")
      setModelNumber(device.model_number || "")
      setError("")
      fetchSettings()
    }
  }, [open, fetchSettings, device.name, device.brand, device.model, device.model_number])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(device.uuid)
      setCopied(true)
    } catch { setError("コピーできませんでした。UUIDを選択してコピーしてください。") }
  }

  const handleSave = async () => {
    if (saving || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
    await onSave({
      name: name.trim(),
      brand: brand,
      model: model,
      model_number: modelNumber,
    });
    
    // 表示設定を保存
    const saved = await updateSettings({
      show_temperature: showTemperature,
      show_voltage: showVoltage,
    })
    
    if (!saved) throw new Error("デバイス情報は保存されましたが、表示設定を保存できませんでした。もう一度お試しください。");
    onOpenChange(false)
    } catch (e) { setError(e instanceof Error ? e.message : "保存できませんでした。"); }
    finally { setSaving(false); }
  }

  const handleTemperatureChange = (checked: boolean) => {
    setShowTemperature(checked)
  }

  const handleVoltageChange = (checked: boolean) => {
    setShowVoltage(checked)
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!saving) onOpenChange(value); }}>
      <DialogContent className="max-w-lg rounded-2xl bg-card text-card-foreground max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-foreground">デバイスを編集</DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            端末名や型番の編集、UUIDの確認・コピー、値の表示設定ができます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* 端末名 */}
          <div className="space-y-2">
            <label htmlFor={`edit-name-${device.uuid}`} className="block text-sm font-medium text-foreground">デバイス名</label>
            <Input
              id={`edit-name-${device.uuid}`} maxLength={256} required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="端末名を入力してください"
            />
          </div>

          {/* ブランド */}
          <div className="space-y-2">
            <label htmlFor={`edit-brand-${device.uuid}`} className="block text-sm font-medium text-foreground">ブランド</label>
            <Input
              id={`edit-brand-${device.uuid}`} maxLength={256}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="ブランド名を入力してください"
            />
          </div>

          {/* モデル */}
          <div className="space-y-2">
            <label htmlFor={`edit-model-${device.uuid}`} className="block text-sm font-medium text-foreground">モデル</label>
            <Input
              id={`edit-model-${device.uuid}`} maxLength={256}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="モデル名を入力してください"
            />
          </div>

          {/* 型番 */}
          <div className="space-y-2">
            <label htmlFor={`edit-number-${device.uuid}`} className="block text-sm font-medium text-foreground">型番</label>
            <Input
              id={`edit-number-${device.uuid}`} maxLength={256}
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              className="bg-background border-input text-foreground"
              placeholder="型番を入力してください"
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
                <Switch aria-label="温度を表示" checked={showTemperature} onCheckedChange={handleTemperatureChange} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-md">
                <span className="text-sm font-medium text-foreground">電圧</span>
                <Switch aria-label="電圧を表示" checked={showVoltage} onCheckedChange={handleVoltageChange} />
              </div>
            </div>
          </div>

          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {/* ボタン */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="px-6 bg-background hover:bg-accent hover:text-accent-foreground border-input"
            >
              キャンセル
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saving ? "保存中…" : "変更を保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
