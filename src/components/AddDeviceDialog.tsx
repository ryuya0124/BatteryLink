import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface AddDeviceDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  deviceName: string
  setDeviceName: (v: string) => void
  deviceBrand: string
  setDeviceBrand: (v: string) => void
  deviceModel: string
  setDeviceModel: (v: string) => void
  deviceModelNumber: string
  setDeviceModelNumber: (v: string) => void
  phoneModels: Record<string, any[]>
  selectedModelInfo: any
  onSubmit: (e: React.FormEvent) => void
}

export const AddDeviceDialog: React.FC<AddDeviceDialogProps> = ({
  open,
  onOpenChange,
  deviceName,
  setDeviceName,
  deviceBrand,
  setDeviceBrand,
  deviceModel,
  setDeviceModel,
  deviceModelNumber,
  setDeviceModelNumber,
  phoneModels,
  selectedModelInfo,
  onSubmit,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        デバイスを追加
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>新しいデバイスを追加</DialogTitle>
        <DialogDescription>スマートフォンの情報を入力してください</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="deviceName">デバイス名</Label>
          <Input
            id="deviceName"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="例: メインのiPhone"
            required
          />
        </div>
        <div>
          <Label htmlFor="deviceBrand">ブランド</Label>
          <Select value={deviceBrand} onValueChange={setDeviceBrand} required>
            <SelectTrigger>
              <SelectValue placeholder="ブランドを選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(phoneModels).map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {deviceBrand && (
          <div>
            <Label htmlFor="deviceModel">モデル</Label>
            <Select value={deviceModel} onValueChange={setDeviceModel} required>
              <SelectTrigger>
                <SelectValue placeholder="モデルを選択" />
              </SelectTrigger>
              <SelectContent>
                {phoneModels[deviceBrand as keyof typeof phoneModels].map((modelInfo: any) => (
                  <SelectItem key={modelInfo.model} value={modelInfo.model}>
                    {modelInfo.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedModelInfo && (
          <div>
            <Label htmlFor="deviceModelNumber">型番</Label>
            <Select value={deviceModelNumber} onValueChange={setDeviceModelNumber} required>
              <SelectTrigger>
                <SelectValue placeholder="型番を選択" />
              </SelectTrigger>
              <SelectContent>
                {selectedModelInfo.modelNumbers.map((modelNumber: string) => (
                  <SelectItem key={modelNumber} value={modelNumber}>
                    {modelNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button type="submit" className="w-full">
          デバイスを追加
        </Button>
      </form>
    </DialogContent>
  </Dialog>
)