/**
 * Cloudflare Worker: GitHub OAuth token exchange
 *
 * 環境変数（Cloudflare Dashboard > Worker > Settings > Variables で設定）:
 *   GITHUB_CLIENT_ID     : GitHub OAuth AppのClient ID
 *   GITHUB_CLIENT_SECRET : GitHub OAuth AppのClient Secret
 *   ALLOWED_ORIGIN       : PWAのURL (例: https://yourname.github.io)
 */

const CORS_HEADERS = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*'
    const allowed = env.ALLOWED_ORIGIN || '*'

    // CORS プリフライト
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS(allowed) })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    let code
    try {
      const body = await request.json()
      code = body.code
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(allowed) },
      })
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(allowed) },
      })
    }

    // GitHub にトークン交換リクエスト
    const ghRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const data = await ghRes.json()

    // エラーレスポンス（GitHub が error フィールドを返す場合）
    if (data.error) {
      return new Response(JSON.stringify(data), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(allowed) },
      })
    }

    return new Response(JSON.stringify({ access_token: data.access_token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(allowed) },
    })
  },
}
