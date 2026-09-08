import { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Copy, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { fetchWithAuth } from "@/lib/utils";

interface ApiKeyInfo {
  id: string;
  label?: string;
  created_at: string;
  last_used_at?: string;
}

function dateLabel(value?: string) {
  if (!value) return "未使用";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? "不明" : date.toLocaleString();
}

export function ApiKeyManager() {
  const { getAccessTokenSilently } = useAuth0();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/api-keys", {}, getAccessTokenSilently);
      if (!response.ok) throw new Error("APIキー一覧を取得できませんでした。再試行してください。");
      setKeys(await response.json());
    } finally { setLoading(false); }
  }, [getAccessTokenSilently]);

  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);

  async function mutate(path: string, method: string, body?: object) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const response = await fetchWithAuth(path, {
        method, headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }, getAccessTokenSilently);
      if (!response.ok) throw new Error(response.status === 429 ? "操作が多すぎます。1分後に再試行してください。" : "変更できませんでした。再試行してください。");
      if (method === "POST") {
        const data = await response.json();
        setNewKey(data.apiKey);
        setLabel("");
      }
      setEditing(null);
      setDeleting(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "通信エラーが発生しました"); }
    finally { setBusy(false); }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(newKey!);
      setNotice("APIキーをコピーしました");
    } catch { setError("コピーできませんでした。キーを選択してコピーしてください。"); }
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex items-start gap-4">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary"><KeyRound aria-hidden className="size-6" /></div>
        <div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">APIキー</h1>
          <p className="mt-1 text-sm text-muted-foreground">端末からバッテリー情報を送るための接続キーを管理します。</p></div>
      </header>
      <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
        <ShieldCheck aria-hidden className="size-5 shrink-0 text-primary" />
        <p>キーは発行時だけ表示されます。端末ごとに発行すると、紛失時に個別に無効化できます。デバイスの削除にはログインが必要です。</p>
      </div>
      {error && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <p role="status" className="text-sm text-muted-foreground">{notice}</p>
      <form className="rounded-xl border bg-card p-5" onSubmit={e => { e.preventDefault(); void mutate("/api/api-keys", "POST", { label }); }}>
        <label htmlFor="key-label" className="mb-2 block text-sm font-medium">キーの名前</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input id="key-label" maxLength={256} value={label} onChange={e => setLabel(e.target.value)} placeholder="例: リビングのタブレット" />
          <Button disabled={busy} className="shrink-0" type="submit">{busy ? "処理中…" : "キーを発行"}</Button>
        </div>
      </form>
      {newKey && <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="font-medium">新しいAPIキーを保存してください</h2>
        <code className="block select-all break-all rounded-lg bg-background p-3 text-sm">{newKey}</code>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={copyKey}><Copy aria-hidden className="mr-2 size-4" />コピー</Button>
          <Button variant="ghost" onClick={() => setNewKey(null)}>保存したので閉じる</Button></div>
      </div>}
      <div className="flex items-center justify-between">
        <h2 className="font-medium">発行済み <span className="text-muted-foreground">({keys.length})</span></h2>
        <Button variant="ghost" size="sm" disabled={loading || busy} onClick={() => { setError(null); load().catch(e => setError(e.message)); }}><RefreshCw aria-hidden className="mr-2 size-4" />再読み込み</Button>
      </div>
      {loading && <p role="status" className="py-4 text-sm text-muted-foreground">読み込み中…</p>}
      {!loading && !keys.length && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">APIキーはまだありません。上のフォームから発行できます。</p>}
      <ul className="space-y-3">{keys.map(key => <li key={key.id} className="rounded-xl border bg-card p-5">
        {editing === key.id ? <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void mutate(`/api/api-keys/${encodeURIComponent(key.id)}`, "PATCH", { label: editLabel }); }}>
          <Input aria-label="キーの名前を編集" maxLength={256} value={editLabel} onChange={e => setEditLabel(e.target.value)} />
          <Button size="sm" disabled={busy}>保存</Button><Button size="sm" type="button" variant="ghost" onClick={() => setEditing(null)}>キャンセル</Button>
        </form> : <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="break-all font-medium">{key.label || "名前なしのキー"}</h3>
          <div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditing(key.id); setEditLabel(key.label || ""); }}>名前を変更</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setDeleting(key.id)}>無効化</Button></div>
        </div>}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">発行: {dateLabel(key.created_at)}<br />最終使用: {dateLabel(key.last_used_at)}</p>
        {deleting === key.id && <div role="alert" className="mt-4 space-y-3 rounded-lg bg-destructive/10 p-3 text-sm">
          <p>このキーを使っている端末からの送信が停止します。無効化しますか？</p>
          <div className="flex gap-2"><Button size="sm" variant="destructive" disabled={busy} onClick={() => void mutate(`/api/api-keys/${encodeURIComponent(key.id)}`, "DELETE")}>無効化する</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setDeleting(null)}>キャンセル</Button></div>
        </div>}
      </li>)}</ul>
    </section>
  );
}
