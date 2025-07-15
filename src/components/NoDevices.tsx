import React from "react"
import { Smartphone, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NoDevicesProps {
  type: "empty" | "filtered"
  onAddDevice?: () => void
}

export const NoDevices: React.FC<NoDevicesProps> = ({ type, onAddDevice }) => (
  <div className="text-center py-12">
    <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
    {type === "filtered" ? (
      <>
        <h3 className="text-xl font-medium text-gray-900 mb-2">条件に一致するデバイスがありません</h3>
        <p className="text-gray-500">フィルター条件を変更してください</p>
      </>
    ) : (
      <>
        <h3 className="text-xl font-medium text-gray-900 mb-2">デバイスが登録されていません</h3>
        <p className="text-gray-500 mb-4">最初のスマートフォンを追加してバッテリー管理を始めましょう</p>
        {onAddDevice && (
          <Button onClick={onAddDevice}>
            <Plus className="h-4 w-4 mr-2" />
            デバイスを追加
          </Button>
        )}
      </>
    )}
  </div>
) 