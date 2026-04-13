# 📱 Serverless AI Second Brain — 総合仕様書

## 1.1 プロジェクト概要

スマホのブラウザ（PWA）からAIエージェントに指示を出し、GitHubリポジトリ上のMarkdownファイルを読み書きさせる「完全サーバーレスのパーソナルナレッジ＆プロジェクト管理システム」です。ObsidianやVS Codeとのデータ互換性を保ちつつ、PDCAサイクルをAIに自律的に回させます。

---

## 1.2 アーキテクチャと技術スタック

| レイヤー | 技術 |
|---------|------|
| **フロントエンド (PWA)** | React + Vite（または Next.js 静的エクスポート）+ Tailwind CSS |
| **ホスティング** | GitHub Pages / Vercel / Cloudflare Pages（バックエンドAPI不要） |
| **データストア** | GitHub Repository（Private設定必須）/ Octokit（GitHub REST API） |
| **LLM: Pro** 🔴 | GitHub Copilot SDK（または最上位クラウドAPI） |
| **LLM: Cheap** 🟡 | Anthropic API（Claude 3.5 Haiku）/ OpenAI API（GPT-4o-mini） |
| **LLM: Free/Secure** 🟢 | Local LLM（Ollama 等の OpenAI互換API） |

### 認証・データ保持ポリシー

ユーザーのAPIキー群（GitHub PAT, LLM API Keys）はブラウザの **LocalStorage** に保存し、外部サーバーへは**一切送信しない**。

---

## 1.3 ディレクトリ構造（GitHubリポジトリ内）

```text
/
├── 🧠Brain/
│   ├── 01_Inbox/              # スマホから追加したURLや未整理メモ
│   └── 02_Projects/           # PDCA管理フォルダ
│       └── [Project_Name]/
│           ├── 01_Plan.md
│           ├── 02_Do.md
│           ├── 03_Check.md
│           ├── 04_Adjust.md
│           └── Work_Log.md    # 全作業ログ
├── 💻src/                     # AIが生成したソースコード出力先
├── schemas/                   # システムプロンプト（タイプA/B/C）
└── docs/                      # 本仕様書・引き継ぎ資料
```

---

## 1.4 コア機能

1. **モバイルUI**: カンバン（PDCA状況確認）、AIチャット（作業指示）、Inbox（URL・外部AIテキストの貼り付け）
2. **モデル動的切り替え**: UIからタスクの難易度・機密性に応じてLLM（Pro/Cheap/Free）を切り替える
3. **コンテキスト自動展開**: ユーザー入力内の `[[ファイル名]]` を検知し、GitHubから該当ファイルを自動取得してAIに読ませる
4. **プライバシー保護**: GitHubのAI学習オプトアウト設定を前提とし、機密情報はローカルLLMへルーティング
