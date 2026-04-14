# Express HTTPS 設定ガイド

## 📋 概要

Express.js に SSL/TLS 証明書を設定して、HTTPS でサービスを公開します。

---

## 🔒 ステップ1: SSL/TLS 証明書を取得

### オプションA：Let's Encrypt（無料・推奨）

```bash
# 1. Certbot をインストール
sudo apt update
sudo apt install certbot python3-certbot-standalone

# 2. 証明書を取得（ドメイン確認）
sudo certbot certonly --standalone -d lyre3.com

# 出力例:
# /etc/letsencrypt/live/lyre3.com/fullchain.pem
# /etc/letsencrypt/live/lyre3.com/privkey.pem

# 3. ファイルパスを確認
ls -la /etc/letsencrypt/live/lyre3.com/
```

### オプションB：自己署名証明書（テスト用）

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

---

## 🚀 ステップ2: Express を HTTPS 対応に修正

`server.js` を以下に置き換え：

```javascript
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const fs = require('fs')
const https = require('https')
const http = require('http')

const app = express()

// Middleware
app.use(express.json())

// CORS設定
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// OAuth コールバック
app.post('/api/oauth/callback', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' })
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({
        error: 'Failed to exchange token',
        message: tokenRes.statusText,
      })
    }

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      return res.status(400).json({
        error: tokenData.error,
        error_description: tokenData.error_description,
      })
    }

    res.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'bearer',
      scope: tokenData.scope,
    })
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    })
  }
})

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  })
})

// HTTPS + HTTP サーバー起動
const startServer = () => {
  const PORT = process.env.PORT || 3001
  const HTTPS_PORT = process.env.HTTPS_PORT || 443

  // HTTP → HTTPS リダイレクト（オプション）
  if (process.env.NODE_ENV === 'production') {
    http.createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` })
      res.end()
    }).listen(80, () => {
      console.log(`↗️  HTTP → HTTPS リダイレクト on port 80`)
    })
  }

  // HTTPS サーバー
  try {
    const cert = fs.readFileSync(process.env.HTTPS_CERT_PATH || '/etc/letsencrypt/live/lyre3.com/fullchain.pem')
    const key = fs.readFileSync(process.env.HTTPS_KEY_PATH || '/etc/letsencrypt/live/lyre3.com/privkey.pem')

    https.createServer({ cert, key }, app).listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS server running on https://localhost:${HTTPS_PORT}`)
      console.log(`📝 OAuth callback: POST https://localhost:${HTTPS_PORT}/api/oauth/callback`)
      console.log(`💚 Health check: GET https://localhost:${HTTPS_PORT}/health`)
    })
  } catch (err) {
    console.error('Failed to load certificates:', err.message)
    console.log('Falling back to HTTP...')
    
    http.createServer(app).listen(PORT, () => {
      console.log(`🌐 HTTP server running on http://localhost:${PORT}`)
    })
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})
```

---

## ⚙️ ステップ3: .env を更新

```bash
cat > .env << 'EOF'
GITHUB_CLIENT_ID=Ov23liyhaCBPaGxdAS0F
GITHUB_CLIENT_SECRET=5c87d39569cc65216b68c7a15a4ae2cb5839d994
ALLOWED_ORIGINS=https://oosawak.github.io
PORT=3001
HTTPS_PORT=443
NODE_ENV=production
HTTPS_CERT_PATH=/etc/letsencrypt/live/lyre3.com/fullchain.pem
HTTPS_KEY_PATH=/etc/letsencrypt/live/lyre3.com/privkey.pem
EOF
```

---

## 🚀 ステップ4: サーバー起動

```bash
# ポート 80, 443 を使用する場合は sudo が必要
sudo npm start

# または PM2 で起動（バックグラウンド）
sudo pm2 start server.js --name "orecopilot-oauth"
sudo pm2 save
```

---

## ✅ 動作確認

```bash
# HTTPS ヘルスチェック
curl -k https://lyre3.com/health

# OAuth callback テスト
curl -k -X POST https://lyre3.com/api/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

---

## 📝 Let's Encrypt 証明書の自動更新

```bash
# Certbot の自動更新設定
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# または cron で設定
sudo crontab -e

# 以下を追加（毎月1日 2:00 AM に更新）
0 2 1 * * certbot renew --quiet
```

---

## 🔗 OreCopilot フロントエンド側の更新

`orecopilot/.env.production` を更新：

```env
VITE_GITHUB_CLIENT_ID=Ov23liyhaCBPaGxdAS0F
VITE_OAUTH_CALLBACK_URL=https://lyre3.com/api/oauth/callback
```

GitHub Actions Secrets に登録：
```
VITE_GITHUB_CLIENT_ID = Ov23liyhaCBPaGxdAS0F
VITE_OAUTH_CALLBACK_URL = https://lyre3.com/api/oauth/callback
```

---

## ⚠️ トラブルシューティング

### ポート 80/443 が使用中

```bash
# 使用中のプロセスを確認
sudo lsof -i :80
sudo lsof -i :443

# 別のポートで起動（開発環境）
PORT=8080 HTTPS_PORT=8443 npm start
```

### 証明書エラー

```bash
# Let's Encrypt 証明書の確認
sudo certbot certificates

# 手動で更新
sudo certbot renew
```

### CORS エラー

`ALLOWED_ORIGINS` に `https://oosawak.github.io` が含まれているか確認：

```bash
echo $ALLOWED_ORIGINS
# https://oosawak.github.io が表示されるか確認
```
