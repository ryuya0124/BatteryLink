import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DeviceEditDialog } from "./DeviceEditDialog";
import { Smartphone, Zap, Pencil, Trash2, RefreshCw, Copy } from "lucide-react";
import type { Device } from "../types";
import { useDeviceDisplaySettings } from "@/hooks/useDeviceDisplaySettings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeviceCardProps {
  device: Device;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Device>) => void | Promise<void>;
  updating: boolean;
  getBatteryColor: (level: number) => string;
  getBatteryCapacityColor: (capacity: number) => string;
  getBatteryCapacityBg: (capacity: number) => string;
}

export function DeviceCard({device, onUpdate, onDelete, onEdit, updating}: DeviceCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const {settings, loading, fetchSettings} = useDeviceDisplaySettings(device.uuid);
  useEffect(() => { void fetchSettings(); }, [editOpen, fetchSettings]);
  const measured = typeof device.battery_level === "number";
  const low = measured && device.battery_level! <= 20;
  const color = low && !device.is_charging ? "bg-amber-500" : "bg-primary";
  const timestamp = device.last_updated ? new Date(device.last_updated.includes("T") ? device.last_updated : device.last_updated.replace(" ", "T") + "Z") : null;
  return <article className="surface flex h-full min-w-0 flex-col p-5 sm:p-6">
    <header className="flex items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-primary"><Smartphone size={21} /></span>
      <div className="min-w-0 flex-1"><h3 className="truncate text-base font-semibold" title={device.name}>{device.name || "名前なしのデバイス"}</h3><p className="mt-1 truncate text-xs text-muted-foreground">{[device.brand, device.model].filter(Boolean).join(" · ") || "デバイス情報なし"}</p></div>
      <Button variant="ghost" size="icon" aria-label={`${device.name}を編集`} onClick={() => setEditOpen(true)}><Pencil size={16} /></Button>
    </header>
    <div className="mb-4 mt-7 flex items-end justify-between gap-3"><div className="text-5xl font-medium tracking-tighter tabular-nums">{measured ? <>{device.battery_level}<span className="ml-1 text-lg text-muted-foreground">%</span></> : <span className="text-2xl text-muted-foreground">未計測</span>}</div>
      <span className={`flex items-center gap-1 text-xs ${low && !device.is_charging ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>{device.is_charging ? <><Zap size={13} />充電中</> : measured ? low ? "充電をおすすめ" : "バッテリー使用中" : "データ待ち"}</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className={`h-full rounded-full ${color}`} style={{width: `${device.battery_level ?? 0}%`}} /></div>
    <dl className="mb-5 mt-6 space-y-3 text-xs">
      {!loading && settings.show_temperature && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">温度</dt><dd>{device.temperature != null ? `${device.temperature} °C` : "—"}</dd></div>}
      {!loading && settings.show_voltage && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">電圧</dt><dd>{device.voltage ? `${device.voltage} V` : "—"}</dd></div>}
      {device.model_number && <div className="flex justify-between gap-3"><dt className="shrink-0 text-muted-foreground">型番</dt><dd className="break-all text-right">{device.model_number}</dd></div>}
      <div className="flex justify-between gap-3"><dt className="shrink-0 text-muted-foreground">最終更新</dt><dd className="text-right">{measured && timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp.toLocaleString("ja-JP") : "未受信"}</dd></div>
    </dl>
    <div className="mt-auto border-t pt-4">
      <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={device.uuid}>{device.uuid}</code><Button size="icon" variant="ghost" aria-label={`${device.name}のUUIDをコピー`} onClick={async () => {try {await navigator.clipboard.writeText(device.uuid); setCopyNotice("UUIDをコピーしました");} catch {setCopyNotice("コピーできませんでした。編集画面でUUIDを確認してください。");}}}><Copy size={14} /></Button></div>
      <p role="status" className={copyNotice ? "mb-2 text-xs text-muted-foreground" : "sr-only"}>{copyNotice}</p>
      <div className="mt-2 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => onUpdate(device.uuid)} disabled={updating}><RefreshCw size={15} className={updating ? "animate-spin" : ""} />{updating ? "取得中…" : "更新"}</Button><Button variant="ghost" size="icon" aria-label={`${device.name}を削除`} className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDeleteOpen(true)}><Trash2 size={16} /></Button></div>
    </div>
    <DeviceEditDialog device={device} open={editOpen} onOpenChange={setEditOpen} onSave={update => onEdit(device.uuid, update)} />
    <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>デバイスを削除</DialogTitle><DialogDescription>「{device.name}」を削除しますか？この操作は取り消せません。</DialogDescription></DialogHeader><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>キャンセル</Button><Button variant="destructive" onClick={() => {onDelete(device.uuid); setConfirmDeleteOpen(false);}}>削除する</Button></div></DialogContent></Dialog>
  </article>;
}
