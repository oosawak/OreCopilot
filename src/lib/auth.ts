const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ''
const OAUTH_WORKER_URL = import.meta.env.VITE_OAUTH_WORKER_URL || ''
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

  // Cloudflare Worker 経由でトークン交換
  const res = await fetch(OAUTH_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!res.ok) throw new Error(`Token exchange failed: ${res.statusText}`)
  const { access_token, error } = await res.json()
  if (error) throw new Error(`GitHub OAuth error: ${error}`)

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
