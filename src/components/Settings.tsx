import { useState } from 'react'
import { resetOctokit } from '../lib/github'
import { logout } from '../lib/auth'

const LLM_MODES = [
  { value: 'pro', label: '🔴 Pro (最高性能)', color: 'text-red-400' },
  { value: 'cheap', label: '🟡 Cheap (バランス)', color: 'text-yellow-400' },
  { value: 'free', label: '🟢 Free / Local (プライベート)', color: 'text-green-400' },
]

function Field({ label, storageKey, type = 'text', placeholder }: {
  label: string; storageKey: string; type?: string; placeholder?: string
}) {
  const [val, setVal] = useState(() => localStorage.getItem(storageKey) || '')
  const save = (v: string) => { setVal(v); localStorage.setItem(storageKey, v) }
  return (
    <div className="mb-3">
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={val}
        onChange={e => save(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}

export function Settings({ onLogout }: { onLogout?: () => void }) {
  const [mode, setMode] = useState<string>(() => localStorage.getItem('llm_mode') || 'cheap')
  const handleMode = (v: string) => { setMode(v); localStorage.setItem('llm_mode', v) }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-slate-100 mb-6">⚙️ 設定</h2>

      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">GitHub</h3>
        <div className="bg-green-900/40 border border-green-700 rounded px-3 py-2 text-sm text-green-300 mb-3">
          ✅ GitHubログイン済み（OAuthトークン使用中）
        </div>
        <Field label="Owner (ユーザー名 or Org)" storageKey="github_owner" placeholder="username" />
        <Field label="Repository名" storageKey="github_repo" placeholder="my-second-brain" />
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { resetOctokit(); alert('接続リセットしました') }}
            className="text-xs text-slate-400 underline"
          >接続をリセット</button>
          <button
            onClick={() => { logout(); onLogout?.() }}
            className="text-xs text-red-400 underline"
          >ログアウト</button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">LLMモード</h3>
        <div className="flex gap-2 mb-4">
          {LLM_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => handleMode(m.value)}
              className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                mode === m.value ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >{m.label}</button>
          ))}
        </div>

        {mode === 'pro' && (
          <div>
            <Field label="Pro API Base URL" storageKey="pro_base_url" placeholder="https://api.openai.com/v1" />
            <Field label="Pro API Key" storageKey="pro_key" type="password" />
            <Field label="モデル名" storageKey="pro_model" placeholder="gpt-4o" />
          </div>
        )}
        {mode === 'cheap' && (
          <div>
            <Field label="Anthropic API Key (Claude)" storageKey="anthropic_key" type="password" placeholder="sk-ant-..." />
            <Field label="OpenAI API Key (GPT-4o-mini)" storageKey="cheap_key" type="password" placeholder="sk-..." />
            <Field label="Provider (anthropic / openai)" storageKey="cheap_provider" placeholder="anthropic" />
          </div>
        )}
        {mode === 'free' && (
          <div>
            <Field label="Local LLM Base URL" storageKey="local_base_url" placeholder="http://localhost:11434/v1" />
            <Field label="モデル名" storageKey="local_model" placeholder="llama3" />
            <p className="text-xs text-slate-500 mt-2">
              Ollama使用時は <code className="bg-slate-700 px-1 rounded">OLLAMA_ORIGINS="*"</code> で起動してください。
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
