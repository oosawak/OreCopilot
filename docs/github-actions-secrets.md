# GitHub Actions Secrets 設定ガイド

## 📋 概要

OreCopilot の GitHub Pages 自動デプロイを有効にするには、GitHub OAuth 認証情報を GitHub Actions Secrets として登録する必要があります。

---

## 🔒 登録すべき Secrets

### 1. VITE_GITHUB_CLIENT_ID
- **値**: OAuth App の Client ID
- **例**: `Ov23liyhaCBPaGxdAS0F`

### 2. VITE_GITHUB_CLIENT_SECRET
- **値**: OAuth App の Client Secret
- **例**: `5c87d39569cc65216b68c...` (セキュアな秘密鍵)
- ⚠️ **絶対に public にしないこと**

---

## 📝 登録手順

### ステップ 1: GitHub Actions Secrets ページを開く

```
https://github.com/oosawak/OreCopilot/settings/secrets/actions
```

または：
1. GitHub リポジトリ → **Settings**
2. 左メニュー → **Secrets and variables** → **Actions**

### ステップ 2: New repository secret をクリック

緑の「New repository secret」ボタンをクリック

### ステップ 3: VITE_GITHUB_CLIENT_ID を登録

```
Name:  VITE_GITHUB_CLIENT_ID
Value: Ov23liyhaCBPaGxdAS0F
```

→ **Add secret** をクリック

### ステップ 4: VITE_GITHUB_CLIENT_SECRET を登録

```
Name:  VITE_GITHUB_CLIENT_SECRET
Value: 5c87d39569cc65216b68c7a15a4ae2cb5839d994
```

→ **Add secret** をクリック

---

## ✅ 確認

登録後、再度 https://github.com/oosawak/OreCopilot/actions を開いて、以下の操作でテストデプロイしてください：

```bash
# ローカルで空コミットを作成
git commit --allow-empty -m "test: trigger GitHub Actions"
git push origin master
```

## 🚀 デプロイの流れ

```
git push origin master
         ↓
GitHub Actions 自動実行
         ↓
VITE_GITHUB_CLIENT_ID と VITE_GITHUB_CLIENT_SECRET をビルド環境変数に注入
         ↓
npm run build (Vite がビルド)
         ↓
peaceiris/actions-gh-pages が dist/ を gh-pages ブランチにプッシュ
         ↓
GitHub Pages が自動デプロイ
         ↓
https://oosawak.github.io/OreCopilot/ で利用可能 ✅
```

---

## ⚠️ セキュリティ上の注意

- **Secret は絶対にコードにコミットしない**（.gitignore で除外済み）
- **GitHub Actions UI で登録された Secret は、再度表示できない**
- Secret が漏洩した場合は、OAuth App を削除して新規作成してください
- 本番環境では、さらに安全なバックエンド認証（Cloudflare Worker など）を使用推奨

---

## 🔄 OAuth App を変更・削除する場合

1. https://github.com/settings/developers → OAuth Apps
2. 削除したいアプリをクリック → **Delete application**
3. 新しい OAuth App を作成してクライアント ID・Secret を取得
4. GitHub Actions Secrets を更新
