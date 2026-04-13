import { useState } from 'react'
import { chat, extractJsonArray } from '../lib/llm'
import { buildIngestMessages } from '../lib/prompt'
import { applyFileOperations } from '../lib/github'

export function Inbox() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState('')
  const [savedFiles, setSavedFiles] = useState<string[]>([])

  const process = async () => {
    if (!input.trim()) return
    setStatus('processing')
    setResult('')
    setSavedFiles([])
    try {
      const messages = await buildIngestMessages(input.trim())
      const raw = await chat(messages)
      const ops = extractJsonArray(raw)
      await applyFileOperations(ops)
      setSavedFiles(ops.map(o => o.path))
      setResult(`✅ ${ops.length}件のファイルに整理・保存しました。`)
      setStatus('done')
      setInput('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setResult(`❌ エラー: ${msg}`)
      setStatus('error')
    }
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold text-slate-100 mb-4">📥 Inbox</h2>
      <p className="text-slate-400 text-sm mb-4">
        URLのスクレイピング結果、NotebookLMの出力、外部AIの回答など、未整理のテキストを貼り付けてください。<br />
        AIが自動で構造化し、適切なプロジェクトフォルダに保存します。
      </p>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="未整理のテキストをここに貼り付け..."
        className="flex-1 min-h-[200px] bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
      />

      <button
        onClick={process}
        disabled={!input.trim() || status === 'processing'}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded px-4 py-3 text-sm font-medium w-full"
      >
        {status === 'processing' ? '🔄 処理中...' : '🧠 AIに整理させる'}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded text-sm ${status === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
          {result}
          {savedFiles.length > 0 && (
            <ul className="mt-2 space-y-1">
              {savedFiles.map(f => <li key={f} className="text-xs text-slate-300">📄 {f}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
