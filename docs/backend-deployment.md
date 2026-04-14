# OreCopilot Backend - デプロイ手順

## 📦 デプロイに必要なファイル

OreCopilotBackend フォルダから以下の **4ファイル** をサーバーにコピー：

```
package.json
package-lock.json
server.js
README.md
```

**❌ これらは持っていかない：**
- `node_modules/` (サーバーで `npm install` で再構築)
- `.env` (サーバーで新規作成)

---

## 🚀 Vercel へのデプロイ（推奨・最も簡単）

### ステップ1: Vercel CLI をインストール

```bash
npm install -g vercel
```

### ステップ2: Vercel にログイン

```bash
vercel login
```

### ステップ3: デプロイ

```bash
cd /path/to/OreCopilotBackend
vercel --prod
```

出力例：
```
✓ Production: https://orecopilot-backend.vercel.app
```

### ステップ4: 環境変数を設定

Vercel Dashboard → Project Settings → Environment Variables：

```
GITHUB_CLIENT_ID = Ov23liyhaCBPaGxdAS0F
GITHUB_CLIENT_SECRET = 5c87d39569cc65216b68c7a15a4ae2cb5839d994
ALLOWED_ORIGINS = https://oosawak.github.io
NODE_ENV = production
```

---

## 🌐 その他のデプロイ方法

### Heroku

```bash
# 1. Heroku CLI をインストール
npm install -g heroku

# 2. Heroku にログイン
heroku login

# 3. アプリを作成
heroku create orecopilot-backend

# 4. 環境変数を設定
heroku config:set GITHUB_CLIENT_ID=Ov23liyhaCBPaGxdAS0F
heroku config:set GITHUB_CLIENT_SECRET=5c87d39569cc65216b68c7a15a4ae2cb5839d994
heroku config:set ALLOWED_ORIGINS=https://oosawak.github.io

# 5. デプロイ
git push heroku main
```

### AWS Lambda + API Gateway

```bash
# SAM CLI を使用（複雑なため省略）
# 詳細: https://aws.amazon.com/jp/builders/
```

### VPS (自社サーバー)

```bash
# 1. サーバーに SSH 接続
ssh user@your-server.com

# 2. Node.js をインストール
sudo apt update
sudo apt install nodejs npm

# 3. ファイルをコピー
scp -r package.json package-lock.json server.js user@your-server.com:/home/user/orecopilot-backend/

# 4. インストール
cd /home/user/orecopilot-backend/
npm install

# 5. .env を作成
cat > .env << 'EOF'
GITHUB_CLIENT_ID=Ov23liyhaCBPaGxdAS0F
GITHUB_CLIENT_SECRET=5c87d39569cc65216b68c7a15a4ae2cb5839d994
ALLOWED_ORIGINS=https://oosawak.github.io
PORT=3001
NODE_ENV=production
EOF

# 6. PM2 でバックグラウンド実行
npm install -g pm2
pm2 start server.js --name "orecopilot-oauth"
pm2 save
```

---

## ✅ デプロイ後の設定

### 1. OreCopilot フロントエンド側を更新

`orecopilot/.env.production` を編集：

```env
VITE_GITHUB_CLIENT_ID=Ov23liyhaCBPaGxdAS0F
VITE_OAUTH_CALLBACK_URL=https://your-backend-url.com/api/oauth/callback
```

例：
- Vercel: `https://orecopilot-backend.vercel.app/api/oauth/callback`
- Heroku: `https://orecopilot-backend.herokuapp.com/api/oauth/callback`
- VPS: `https://api.yourdomain.com/api/oauth/callback`

### 2. GitHub Actions Secrets を更新

https://github.com/oosawak/OreCopilot/settings/secrets/actions

```
VITE_GITHUB_CLIENT_ID = Ov23liyhaCBPaGxdAS0F
VITE_OAUTH_CALLBACK_URL = https://your-backend-url.com/api/oauth/callback
```

### 3. GitHub OAuth App の設定を確認

https://github.com/settings/developers → OAuth Apps → OreCopilot

**Authorization callback URL** が以下に設定されていることを確認：
```
https://oosawak.github.io/OreCopilot/
```

### 4. OreCopilot をデプロイ

```bash
cd /path/to/orecopilot
git add .env.production
git commit -m "config: update OAuth callback URL to backend"
git push origin master
```

GitHub Actions が自動実行 → GitHub Pages にデプロイ

---

## 🧪 デプロイ後のテスト

1. https://oosawak.github.io/OreCopilot/ にアクセス
2. 「GitHubでログイン」をクリック
3. GitHub 認可画面で「Authorize」をクリック
4. OreCopilot に戻ってくる ✅
5. Settings で GitHub 接続状態を確認

---

## 🔒 HTTPS 設定（本番環境必須）

バックエンドが HTTPS で通信できることを確認：

```bash
# テスト
curl -X POST https://your-backend.com/api/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'

# 応答例:
# {"error":"..."}  ← OK（エラーレスポンスが返ってくる）
```

---

## 📝 トラブルシューティング

### CORS エラー

**原因：** `ALLOWED_ORIGINS` に GitHub Pages のドメインが含まれていない

**解決：**
```env
ALLOWED_ORIGINS=https://oosawak.github.io
```

### 500 エラー

**原因：** `GITHUB_CLIENT_SECRET` が間違っている

**解決：** OAuth App の Secret を確認
```bash
https://github.com/settings/developers → OAuth Apps → OreCopilot
```

### タイムアウト

**原因：** ネットワーク遅延またはサーバーがダウン

**解決：**
```bash
# ヘルスチェック
curl https://your-backend.com/health
# レスポンス: {"status":"OK","timestamp":"2026-04-14T05:00:00.000Z"}
```

---

## 🎯 推奨構成

| 環境 | 推奨サービス | 理由 |
|---|---|---|
| **開発** | localhost:3001 | 最速 |
| **テスト** | Vercel Functions | 無料、デプロイ簡単 |
| **本番** | Vercel or Heroku | スケーラビリティ、信頼性 |
