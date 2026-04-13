import { useState } from 'react'
import { Chat } from './components/Chat'
import { Kanban } from './components/Kanban'
import { Inbox } from './components/Inbox'
import { Settings } from './components/Settings'

type Tab = 'chat' | 'kanban' | 'inbox' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat', label: '💬' },
  { id: 'kanban', label: '📋' },
  { id: 'inbox', label: '📥' },
  { id: 'settings', label: '⚙️' },
]

function App() {
  const [tab, setTab] = useState<Tab>('chat')

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
        {tab === 'settings' && <Settings />}
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
