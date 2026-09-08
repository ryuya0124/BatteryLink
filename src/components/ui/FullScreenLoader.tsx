import { Battery, LoaderCircle } from "lucide-react";

export default function FullScreenLoader({label = "データを読み込んでいます…"}: {label?: string}) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-background px-6 text-foreground" role="status" aria-live="polite">
    <div className="text-center"><Battery size={40} className="mx-auto mb-5 text-primary" aria-hidden /><div className="text-2xl font-semibold tracking-tight">BatterySync</div><p className="mt-5 flex items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle size={17} className="animate-spin" aria-hidden />{label}</p></div>
  </div>;
}
