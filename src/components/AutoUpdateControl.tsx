import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";

interface AutoUpdateControlProps {
  autoUpdateEnabled: boolean;
  setAutoUpdateEnabled: (value: boolean) => void;
  onManualUpdate: () => void;
  devicesCount: number;
  manualRefresh?: boolean;
}
export function AutoUpdateControl({autoUpdateEnabled, setAutoUpdateEnabled, onManualUpdate, devicesCount, manualRefresh}: AutoUpdateControlProps) {
  return <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3">
    <div className="flex items-center gap-3"><span className={`size-2 rounded-full ${autoUpdateEnabled ? "bg-primary" : "bg-muted-foreground"}`} /><p className="text-sm text-muted-foreground">{autoUpdateEnabled ? "30秒ごとに表示を更新" : "受信した最新のデータを表示"}</p></div>
    <div className="flex flex-wrap items-center gap-5"><div className="flex items-center gap-2"><Label htmlFor="auto-update" className="text-sm">自動更新</Label><Switch id="auto-update" checked={autoUpdateEnabled} onCheckedChange={setAutoUpdateEnabled} /></div>
      <Button variant="ghost" size="sm" onClick={onManualUpdate} disabled={devicesCount === 0 || manualRefresh}><RefreshCw size={15} className={manualRefresh ? "animate-spin" : ""} />{manualRefresh ? "取得中…" : "今すぐ更新"}</Button>
    </div>
  </div>;
}
