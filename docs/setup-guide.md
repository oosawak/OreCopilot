# 🧠 AI Second Brain — セットアップガイド

このドキュメントを読めば、**ゼロからアプリを動かすまで**の全手順がわかります。

---

## 📋 概要

スマホのブラウザ（PWA）からAIエージェントに指示を出し、GitHubリポジトリ上のMarkdownファイルを読み書きする「完全サーバーレスのパーソナルナレッジ＆プロジェクト管理システム」です。

| 項目 | 内容 |
|------|------|
| フロントエンド | React + Vite + TypeScript + Tailwind CSS |
| ホスティング | GitHub Pages / Vercel / Cloudflare Pages |
| データストア | GitHubリポジトリ（Markdown形式） |
| 認証 | GitHub OAuth（Cloudflare Worker経由） |
| LLM | OpenAI / Anthropic / Ollama（切り替え可） |

---

## 🗂️ ディレクトリ構成

```
orecopilot/
├── src/
│   ├── lib/
│   │   ├── auth.ts        # GitHub OAuth フロー
│   │   ├── github.ts      # Octokit: ファイル読み書き
│   │   ├── llm.ts         # LLMルーティング（Pro/Cheap/Free）
│   │   └── prompt.ts      # スキーマ読み込み・[[wikilink]]展開
│   ├── components/
│   │   ├── Chat.tsx        # AIチャット画面
│   │   ├── Kanban.tsx      # PDCAプロジェクトボード
│   │   ├── Inbox.tsx       # 未整理テキスト取り込み
│   │   └── Settings.tsx    # APIキー・LLM設定
│   └── App.tsx             # ルーティング・ログイン制御
├── worker/
│   ├── index.js            # Cloudflare Worker（OAuthトークン交換）
│   └── wrangler.toml       # Workerデプロイ設定
├── schemas/                # AIへのシステムプロンプト（GitHubリポジトリ側に配置）
│   ├── base.md             # ベーススキーマ（PDCA・出力形式）
│   ├── persona-ios.md      # iOSエンジニア用ペルソナ
│   ├── persona-marketer.md # マーケター用ペルソナ
│   └── ingest.md           # Inbox取り込み用スキーマ
├── docs/
│   ├── system-specification.md  # 総合仕様書
│   └── handover-notes.md        # 引き継ぎ資料（実装上の注意点）
├── .env.example            # 環境変数のテンプレート
└── 🧠Brain/                # データ保存先（GitHubリポジトリ側）
    ├── 01_Inbox/
    └── 02_Projects/
        └── [プロジェクト名]/
            ├── 01_Plan.md
            ├── 02_Do.md
            ├── 03_Check.md
            ├── 04_Adjust.md
            └── Work_Log.md
```

---

## 🚀 セットアップ手順

### 前提条件

- **Node.js v20.19+ または v22+**（v20.14以下は非対応）
- **GitHubアカウント**
- **Cloudflareアカウント**（無料プランでOK）

---

### Step 1: リポジトリのクローン

```bash
git clone https://github.com/あなたのユーザー名/orecopilot.git
cd orecopilot
npm install
```

---

### Step 2: データ用GitHubリポジトリの作成

AIが読み書きするナレッジベース用に **Privateリポジトリ** を新規作成してください。

```
リポジトリ名例: my-second-brain
```

> ⚠️ **Privateリポジトリ必須** — 個人のメモやプロジェクト情報を管理するため、必ずPrivateにしてください。

---

### Step 3: GitHub OAuth Appの作成

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. 以下を入力：

| 項目 | 値 |
|------|----|
| Application name | AI Second Brain |
| Homepage URL | `https://あなたのドメイン` （ローカル確認時は `http://localhost:5173`） |
| Authorization callback URL | Homepage URLと同じ |

3. **Client ID** と **Client Secret** をメモしておく

---

### Step 4: Cloudflare Workerのデプロイ

```bash
cd worker
npm install -g wrangler   # または npx wrangler
npx wrangler login        # Cloudflareにログイン
npx wrangler deploy       # Workerをデプロイ
```

デプロイ後、**Cloudflare Dashboard → Worker → Settings → Variables** で以下を設定：

| 変数名 | 値 | 種別 |
|--------|----|------|
| `GITHUB_CLIENT_ID` | Step 3 で取得した Client ID | Plain text |
| `GITHUB_CLIENT_SECRET` | Step 3 で取得した Client Secret | **Secret** |
| `ALLOWED_ORIGIN` | アプリのURL（例: `https://yourname.github.io`） | Plain text |

