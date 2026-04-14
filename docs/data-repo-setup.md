# 🧠 OreCopilotData — セットアップ

このドキュメントは、**OreCopilotData リポジトリ**（データ保存用）の初期セットアップ手順です。

---

## 📋 概要

OreCopilotData は、AI Second Brain が読み書きするすべてのナレッジベース・プロジェクト情報を保存する **Private リポジトリ**です。

**重要**:
- 🔒 **Private** 設定は必須
- 📝 個人のメモ・プロジェクト計画が格納される
- 🤖 OAuth トークンで AI がアクセス・自動更新

---

## 🗂️ ディレクトリ構造

このリポジトリに以下の構造を作成してください：

```
OreCopilotData/
├── README.md
└── 🧠Brain/
    ├── 01_Inbox/
    │   └── (スマホから追加したURL・未整理メモ)
    └── 02_Projects/
        └── (プロジェクトフォルダ)
            ├── 01_Plan.md
            ├── 02_Do.md
            ├── 03_Check.md
            ├── 04_Adjust.md
            └── Work_Log.md
```

---

## 🚀 初期セットアップ

### ステップ1: ローカルに clone

```bash
git clone https://github.com/oosawak/OreCopilotData.git
cd OreCopilotData
```

### ステップ2: 初期ディレクトリを作成

```bash
mkdir -p 🧠Brain/01_Inbox
mkdir -p 🧠Brain/02_Projects

# README を作成
cat > README.md << 'EOF'
# 🧠 OreCopilot Knowledge Base

Personal knowledge & project management repository.

- Managed by AI Second Brain (https://oosawak.github.io/OreCopilot/)
- Private repository - do not share
EOF

# .gitkeep を追加（空フォルダをバージョン管理に含める）
touch 🧠Brain/01_Inbox/.gitkeep
touch 🧠Brain/02_Projects/.gitkeep
```

### ステップ3: コミット & プッシュ

```bash
git add .
git commit -m "chore: initialize OreCopilot data repository structure"
git push origin master
```

---

## 🔐 GitHub Secrets 設定

AI Second Brain （OreCopilot）から OreCopilotData にアクセスするために、**Personal Access Token** を設定します。

### PAT（Personal Access Token）を作成

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**

2. 以下を設定：
   - **Note**: `oreocopilot-ai-agent`
   - **Expiration**: 90 days（定期的に更新推奨）
   - **Scopes**: 
     - ✅ `repo` (リポジトリアクセス)

3. **Generate token** をクリック → トークンをコピー

### OreCopilot アプリで設定

OreCopilot PWA を開く → ⚙️ **Settings**：

```
GitHub
├── Owner: oosawak
├── Repository名: OreCopilotData
└── [PAT は Settings 画面では入力不要 — OAuth で自動]
```

> **注意**: 本番環境では PAT 不要です。GitHub OAuth を使用するため、Settings で入力する必要はありません。

---

## 📝 サンプルプロジェクトを作成

テスト用に、1つサンプルプロジェクトを手動で作成してみましょう：

```bash
mkdir -p 🧠Brain/02_Projects/Sample_Project

cat > 🧠Brain/02_Projects/Sample_Project/01_Plan.md << 'EOF'
# Plan: Sample Project

## 目標
テストプロジェクトで AI Second Brain の動作を確認する。

## スケープ
- [ ] 基本的な PDCA フロー
- [ ] AI チャット機能
- [ ] Kanban 表示
EOF

cat > 🧠Brain/02_Projects/Sample_Project/Work_Log.md << 'EOF'
# Work Log

## 2026-04-14
- プロジェクト作成
EOF

git add 🧠Brain/02_Projects/Sample_Project/
git commit -m "feat: add sample project for testing"
git push
```

OreCopilot で「カンバン」タブを開くと、`Sample_Project` が表示されます。

---

## ✅ セットアップ完了チェックリスト

- [ ] OreCopilotData リポジトリを Private で作成
- [ ] `🧠Brain/01_Inbox/` ディレクトリを作成
- [ ] `🧠Brain/02_Projects/` ディレクトリを作成
- [ ] README.md を作成してコミット
- [ ] OreCopilot Settings で Owner = `oosawak`, Repository = `OreCopilotData` を設定
- [ ] 新しい PAT を作成（revoke済みの古い PAT は削除）
- [ ] サンプルプロジェクトでテスト

完了したら、OreCopilot アプリにアクセスして「GitHubでログイン」を試してください！
