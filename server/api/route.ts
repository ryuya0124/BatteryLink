// 仮のデバイスリスト（本来はKVやDBから取得）
const mockDevices = [
  { id: "device-001", model: "iPhone 15 Pro", brand: "Apple" },
  { id: "device-002", model: "Galaxy S24", brand: "Samsung" },
  { id: "device-003", model: "Pixel 8 Pro", brand: "Google" },
  // 必要に応じて追加
]

// デバイス情報を取得する関数
function getDeviceInfo(deviceId: string) {
  return mockDevices.find((device: any) => device.id === deviceId)
}

// バッテリー容量のマッピング（mAh）
const batteryCapacities: { [key: string]: number } = {
  // iPhone
  "iPhone 15 Pro": 3274,
  "iPhone 15": 3349,
  "iPhone 14 Pro": 3200,
  "iPhone 14": 3279,
  "iPhone 13": 3240,
  "iPhone 12": 2815,

  // Samsung
  "Galaxy S24": 4000,
  "Galaxy S23": 3900,
  "Galaxy S22": 3700,
  "Galaxy Note 20": 4300,
  "Galaxy A54": 5000,

  // Google
  "Pixel 8 Pro": 5050,
  "Pixel 8": 4575,
  "Pixel 7 Pro": 5000,
  "Pixel 7": 4355,
  "Pixel 6": 4614,

  // Xiaomi
  "Mi 13": 4500,
  "Mi 12": 4500,
  "Redmi Note 12": 5000,
  "Redmi Note 11": 5000,
  "POCO F5": 5160,

  // Huawei
  "P60 Pro": 4815,
  "P50 Pro": 4360,
  "Mate 50": 4460,
  "Nova 11": 4500,
  "Honor 90": 5000,

  // OnePlus
  "OnePlus 11": 5000,
  "OnePlus 10 Pro": 5000,
  "OnePlus Nord 3": 5000,
  "OnePlus 9": 4500,
}

// 模擬的なバッテリー情報を生成
function generateBatteryInfo(deviceId: string, deviceInfo: any) {
  const seed = Number.parseInt(deviceId.slice(-4), 16) || 1000
  const now = Date.now()

  // 時間経過に基づいてバッテリーレベルを計算（徐々に減少）
  const timeBasedDecrease = Math.floor((now / (1000 * 60 * 5)) % 100) // 5分ごとに1%減少
  const randomVariation = Math.floor(Math.random() * 10) - 5 // ±5%のランダム変動

  let batteryLevel = 100 - timeBasedDecrease + randomVariation
  batteryLevel = Math.max(5, Math.min(100, batteryLevel)) // 5%〜100%の範囲に制限

  const isCharging = batteryLevel < 30 ? Math.random() > 0.3 : Math.random() > 0.8
  const batteryCapacity = batteryCapacities[deviceInfo?.model] || 4000

  const result: any = {
    deviceId,
    batteryLevel,
    isCharging,
    lastUpdated: new Date().toISOString(),
    batteryCapacity,
  }

  // Androidの場合のみ温度と電圧を追加
  if (deviceInfo?.brand !== "Apple") {
    result.temperature = Math.floor(Math.random() * 15) + 25 // 25-40度
    result.voltage = (3.7 + Math.random() * 0.5).toFixed(2) // 3.7-4.2V
  }

  return result
}

// Cloudflare Workers用のAPIエンドポイント
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    try {
      // パスからdeviceIdを抽出
      const url = new URL(request.url)
      const pathParts = url.pathname.split("/")
      const deviceId = pathParts[pathParts.length - 1]

      // デバイス情報を取得
      const deviceInfo = getDeviceInfo(deviceId)
      if (!deviceInfo) {
        return new Response(JSON.stringify({ success: false, error: "Device not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }

      const batteryInfo = generateBatteryInfo(deviceId, deviceInfo)

      // レスポンス遅延をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

      return new Response(JSON.stringify({
        success: true,
        data: batteryInfo,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch battery info" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}