Worker の URL をメモしておく（例: `https://second-brain-oauth.yourname.workers.dev`）

---

### Step 5: 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
VITE_GITHUB_CLIENT_ID=Step3で取得したClient ID
VITE_OAUTH_WORKER_URL=Step4でデプロイしたWorkerのURL
```

> ⚠️ `.env.local` は `.gitignore` に含まれており、Gitにはコミットされません。

---

### Step 6: ビルドとホスティング

```bash
npm run build   # dist/ フォルダにビルド成果物が生成される
```

#### GitHub Pagesにデプロイする場合

`vite.config.ts` の `defineConfig` に `base` を追加：

```ts
export default defineConfig({
  base: '/orecopilot/', // リポジトリ名に合わせて変更
  plugins: [...],
})
```

```bash
npm run build
# dist/ の中身を gh-pages ブランチにプッシュ
```

#### Vercelにデプロイする場合

```bash
npm install -g vercel
vercel --prod
```

Vercel の環境変数設定画面で `.env.local` の内容を同様に設定。

---

### Step 7: アプリの初期設定

1. デプロイしたURLをブラウザで開く
2. **「GitHubでログイン」** をクリック
3. GitHubで認証を許可
4. ⚙️ **Settings タブ** を開いて以下を設定：
   - **Owner**: GitHubユーザー名
   - **Repository名**: Step 2 で作成したリポジトリ名
   - **LLMモード**: 使いたいAIを選択

---

## 🤖 LLM設定

Settings 画面でモードを選んで各APIキーを設定します。

### 🔴 Pro（最高性能）
- OpenAI GPT-4o などの高性能モデル
- Settings に API Key とモデル名を入力

### 🟡 Cheap（バランス）
- Anthropic Claude Haiku または OpenAI GPT-4o-mini
- Settings に Anthropic / OpenAI の API Key を入力

### 🟢 Free / Local（プライベート優先）
- Ollama などのローカルLLM（完全オフライン）
- Ollamaを起動する際は **CORS設定が必須**：

```bash
OLLAMA_ORIGINS="https://あなたのアプリURL" ollama serve
```

---

## 📱 使い方

### 💬 AIチャット
- AIエージェントに自然言語で指示
- `[[ファイル名]]` と書くと、GitHubリポジトリの該当ファイルを自動で読み込んでAIに渡す
- ペルソナ（iOSエンジニア / マーケター）とLLMモードをその場で切り替え可能
- AIの応答はJSON形式でGitHubに自動保存される

### 📋 カンバン
- `🧠Brain/02_Projects/` 以下のPDCA進捗をボードで確認
- 各フェーズ（Plan/Do/Check/Adjust）のファイルをタップで内容を確認

### 📥 Inbox
- URLのスクレイピング結果、NotebookLMの出力など未整理テキストを貼り付け
- AIが自動で構造化し、適切なプロジェクトフォルダに振り分けて保存

### ⚙️ 設定
- GitHub リポジトリ名・LLM APIキーの管理
- ログアウト

---

## ⚠️ 実装上の注意点（引き継ぎ事項）

詳細は [`docs/handover-notes.md`](./handover-notes.md) を参照。要点は以下の通り：

1. **CORS** — Local LLM使用時は `OLLAMA_ORIGINS` の設定が必須
2. **JSONパース** — AI出力から `[...]` を正規表現で抽出してから `JSON.parse`（`src/lib/llm.ts` の `extractJsonArray` 参照）
3. **SHA競合対策** — GitHub ファイル更新時は必ず最新 `sha` を取得してからコミット（`src/lib/github.ts` の `upsertFile` 参照）
4. **プロンプト構築** — `schemas/` フォルダのテンプレートと `[[wikilink]]` を動的に結合（`src/lib/prompt.ts` 参照）

---

## 🔐 セキュリティ

- GitHub OAuth の `client_secret` は **Cloudflare Worker 内にのみ保存**。フロントエンドには公開されない。
- アクセストークンは **ブラウザの LocalStorage にのみ保存**。外部サーバーへの送信なし。
- LLM APIキーも同様に LocalStorage にのみ保存。
- データ用リポジトリは必ず **Private** に設定すること。
