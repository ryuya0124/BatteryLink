import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { fetchWithAuth } from "@/lib/utils";

interface ApiKeyInfo {
  id: string;
  created_at: string;
  last_used_at?: string;
}

export const ApiKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchWithAuth("/api/api-keys");
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
    });
    if (res && res.ok) {
      const data = await res.json();
      setNewKey(data.apiKey);
      fetchApiKeys();
    } else {
      setError("APIキーの発行に失敗しました");
    }
  };

  const deleteApiKey = async (id: string) => {
    setError(null);
    const res = await fetchWithAuth(`/api/api-keys/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      fetchApiKeys();
    } else {
      setError("APIキーの削除に失敗しました");
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return (
    <div className="max-w-xl mx-auto bg-white rounded shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">APIキー管理</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <Button onClick={createApiKey} className="mb-4">新しいAPIキーを発行</Button>
      {newKey && (
        <div className="mb-4">
          <div className="font-mono break-all p-2 bg-gray-100 rounded">{newKey}</div>
          <div className="text-xs text-gray-500">※この画面でしか表示されません。必ず控えてください。</div>
        </div>
      )}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">ID</th>
            <th className="p-2">発行日</th>
            <th className="p-2">最終使用</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {apiKeys.map((key) => (
            <tr key={key.id}>
              <td className="p-2 font-mono break-all">{key.id}</td>
              <td className="p-2">{key.created_at ? new Date(key.created_at).toLocaleString() : "-"}</td>
              <td className="p-2">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "-"}</td>
              <td className="p-2">
                <Button variant="destructive" size="sm" onClick={() => deleteApiKey(key.id)}>削除</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
