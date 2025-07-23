import { useEffect, useState } from "react";

/**
 * ローディング状態がdelay(ms)以上続いた場合のみtrueを返す共通フック
 * @param loading ローディング状態
 * @param delay 遅延時間（ms）
 */
export function useDelayedLoader(loading: boolean, delay: number = 200): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer: number | null = null;
    if (loading) {
      timer = window.setTimeout(() => setShow(true), delay);
    } else {
      setShow(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, delay]);
  return show;
} 