import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  deviceName: string;
  setDeviceName: (value: string) => void;
  deviceBrand: string;
  setDeviceBrand: (value: string) => void;
  deviceModel: string;
  setDeviceModel: (value: string) => void;
  deviceModelNumber: string;
  setDeviceModelNumber: (value: string) => void;
  phoneModels: Record<string, { model: string }[]>;
  selectedModelInfo: unknown;
  onSubmit: (event: FormEvent) => void | Promise<void>;
}

export function AddDeviceDialog(props: AddDeviceDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !props.deviceName.trim()) return;
    setSubmitting(true);
    try { await props.onSubmit(event); }
    finally { setSubmitting(false); }
  }
  return <Dialog open={props.open} onOpenChange={open => { if (!submitting) props.onOpenChange(open); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl">
      <DialogHeader>
        <DialogTitle>デバイスを追加</DialogTitle>
        <DialogDescription>管理したい端末に名前を付けましょう。ブランドやモデルはあとから変更できます。</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="deviceName">デバイス名 *</Label>
          <Input id="deviceName" value={props.deviceName} onChange={e => props.setDeviceName(e.target.value)} placeholder="例: 仕事用のノートPC" maxLength={256} required autoFocus /></div>
        <div className="space-y-2"><Label htmlFor="deviceBrand">ブランド（任意）</Label>
          <Input id="deviceBrand" list="brand-options" value={props.deviceBrand} onChange={e => props.setDeviceBrand(e.target.value)} maxLength={256} placeholder="選択または入力" />
          <datalist id="brand-options">{Object.keys(props.phoneModels).map(brand => <option key={brand} value={brand} />)}</datalist></div>
        <div className="space-y-2"><Label htmlFor="deviceModel">モデル（任意）</Label>
          <Input id="deviceModel" list="model-options" value={props.deviceModel} onChange={e => props.setDeviceModel(e.target.value)} maxLength={256} placeholder="新しいモデルも入力できます" />
          <datalist id="model-options">{(props.phoneModels[props.deviceBrand] || []).map(model => <option key={model.model} value={model.model} />)}</datalist></div>
        <div className="space-y-2"><Label htmlFor="deviceModelNumber">型番（任意）</Label>
          <Input id="deviceModelNumber" value={props.deviceModelNumber} onChange={e => props.setDeviceModelNumber(e.target.value)} maxLength={256} /></div>
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">登録後、APIキーとデバイスのUUIDを使って計測値を送信できます。最初の送信までは「未計測」と表示されます。</p>
        <Button type="submit" className="w-full" disabled={submitting || !props.deviceName.trim()}>{submitting ? "登録中…" : "デバイスを追加"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
