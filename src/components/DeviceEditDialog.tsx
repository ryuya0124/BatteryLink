import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy } from "lucide-react";
import type { Device } from "@/types";

interface DeviceEditDialogProps {
  device: Device;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (update: Partial<Device>) => void;
}

export const DeviceEditDialog: React.FC<DeviceEditDialogProps> = ({ device, open, onOpenChange, onSave }) => {
  const [brand, setBrand] = useState(device.brand || "");
  const [model, setModel] = useState(device.model || "");
  const [name, setName] = useState(device.name || "");
  const [modelNumber, setModelNumber] = useState(device.model_number || "");
  // 表示/非表示設定（例: 温度・電圧・容量）
  const [showTemperature, setShowTemperature] = useState(true);
  const [showVoltage, setShowVoltage] = useState(true);
  const [showCapacity, setShowCapacity] = useState(true);
  const [copied, setCopied] = useState(false);
  const [osVersion] = useState(device.os_version || "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(device.uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleSave = () => {
    onSave({ name, brand, model, model_number: modelNumber });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full py-8 px-6 rounded-xl shadow-lg">
        <div className="text-center mb-4">
          <div className="text-lg font-bold">設定画面</div>
          <div className="text-2xl font-extrabold mt-1">{device.name || <span className="text-gray-400">(未登録)</span>}</div>
        </div>
        <DialogHeader>
          <DialogTitle>端末の設定</DialogTitle>
          <DialogDescription>端末名や型番の編集、UUIDの確認・コピー、値の表示設定ができます。</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">端末名</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ブランド</label>
            <Input value={brand} onChange={e => setBrand(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">モデル</label>
            <Input value={model} onChange={e => setModel(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">型番</label>
            <Input value={modelNumber} onChange={e => setModelNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">OSバージョン</label>
            <Input value={osVersion} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">UUID</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs break-all">{device.uuid}</span>
              <Button size="sm" variant="outline" onClick={handleCopy}><Copy className="w-4 h-4 mr-1" />コピー</Button>
              {copied && <span className="text-green-600 text-xs ml-2">コピーしました</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">値の表示/非表示</label>
            <div className="flex gap-4 items-center">
              <span className="text-xs">温度</span>
              <Switch checked={showTemperature} onCheckedChange={setShowTemperature} />
              <span className="text-xs">電圧</span>
              <Switch checked={showVoltage} onCheckedChange={setShowVoltage} />
              <span className="text-xs">容量</span>
              <Switch checked={showCapacity} onCheckedChange={setShowCapacity} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 