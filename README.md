# BatterySync 🔋

複数デバイスのバッテリー状態をリアルタイムで監視・管理できるWebアプリケーション。

## 概要

BatterySyncは、スマートフォン、タブレット、ノートパソコンなどの複数デバイスのバッテリー情報を一元管理できるサービスです。Auth0による認証、Cloudflare Workers上で動作するAPIサーバー、React製のダッシュボードを提供します。

## 機能

- 🔐 **Auth0認証** - セキュアなユーザー認証とソーシャルログイン対応
- 📱 **マルチデバイス管理** - 複数のデバイスを登録・監視
- 📊 **リアルタイム表示** - バッテリー残量、充電状態をリアルタイムで確認
- 🔑 **APIキー管理** - 外部からのアクセス用APIキーの発行・管理
- 🌙 **ダークモード** - 目に優しいダークテーマ対応
- 📱 **レスポンシブ** - モバイルからデスクトップまで対応

## 技術スタック

### フロントエンド
- **React 19** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **Tailwind CSS v4** - ユーティリティファーストCSS
- **Radix UI** - アクセシブルなUIコンポーネント
- **Framer Motion** - アニメーションライブラリ

### バックエンド
- **Cloudflare Workers** - エッジコンピューティング
- **Hono** - 軽量で高速なWebフレームワーク
- **Cloudflare D1** - SQLiteベースのデータベース
- **Cloudflare KV** - キーバリューストア
- **Cloudflare R2** - オブジェクトストレージ

### 認証
- **Auth0** - 認証プラットフォーム
- **Jose** - JWT検証

## プロジェクト構造

```
BatterySync/
├── src/                    # フロントエンドソースコード
│   ├── components/         # Reactコンポーネント
│   │   └── ui/            # UIコンポーネント (shadcn/ui)
│   ├── hooks/             # カスタムフック
│   ├── pages/             # ページコンポーネント
│   └── lib/               # ユーティリティ
├── server/                 # バックエンドソースコード
│   ├── api/               # APIルーティング
│   │   └── handlers/      # リクエストハンドラー
│   └── index.js           # エントリーポイント
├── public/                 # 静的ファイル
└── dist/                   # ビルド出力
```

## セットアップ

### 必要要件

- Node.js 24以上（回帰テストでNode標準SQLiteを使用）
- pnpm

### インストール

```bash
# 依存関係のインストール
pnpm install
```

### 開発

```bash
# 開発サーバーの起動
pnpm dev
```

APIも使用する場合は、初回に `pnpm build` と
`pnpm exec wrangler d1 migrations apply batterylink --local` を実行します。
別ターミナルで `pnpm dev:api` を起動すると、Viteの `/api` がローカルWorkerに接続します。
Auth0には開発画面のoriginをAllowed Callback URLs / Allowed Logout URLs / Allowed Web Originsへ登録してください。
認証の構成には [docs/architecture.md](docs/architecture.md) も参照してください。

### ビルド

```bash
# プロダクションビルド
pnpm build
```

### デプロイ

```bash
# Cloudflare Workersへデプロイ
pnpm deploy
```

D1 を初めて用意する場合は、先にマイグレーションを適用します。

```bash
pnpm exec wrangler d1 migrations apply batterylink --remote
```

## 環境変数

Cloudflare Workersのシークレットとして以下を設定:

- `AUTH0_DOMAIN` - Auth0ドメイン
- `AUTH0_AUDIENCE` - Auth0 API識別子
- `MGMT_CLIENT_ID` - Auth0 Management API用クライアントID
- `MGMT_CLIENT_SECRET` - Auth0 Management API用クライアントシークレット
- `MGMT_API_AUDIENCE` - Auth0 Management API識別子

ローカルでは `.dev.vars.example` を `.dev.vars` にコピーし、実値を設定してください。

## API エンドポイント

端末用APIキーは `PUT /api/devices/:uuid` の計測値送信用です。
`battery_level`（0〜100の数値）と `is_charging`（真偽値、互換用に0/1も可）が必須です。
`temperature`・`voltage`・`os_version` は省略すると既存値を保持し、明示的に `null` を送ると消去します。
APIキーの最終使用日時は、計測データが正常に保存されたときだけ更新されます。
デバイス削除・設定変更・APIキー管理にはAuth0ログインが必要です。
リクエストボディの上限は16KiBです。429応答時は `Retry-After` に従って再送してください。

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/devices` | デバイス一覧の取得 |
| POST | `/api/devices` | デバイスの登録 |
| PUT | `/api/devices/:uuid` | デバイス情報の更新 |
| DELETE | `/api/devices/:uuid` | デバイスの削除 |
| PATCH | `/api/devices/:uuid` | デバイスの部分更新 |
| GET | `/api/api-keys` | APIキー一覧の取得 |
| POST | `/api/api-keys` | APIキーの発行 |
| DELETE | `/api/api-keys/:id` | APIキーの削除 |
| GET | `/api/auth/me` | ユーザー情報の取得 |

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。
