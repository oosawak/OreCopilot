# 🛠️ AI Second Brain — Know-How & Troubleshooting

開発中に役立つTips と よくある問題の解決方法をまとめました。

---

## 🌐 ngrok を使ったローカル開発での OAuth テスト

GitHub OAuth は `localhost` または公開URL のみで動作します。ローカルIP（`192.168.x.x` など）では使えません。

**ngrok** を使うと、ローカルの dev サーバーを一時的に公開URL経由でアクセス可能にできます。

### インストール

```bash
npm install -g ngrok
# または
brew install ngrok  # macOS
```

### 使用方法

**1. Dev サーバーを起動**
```bash
export PATH="/tmp/node-v22.15.0-linux-x64/bin:$PATH"
npm run dev -- --host 0.0.0.0
# ローカル: http://localhost:5173/
# ネットワーク: http://192.168.1.213:5173/
```

**2. ngrok でトンネルを作成**（別ターミナルで）
```bash
ngrok http 5173
```

出力例：
```
Session Status                online
Account                       freemium
Version                       3.3.5
Region                        ap (Asia Pacific)
Latency                       25ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://a1b2c3d4e5f6.ngrok.io -> http://localhost:5173
```

**3. ngrok の URL を GitHub OAuth App に登録**

- GitHub → Settings → Developer settings → OAuth Apps → New
- Homepage URL: `https://a1b2c3d4e5f6.ngrok.io`
- Callback URL: 同じ
- Client ID・Secret をコピー

**4. `.env.local` を更新**
```bash
cat > .env.local << 'EOF'
VITE_GITHUB_CLIENT_ID=<コピーした Client ID>
VITE_OAUTH_WORKER_URL=http://localhost:8787
EOF
```

**5. Cloudflare Worker をローカルで起動**（別ターミナルで）
```bash
cd worker
GITHUB_CLIENT_ID=<Client ID> \
GITHUB_CLIENT_SECRET=<Client Secret> \
ALLOWED_ORIGIN=https://a1b2c3d4e5f6.ngrok.io \
npx wrangler dev --local
```

**6. ブラウザで ngrok URL にアクセス**
```
https://a1b2c3d4e5f6.ngrok.io
```

「GitHubでログイン」ボタンをクリック → GitHub 認証ページへリダイレクト → OAuth フロー完了

---

## ⚠️ よくある問題

### 問題1: Dev サーバーが `localhost` でのみ起動している

**症状**: `http://192.168.1.213:5173/` にアクセスできない

**解決法**:
```bash
npm run dev -- --host 0.0.0.0
```

`--host 0.0.0.0` をつけてすべてのネットワークインターフェースでリッスン

---

### 問題2: HMR（ホットモジュールリロード）が動作しない

**症状**: ファイル編集後、ブラウザが自動リロードされない

**解決法**: `.env.local` に HMR ホスト設定を追加
```env
VITE_HMR_HOST=192.168.1.213
VITE_HMR_PORT=5173
```

または ngrok 使用時：
```env
VITE_HMR_PROTOCOL=wss
VITE_HMR_HOST=a1b2c3d4e5f6.ngrok.io
VITE_HMR_PORT=443
```

---

### 問題3: ポート 5173 が既に使われている

**症状**: `Port 5173 is in use, trying another one...` と表示されて 5174 で起動

**解決法**: 前のプロセスを終了
```bash
ps aux | grep vite
kill <PID>  # PID は上記の出力から
```

または別のポートで起動
```bash
npm run dev -- --host 0.0.0.0 --port 5175
```

---

### 問題4: CORS エラーが出ている

**症状**: ブラウザコンソールに `Access to XMLHttpRequest ... has been blocked by CORS policy`

**解決法**:
- GitHub API / OpenAI / Anthropic は CORS対応しているはず
- Local LLM（Ollama）使用時は環境変数を設定：
  ```bash
  OLLAMA_ORIGINS="https://a1b2c3d4e5f6.ngrok.io" ollama serve
  ```

---

### 問題5: GitHub OAuth callback で 404 が返される

**症状**: 「GitHubでログイン」をクリックしても GitHub ページに飛ばない

**解決法**:
1. `.env.local` の `VITE_GITHUB_CLIENT_ID` が正しいか確認
2. GitHub OAuth App の Callback URL が ngrok URL と一致しているか確認
3. Cloudflare Worker が起動しているか確認

```bash
# Worker の状態確認
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

---

## 🚀 本番環境へのデプロイ

### GitHub Pages にデプロイ

```bash
# 1. vite.config.ts に base を設定
# base: '/orecopilot/'

# 2. ビルド
npm run build

# 3. dist/ をコミット & プッシュ
git add dist/
git commit -m "deploy to gh-pages"
git push origin master

# 4. GitHub Pages をリポジトリ設定で有効化
# Settings > Pages > Branch: master, folder: / (or /dist)
```

### Vercel にデプロイ

```bash
npm install -g vercel
vercel --prod
```

環境変数設定：
- Vercel Dashboard → Project Settings → Environment Variables
- `VITE_GITHUB_CLIENT_ID`
- `VITE_OAUTH_WORKER_URL`

### Cloudflare Pages にデプロイ

```bash
npm install -g wrangler
wrangler pages deploy dist/
```

---

## 💡 開発時の便利なコマンド

```bash
# ビルドなしで型チェック
npm run typecheck

# ESLint チェック
npm run lint

# ビルドして dist を確認
npm run build
ls -lah dist/

# 本番ビルドをローカルでテスト
npm run preview

# Git コミット前のチェック
git status
npm run build
npm run typecheck
```

---

## 📝 デバッグのコツ

### ブラウザ開発者ツール

```javascript
// コンソールで localStorage 確認
console.log(localStorage.getItem('github_token'))

// OAuth state の確認
console.log(sessionStorage.getItem('oauth_state'))
```

### Dev サーバーのログを確認

```bash
# yarn/npm の出力をファイルに保存
npm run dev 2>&1 | tee dev.log

# ログを監視
tail -f dev.log
```

### Network タブで API 通信を確認

- F12 → Network タブ
- GitHub API / LLM API のリクエスト・レスポンスを確認
- CORS エラーがないか確認
