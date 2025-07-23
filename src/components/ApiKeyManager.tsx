import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { fetchWithAuth } from "@/lib/utils";
import { useAuth0 } from "@auth0/auth0-react";

interface ApiKeyInfo {
  id: string;
  label?: string;
  created_at: string;
  last_used_at?: string;
}

export const ApiKeyManager: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchWithAuth("/api/api-keys", {}, getAccessTokenSilently);
    if (res && res.ok) {
      setApiKeys(await res.json());
    } else {
      setError("APIキー一覧の取得に失敗しました");
    }
    setLoading(false);
  };

  const createApiKey = async () => {
    setError(null);
    setNewKey(null);
    const res = await fetchWithAuth("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: labelInput }),
    }, getAccessTokenSilently);
    if (res && res.ok) {
      const data = await res.json();
      setNewKey(data.apiKey);
      setLabelInput("");
      fetchApiKeys();
    } else {
      setError("APIキーの発行に失敗しました");
    }
  };

  const deleteApiKey = async (id: string) => {
    setError(null);
    const res = await fetchWithAuth(`/api/api-keys/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }, getAccessTokenSilently);
    if (res && res.ok) {
      fetchApiKeys();
    } else {
      setError("APIキーの削除に失敗しました");
    }
  };

  const startEdit = (id: string, currentLabel: string) => {
    setEditingId(id);
    setEditLabel(currentLabel || "");
  };

  const saveEdit = async (id: string) => {
    setError(null);
    const res = await fetchWithAuth(`/api/api-keys/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel }),
    }, getAccessTokenSilently);
    if (res && res.ok) {
      setEditingId(null);
      setEditLabel("");
      fetchApiKeys();
    } else {
      setError("ラベルの更新に失敗しました");
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return (
    <div className="max-w-xl mx-auto bg-white rounded shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">APIキー管理</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1"
          placeholder="APIキー名（任意）"
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
        />
        <Button onClick={createApiKey}>新しいAPIキーを発行</Button>
      </div>
      {newKey && (
        <div className="mb-4">
          <div className="font-mono break-all p-2 bg-gray-100 rounded">{newKey}</div>
          <div className="text-xs text-gray-500">※この画面でしか表示されません。必ず控えてください。</div>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {apiKeys.map((key) => (
          <div key={key.id} className="border rounded shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50">
            <div className="flex-1 min-w-0">
              {editingId === key.id ? (
                <div className="flex gap-1 mb-2 sm:mb-0">
                  <input
                    type="text"
                    className="border rounded px-1 py-0.5 flex-1"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => saveEdit(key.id)}>保存</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>キャンセル</Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center mb-2 sm:mb-0">
                  <span className="font-semibold text-lg">{key.label || <span className="text-gray-400">(未設定)</span>}</span>
                  <Button size="sm" variant="outline" onClick={() => startEdit(key.id, key.label || "")}>編集</Button>
                </div>
              )}
              <div className="text-xs text-gray-500">
                発行日: {key.created_at ? new Date(key.created_at).toLocaleString() : "-"} ／ 最終使用: {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "-"}
              </div>
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-4 flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => deleteApiKey(key.id)}>削除</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
