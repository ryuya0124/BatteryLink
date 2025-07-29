import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 全角英数字を半角に変換する関数
export function convertToHalfWidth(text: string): string {
  if (!text) return text;
  return text
    .replace(/[Ａ-Ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[ａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

// バッテリー残量に応じた色を返す
export const getBatteryColor = (level: number) => {
  if (level <= 20) return "text-red-500"
  if (level <= 50) return "text-yellow-500"
  return "text-green-500"
}

// バッテリー容量に応じたテキスト色を返す
export const getBatteryCapacityColor = (capacity: number) => {
  if (capacity >= 5000) return "text-green-600"
  if (capacity >= 4000) return "text-blue-600"
  if (capacity >= 3500) return "text-yellow-600"
  return "text-orange-600"
}

// バッテリー容量に応じた背景色を返す
export const getBatteryCapacityBg = (capacity: number) => {
  if (capacity >= 5000) return "bg-green-100"
  if (capacity >= 4000) return "bg-blue-100"
  if (capacity >= 3500) return "bg-yellow-100"
  return "bg-orange-100"
}

// スマートフォンモデル情報
export const phoneModels = {
  Apple: [
    { model: "iPhone 15 Pro", osVersions: ["iOS 17.0", "iOS 17.1", "iOS 17.2"], modelNumbers: ["A3102", "A3103"] },
    { model: "iPhone 15", osVersions: ["iOS 17.0", "iOS 17.1", "iOS 17.2"], modelNumbers: ["A3090", "A3091"] },
    { model: "iPhone 14 Pro", osVersions: ["iOS 16.0", "iOS 16.1", "iOS 17.0"], modelNumbers: ["A2890", "A2891"] },
    { model: "iPhone 14", osVersions: ["iOS 16.0", "iOS 16.1", "iOS 17.0"], modelNumbers: ["A2882", "A2883"] },
    { model: "iPhone 13", osVersions: ["iOS 15.0", "iOS 16.0", "iOS 17.0"], modelNumbers: ["A2482", "A2483"] },
    { model: "iPhone 12", osVersions: ["iOS 14.0", "iOS 15.0", "iOS 16.0"], modelNumbers: ["A2172", "A2173"] },
  ],
  Samsung: [
    { model: "Galaxy S24", osVersions: ["Android 14", "Android 13"], modelNumbers: ["SM-S921", "SM-S926"] },
    { model: "Galaxy S23", osVersions: ["Android 13", "Android 14"], modelNumbers: ["SM-S911", "SM-S916"] },
    { model: "Galaxy S22", osVersions: ["Android 12", "Android 13"], modelNumbers: ["SM-S901", "SM-S906"] },
    { model: "Galaxy Note 20", osVersions: ["Android 10", "Android 11"], modelNumbers: ["SM-N981", "SM-N986"] },
    { model: "Galaxy A54", osVersions: ["Android 13", "Android 14"], modelNumbers: ["SM-A546", "SM-A547"] },
  ],
  Google: [
    { model: "Pixel 8 Pro", osVersions: ["Android 14", "Android 15"], modelNumbers: ["GC3VE", "G1MNW"] },
    { model: "Pixel 8", osVersions: ["Android 14", "Android 15"], modelNumbers: ["GX7AS", "G9BQD"] },
    { model: "Pixel 7 Pro", osVersions: ["Android 13", "Android 14"], modelNumbers: ["GE2AE", "GP4BC"] },
    { model: "Pixel 7", osVersions: ["Android 13", "Android 14"], modelNumbers: ["GVU6C", "G03Z5"] },
    { model: "Pixel 6", osVersions: ["Android 12", "Android 13"], modelNumbers: ["GB7N6", "G9S9B"] },
  ],
  Xiaomi: [
    { model: "Mi 13", osVersions: ["Android 13", "Android 14"], modelNumbers: ["2210132C", "2210132G"] },
    { model: "Mi 12", osVersions: ["Android 12", "Android 13"], modelNumbers: ["2201123C", "2201123G"] },
    { model: "Redmi Note 12", osVersions: ["Android 13", "Android 14"], modelNumbers: ["22101316C", "22101316G"] },
    { model: "Redmi Note 11", osVersions: ["Android 11", "Android 12"], modelNumbers: ["21091116C", "21091116G"] },
    { model: "POCO F5", osVersions: ["Android 13", "Android 14"], modelNumbers: ["23013PC75C", "23013PC75G"] },
  ],
  Huawei: [
    { model: "P60 Pro", osVersions: ["HarmonyOS 3.1", "HarmonyOS 4.0"], modelNumbers: ["ALN-AL00", "ALN-TL00"] },
    { model: "P50 Pro", osVersions: ["HarmonyOS 2.0", "HarmonyOS 3.0"], modelNumbers: ["JAD-AL50", "JAD-TL50"] },
    { model: "Mate 50", osVersions: ["HarmonyOS 3.0", "HarmonyOS 4.0"], modelNumbers: ["DCO-AL00", "DCO-TL00"] },
    { model: "Nova 11", osVersions: ["HarmonyOS 3.1", "HarmonyOS 4.0"], modelNumbers: ["FOA-AL00", "FOA-TL00"] },
    { model: "Honor 90", osVersions: ["Android 13", "Android 14"], modelNumbers: ["REA-AN00", "REA-TN00"] },
  ],
  OnePlus: [
    { model: "OnePlus 11", osVersions: ["Android 13", "Android 14"], modelNumbers: ["PJD110", "PJZ110"] },
    { model: "OnePlus 10 Pro", osVersions: ["Android 12", "Android 13"], modelNumbers: ["NE2213", "NE2215"] },
    { model: "OnePlus Nord 3", osVersions: ["Android 13", "Android 14"], modelNumbers: ["CPH2493", "CPH2491"] },
    { model: "OnePlus 9", osVersions: ["Android 11", "Android 12"], modelNumbers: ["LE2113", "LE2115"] },
  ],
}

// fetchWithAuth: Auth0のgetAccessTokenSilentlyでトークンを取得しAuthorizationヘッダを付与する形に共通化
export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {},
  getAccessTokenSilently: (opts?: any) => Promise<string>
) {
  const token = await getAccessTokenSilently({
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  });
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
