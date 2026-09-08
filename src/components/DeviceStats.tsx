import { Smartphone, BatteryCharging, BatteryLow, Radio } from "lucide-react";
import type { Device } from "@/types";

export function DeviceStats({devices}: {devices: Device[]}) {
  const metrics = [
    {label: "登録デバイス", value: devices.length, icon: Smartphone, note: "すべてのデバイス"},
    {label: "充電中", value: devices.filter(d => d.is_charging).length, icon: BatteryCharging, note: "最後に受信した状態"},
    {label: "残量20%以下", value: devices.filter(d => d.battery_level !== null && d.battery_level <= 20).length, icon: BatteryLow, note: "充電のタイミングを確認"},
    {label: "未計測", value: devices.filter(d => d.battery_level === null).length, icon: Radio, note: "デバイスからの送信待ち"},
  ];
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">{metrics.map(({label, value, icon: Icon, note}) => <div key={label} className="surface p-4 sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-2 text-sm text-muted-foreground"><span>{label}</span><Icon size={18} aria-hidden /></div>
    <div className="text-4xl font-medium tracking-tight tabular-nums">{value}<span className="ml-2 text-sm text-muted-foreground">台</span></div>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{note}</p>
  </div>)}</div>;
}
