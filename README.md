# BatterySync 🔋

スマートフォンやタブレットから届いたバッテリー情報を、ひとつのダッシュボードで管理するWebアプリです。

**本番サイト:** [batt.ryuya-dev.net](https://batt.ryuya-dev.net)

**リポジトリ名:** BatteryLink / **Cloudflare Worker名:** `batterysync`

## できること

- デバイスの登録・編集・削除、UUIDの確認・コピー
- バッテリー残量、充電状態、温度、電圧、最終更新の確認
- デバイス検索、ブランド・残量での絞り込み、並び替え
- 登録台数・充電中・低残量・未計測の集計
- 手動更新と30秒ごとの表示自動更新
- データ送信用APIキーの発行・名前変更・無効化
- Auth0によるログイン、対応プロバイダーとのアカウント連携
- ライト・ダーク・OS連動テーマとレスポンシブ表示

> 登録しただけでは端末のバッテリー情報は取得されません。ショートカットやスクリプトなど、**端末側からAPIへ送信する設定が必要**です。初回送信までは「未計測」と表示されます。自動更新はサーバーに保存された情報の再取得であり、端末への計測要求や常時接続ではありません。

## 使い始める

1. [本番サイト](https://batt.ryuya-dev.net)にログインします。
2. ダッシュボードでデバイスを追加し、そのUUIDをコピーします。
3. 「APIキー」で接続キーを発行し、安全な場所に保存します。**キーの値は発行時に一度だけ表示されます。**
4. 端末側のショートカットやスクリプトに、UUID・APIキー・送信する計測値を設定します。
5. データを送信して、ダッシュボードを更新します。

APIキーは発行したアカウントの全デバイスに送信できます。特定の1台だけに権限が限定されるキーではありません。用途ごとに名前を付け、不要になったキーや漏えいしたキーは無効化してください。

## データ送信API

### リクエスト例

```http
PUT https://batt.ryuya-dev.net/api/devices/YOUR_DEVICE_UUID
x-api-key: YOUR_API_KEY
Content-Type: application/json

{
  "battery_level": 82,
  "is_charging": true,
  "temperature": 28.5,
  "voltage": "4.2",
  "os_version": "iOS 18"
}
```

curlで送信する場合（Bashなど）:

```bash
curl --fail-with-body --request PUT \
  'https://batt.ryuya-dev.net/api/devices/YOUR_DEVICE_UUID' \
  --header 'x-api-key: YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"battery_level":82,"is_charging":true}'
```

`YOUR_DEVICE_UUID` と `YOUR_API_KEY` は自身の値に置き換えてください。上の計測値は例です。実運用では端末が取得した値を送ります。キーを含むコマンドはシェル履歴に残る場合があるため、公開ログ・スクリーンショット・リポジトリに含めないでください。

### 送信フィールド

| フィールド | 必須 | 型・扱い |
| --- | --- | --- |
| `battery_level` | 必須 | 0〜100の数値。`0` も有効 |
| `is_charging` | 必須 | JSONの `true` / `false`。互換性のため数値 `1` / `0` も受付 |
| `temperature` | 任意 | −100〜200の数値（℃）。`0` も有効 |
| `voltage` | 任意 | 文字列または数値。画面ではV単位で表示 |
| `os_version` | 任意 | 文字列 |

- `"82"` や `"true"` は文字列のため、必須フィールドの正しい型ではありません。
- 任意フィールドを**省略すると既存値を保持**します。明示的に `null` を送るとその値を消去します。
- 最終更新時刻はサーバーが記録します。クライアントから送った `last_updated` は使用しません。
- 成功時はHTTP `200` とテキスト `デバイス更新完了` を返します。成功レスポンスをJSONとして解析しないでください。
- APIキーの最終使用日時は、計測データが正常に保存された場合に更新されます。計測値と使用日時は同じD1トランザクションで保存されます。
- リクエストボディの上限は16KiBです。

### エラーの見分け方

| HTTPステータス | 確認すること |
| --- | --- |
| `400` | JSONの構文、必須フィールド、数値・真偽値の型と範囲 |
| `401` | `x-api-key` が付いているか。管理APIの場合はAuth0ログインが必要 |
| `403` | キーが無効化されていないか、UUIDとキーが同じアカウントに属するか |
| `404` | APIのパスが正しいか。管理APIの場合は対象と所有権も確認 |
| `413` | ボディが16KiBを超えていないか |
| `429` | 操作回数制限。`Retry-After` に従って再送 |
| `5xx` | サーバー・DB・認証サービスのエラー。時間を空けて再試行 |

エラー本文はエンドポイントによりJSONまたはテキストです。まずHTTPステータスを確認してください。「未計測」のままの場合は、端末側の送信先・メソッド `PUT`・HTTP応答を確認します。画面の更新だけでは計測データは作成されません。

## API一覧と認証

端末用APIキーで使えるのは、計測値を送信する `PUT /api/devices/:uuid` です。それ以外の通常の管理APIには、Auth0のアクセストークンを `Authorization: Bearer ...` で送ります。APIキーでデバイス一覧の取得や削除はできません。

| メソッド | パス | 用途 |
| --- | --- | --- |
| `GET` | `/api/devices` | 自分のデバイス一覧 |
| `POST` | `/api/devices` | デバイス登録（`uuid`・`name` が必須） |
| `PUT` | `/api/devices/:uuid` | 計測値の送信（端末用APIキー） |
| `PATCH` | `/api/devices/:uuid` | 名前・ブランド・モデル・型番の編集 |
| `DELETE` | `/api/devices/:uuid` | デバイス削除 |
| `GET` | `/api/battery/:uuid` | 個別の計測情報。レスポンスは `{ "success": true, "data": { ... } }` |
| `GET` | `/api/api-keys` | キーの名前・発行日時・最終使用日時の一覧（キーの値は非返却） |
| `POST` | `/api/api-keys` | キー発行。JSON `{ "label": "用途" }` を送信 |
| `PATCH` | `/api/api-keys/:id` | キーの名前変更 |
| `DELETE` | `/api/api-keys/:id` | キーの無効化 |
| `GET` | `/api/auth/me` | ユーザー情報・自動更新設定の取得 |
| `PATCH` | `/api/auth/auto-update` | 自動更新設定の保存 |
| `GET` | `/api/auth/device-display-settings?device_uuid=...` | 温度・電圧の表示設定を取得 |
| `PATCH` | `/api/auth/device-display-settings` | デバイスごとの表示設定を保存 |
| `GET` | `/api/auth/identities` | 連携済みログイン方法を取得 |
| `POST` | `/api/link-account` | アカウント連携。本文に連携元・連携先のアクセストークンが必要 |
| `DELETE` | `/api/auth/account` | アカウントと関連データを削除 |

アカウント連携・削除は管理画面からの操作を推奨します。連携には両アカウントの確認済みメールアドレスの一致が必要です。連携先にデバイスやAPIキーがある場合は、データ移行を行わず `409` で拒否します。制約は [設計・運用ドキュメント](docs/architecture.md) を参照してください。

## 構成

| 領域 | 使用技術・役割 |
| --- | --- |
| フロントエンド | React 19・TypeScript・Vite・Tailwind CSS v4・Radix UI |
| API・静的配信 | Cloudflare Workers・Hono・Workers Static Assets |
| データ保存 | Cloudflare D1（デバイス・APIキーのハッシュ・ユーザー設定） |
| 認証 | Auth0、`jose` によるJWT検証 |
| その他のバインディング | KV・R2を `wrangler.toml` に定義 |

ログイン関連はAuth0、アプリケーションのデータ処理はCloudflare側で行います。D1にAPIキーの平文は保存しません。

```text
BatteryLink/
├── src/
│   ├── components/       # 管理画面・ダイアログ・共通UI
│   ├── hooks/            # データ取得・表示設定
│   ├── pages/            # トップ・ダッシュボード・APIキー・アカウントなど
│   └── lib/              # 認証付き通信など
├── server/
│   ├── api/handlers/     # APIハンドラー
│   ├── *.test.js         # API・同期の回帰テスト
│   └── index.js          # Workerエントリーポイント
├── migrations/           # D1初期スキーマ
├── scripts/smoke.mjs     # 非破壊のHTTPチェック
├── docs/architecture.md  # 設計・認証・運用上の制約
├── public/               # 静的ファイル
├── wrangler.toml         # Cloudflare設定
└── dist/                 # ビルド出力（生成物）
```

## ローカル開発

### 必要なもの

- Node.js 24以上（テストでNode標準のSQLiteを使用）
- pnpm 10.28.2（`package.json` の `packageManager` 指定）
- ローカルのURLを許可したAuth0アプリケーション

```bash
git clone https://github.com/ryuya0124/BatteryLink.git
cd BatteryLink
pnpm install --frozen-lockfile
```

pnpmをCorepack経由で使う環境では、以降の `pnpm` を `corepack pnpm` に読み替えられます。

### 環境変数

`.dev.vars.example` を `.dev.vars` にコピーし、Worker用の値を設定します。秘密情報を含む `.dev.vars` をコミットしないでください。

| Worker側の変数 | 用途 |
| --- | --- |
| `AUTH0_DOMAIN` | JWTの発行元ドメイン（`https://` や末尾の `/` は付けない） |
| `AUTH0_AUDIENCE` | アプリAPIの識別子。現在は `https://batt.ryuya-dev.net/` |
| `MGMT_CLIENT_ID` | Auth0 Management API用クライアントID |
| `MGMT_CLIENT_SECRET` | Management API用クライアントシークレット |
| `MGMT_API_AUDIENCE` | Auth0 Management APIの識別子。アプリAPIのaudienceとは別 |

フロントエンドのAuth0設定を上書きする場合は `.env.local` に次の公開設定を指定し、Viteを再起動・再ビルドします。

```dotenv
VITE_AUTH0_DOMAIN=auth0.ryuya-dev.net
VITE_AUTH0_CLIENT_ID=YOUR_SPA_CLIENT_ID
VITE_AUTH0_AUDIENCE=https://batt.ryuya-dev.net/
```

`VITE_` 付きの値はブラウザへ配信されます。クライアントシークレットやManagement APIの秘密情報を入れないでください。既定の設定はこのアプリ向けなので、別テナントで使う場合は [認証構成](docs/architecture.md) とサーバー側の設定も確認してください。

Auth0のAllowed Callback URLs・Allowed Logout URLs・Allowed Web Originsには、開発サーバーで使うURLを登録します。ホスト名とポートを合わせ、`localhost` と `127.0.0.1` を混同しないでください。Callback・Logoutは実際のリダイレクトURLに合わせ、Web Originsにはパスを含めないoriginを指定します。本番のApplication Login URIは `https://batt.ryuya-dev.net/login` です。

### 起動

初回に静的ファイルをビルドし、ローカルDBを作成します。

```bash
pnpm build
pnpm exec wrangler d1 migrations apply batterylink --local
```

別々のターミナルで次を起動します。

```bash
# フロントエンド（表示されたViteのURLを開く）
pnpm dev
```

```bash
# ローカルAPI（ポート8787）
pnpm dev:api
```

Viteの `/api` リクエストはローカルWorkerへ転送されます。ローカルDBと本番DBは別です。ローカル開発のために `--remote` で本番DBへマイグレーションを実行しないでください。

## テスト・検証

```bash
pnpm test                 # APIと同期処理の回帰テスト
pnpm check                # ESLint・TypeScript・本番ビルド
pnpm audit --prod         # 本番依存関係の監査
```

主な回帰テスト:

- キー発行 → デバイス登録 → 計測送信 → 読み戻し → キー無効化後の送信拒否
- 他ユーザーのデバイス・APIキーへのアクセス拒否
- 既存の本番スキーマとの互換性、残量0・温度0・充電状態の0/1
- 任意フィールドの省略時の保持と、`null` による消去
- 不正な送信で計測値・キー使用日時が変わらないこと
- DB書き込み失敗時のロールバック、保存直前のキー無効化
- 遅れて返った古い応答による上書き防止、取得失敗時の既存表示維持
- バックグラウンド更新で全画面ローディングに切り替わらないこと

テストでは隔離したSQLiteとテスト用JWTなどを使用します。UI側のテストは取得処理の応答順序を制御するもので、ブラウザ全体のE2Eテストではありません。本番データや実ユーザーの認証情報は使用しません。

稼働中の環境に対する、未認証での非破壊HTTPチェック:

```bash
node scripts/smoke.mjs http://127.0.0.1:8787
node scripts/smoke.mjs https://batt.ryuya-dev.net
```

このチェックはページ表示、未認証・不正JWTの拒否、未知API、CORSプリフライトを確認します。キーの発行や実デバイスへのデータ送信を検証するものではありません。GitHub Actionsでは `pnpm test`・`pnpm check` と本番依存関係の監査を実行します。

## Cloudflareへのデプロイ

現在の `wrangler.toml` は、本アプリのWorker `batterysync` とカスタムドメイン `batt.ryuya-dev.net` を指定しています。フォーク先で使う場合は、アカウント・ドメイン・D1・KV・R2の参照先を自身の環境に合わせてください。

```bash
pnpm exec wrangler login
pnpm test
pnpm check
pnpm exec wrangler deploy --keep-vars
```

`--keep-vars` はダッシュボード側で設定済みの通常変数を保持するために指定しています。Management APIのクライアントシークレットなどはCloudflareのSecretsとして設定してください。`pnpm deploy` も用意していますが、テスト実行や `--keep-vars` の指定は含みません。

新しい本番D1を初めて用意した場合のみ、対象を確認してからマイグレーションを適用します。

```bash
pnpm exec wrangler d1 migrations apply batterylink --remote
```

既存DBへの適用前にはスキーマとバックアップを確認してください。`0001_initial.sql` は `CREATE TABLE IF NOT EXISTS` を使用しており、既存テーブルの構造を自動的に作り直すものではありません。

## ライセンス

MIT License。詳細は [LICENSE](LICENSE) を参照してください。
