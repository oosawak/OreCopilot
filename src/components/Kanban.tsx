import { useState, useEffect } from 'react'
import { listDirectory, getFileContent } from '../lib/github'

interface Project {
  name: string
  phases: Record<string, boolean>
}

const PHASE_FILES = ['01_Plan.md', '02_Do.md', '03_Check.md', '04_Adjust.md']
const PHASE_LABELS: Record<string, string> = {
  '01_Plan.md': 'Plan', '02_Do.md': 'Do', '03_Check.md': 'Check', '04_Adjust.md': 'Adjust',
}
const PHASE_COLORS: Record<string, string> = {
  '01_Plan.md': 'bg-blue-500', '02_Do.md': 'bg-yellow-500', '03_Check.md': 'bg-green-500', '04_Adjust.md': 'bg-orange-500',
}

export function Kanban() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<{ project: string; file: string } | null>(null)
  const [fileContent, setFileContent] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const entries = await listDirectory('🧠Brain/02_Projects')
      const projectNames = entries.map(e => e.split('/').pop()!).filter(Boolean)
      const projectData = await Promise.all(
        projectNames.map(async (name) => {
          const phases: Record<string, boolean> = {}
          await Promise.all(PHASE_FILES.map(async f => {
            try {
              await getFileContent(`🧠Brain/02_Projects/${name}/${f}`)
              phases[f] = true
            } catch { phases[f] = false }
          }))
          return { name, phases }
        })
      )
      setProjects(projectData)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const openFile = async (project: string, file: string) => {
    setSelected({ project, file })
    try {
      const { content } = await getFileContent(`🧠Brain/02_Projects/${project}/${file}`)
      setFileContent(content)
    } catch {
      setFileContent('（ファイルがまだ存在しません）')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-100">📋 プロジェクト PDCA</h2>
        <button onClick={load} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-3 py-1">
          🔄 更新
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      {loading && <p className="text-slate-400 text-sm">読み込み中...</p>}

      <div className="space-y-4">
        {projects.map(proj => (
          <div key={proj.name} className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-slate-200 mb-3">{proj.name}</h3>
            <div className="grid grid-cols-4 gap-2">
              {PHASE_FILES.map(f => (
                <button
                  key={f}
                  onClick={() => openFile(proj.name, f)}
                  className={`rounded p-2 text-xs font-medium text-white transition-opacity ${
                    PHASE_COLORS[f]
                  } ${proj.phases[f] ? 'opacity-100' : 'opacity-30'}`}
                >
                  {PHASE_LABELS[f]}
                  <span className="block text-xs mt-0.5">{proj.phases[f] ? '✓' : '—'}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {!loading && projects.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">
            プロジェクトがありません。AIチャットで作成してください。
          </p>
        )}
      </div>

      {/* File viewer modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 w-full max-h-[80vh] overflow-y-auto rounded-t-xl p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-200">{selected.project} / {selected.file}</h4>
              <button onClick={() => setSelected(null)} className="text-slate-400 text-lg">✕</button>
            </div>
            <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono">{fileContent}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
