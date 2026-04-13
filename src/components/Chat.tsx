import { useState, useRef, useEffect } from 'react'
import { chat, extractJsonArray, type LlmMode } from '../lib/llm'
import { buildMessages } from '../lib/prompt'
import { applyFileOperations } from '../lib/github'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  files?: string[]
}

const PERSONAS = [
  { value: '', label: 'デフォルト' },
  { value: 'persona-ios.md', label: '🍎 iOSエンジニア' },
  { value: 'persona-marketer.md', label: '📈 マーケター' },
]

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [persona, setPersona] = useState('')
  const [mode, setMode] = useState<LlmMode>(() => (localStorage.getItem('llm_mode') as LlmMode) || 'cheap')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const apiMessages = await buildMessages(userMsg, persona || undefined)
      const raw = await chat(apiMessages, mode)
      let files: string[] = []
      let displayContent = raw
      try {
        const ops = extractJsonArray(raw)
        await applyFileOperations(ops)
        files = ops.map(o => o.path)
        displayContent = `✅ ${ops.length}件のファイルをGitHubに保存しました。`
      } catch {
        // not JSON output — show as-is
      }
      setMessages(prev => [...prev, { role: 'assistant', content: displayContent, files }])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ エラー: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex gap-2 p-2 border-b border-slate-700 flex-wrap">
        <select
          value={persona}
          onChange={e => setPersona(e.target.value)}
          className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1"
        >
          {PERSONAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          value={mode}
          onChange={e => { const v = e.target.value as LlmMode; setMode(v); localStorage.setItem('llm_mode', v) }}
          className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1"
        >
          <option value="pro">🔴 Pro</option>
          <option value="cheap">🟡 Cheap</option>
          <option value="free">🟢 Free/Local</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">
            AIエージェントに指示してください。<br />
            <code className="text-xs">[[ファイル名]]</code> でファイルを参照できます。
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-100'
            }`}>
              {m.content}
              {m.files && m.files.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-400">
                  {m.files.map(f => <div key={f}>📄 {f}</div>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-300 rounded-lg px-4 py-3 text-sm animate-pulse">
              考え中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="指示を入力… (Shift+Enter で改行)"
          rows={2}
          className="flex-1 bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded px-4 py-2 text-sm font-medium"
        >送信</button>
      </div>
    </div>
  )
}
