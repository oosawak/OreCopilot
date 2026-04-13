import { useState, useEffect } from 'react'
import { Chat } from './components/Chat'
import { Kanban } from './components/Kanban'
import { Inbox } from './components/Inbox'
import { Settings } from './components/Settings'
import { handleOAuthCallback, isLoggedIn, startGitHubLogin } from './lib/auth'

type Tab = 'chat' | 'kanban' | 'inbox' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat', label: '💬' },
  { id: 'kanban', label: '📋' },
  { id: 'inbox', label: '📥' },
  { id: 'settings', label: '⚙️' },
]

function App() {
  const [tab, setTab] = useState<Tab>('chat')
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [oauthError, setOauthError] = useState('')

  // OAuth コールバック処理
  useEffect(() => {
    if (window.location.search.includes('code=')) {
      handleOAuthCallback()
        .then(ok => { if (ok) setLoggedIn(true) })
        .catch(e => setOauthError(e.message))
    }
  }, [])

  // 未ログイン時はログイン画面を表示
  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-slate-100 px-6">
        <div className="text-5xl mb-4">🧠</div>
        <h1 className="text-2xl font-bold mb-2">AI Second Brain</h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          GitHubリポジトリをナレッジベースとして使う、<br />完全サーバーレスのAIエージェントです。
        </p>
        {oauthError && (
          <p className="text-red-400 text-sm mb-4 text-center">{oauthError}</p>
        )}
        <button
          onClick={startGitHubLogin}
          className="flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHubでログイン
        </button>
        <p className="text-slate-600 text-xs mt-6 text-center">
          トークンはブラウザのLocalStorageにのみ保存されます。
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-slate-700">
        <span className="text-lg font-bold">🧠 Second Brain</span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'chat' && <Chat />}
        {tab === 'kanban' && <Kanban />}
        {tab === 'inbox' && <Inbox />}
        {tab === 'settings' && <Settings onLogout={() => setLoggedIn(false)} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex border-t border-slate-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xl transition-colors ${
              tab === t.id ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >{t.label}</button>
        ))}
      </nav>
    </div>
  )
}

export default App
