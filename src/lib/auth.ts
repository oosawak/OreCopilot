const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_SECRET || ''
const SCOPES = 'repo'

/** GitHub OAuth ログイン画面にリダイレクトする */
export function startGitHubLogin() {
  const state = crypto.randomUUID()
  sessionStorage.setItem('oauth_state', state)
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: SCOPES,
    state,
  })
  window.location.href = `https://github.com/login/oauth/authorize?${params}`
}

/** OAuth コールバック URL の code & state を処理してトークンを取得・保存する */
export async function handleOAuthCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const savedState = sessionStorage.getItem('oauth_state')

  if (!code || !state || state !== savedState) return false
  sessionStorage.removeItem('oauth_state')

  // 🔨 ビルド時に環境変数から Secret を注入（GitHub Actions使用）
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      state,
    }),
  })

  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.statusText}`)
  const { access_token, error, error_description } = await tokenRes.json()
  if (error) throw new Error(`GitHub OAuth error: ${error} - ${error_description}`)

  localStorage.setItem('github_token', access_token)

  // URL からクエリパラメータを除去
  window.history.replaceState({}, '', window.location.pathname)
  return true
}

/** ログイン済みかどうか */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('github_token')
}

/** ログアウト */
export function logout() {
  localStorage.removeItem('github_token')
  // Octokit インスタンスもリセット
  import('./github').then(({ resetOctokit }) => resetOctokit())
}
