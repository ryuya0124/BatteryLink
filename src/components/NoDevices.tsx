import React from "react"
import { Smartphone, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NoDevicesProps {
  type: "empty" | "filtered"
  onAddDevice?: () => void
}

export const NoDevices: React.FC<NoDevicesProps> = ({ type, onAddDevice }) => (
  <div className="surface px-5 py-16 text-center">
    <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-muted"><Smartphone className="size-7 text-primary" /></div>
    {type === "filtered" ? (
      <>
        <h3 className="text-lg font-medium text-foreground mb-2">条件に一致するデバイスがありません</h3>
        <p className="text-sm text-muted-foreground">検索キーワードやフィルター条件を変更してみてください。</p>
      </>
    ) : (
      <>
        <h3 className="text-lg font-medium text-foreground mb-2">最初のデバイスをつなぎましょう</h3>
        <p className="mx-auto max-w-md text-sm leading-7 text-muted-foreground mb-6">デバイスを登録し、APIでデータを送信すると、ここにバッテリーの状態が表示されます。</p>
        {onAddDevice && (
          <Button variant="default" onClick={onAddDevice}>
            <Plus className="h-4 w-4 mr-2" />
            デバイスを追加
          </Button>
        )}
      </>
    )}
  </div>
)
