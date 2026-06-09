import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const actions = [
  { id: 'home', label: 'Kommandozentrale', path: '/' },
  { id: 'focus', label: 'Fokus-Modus', path: '/fokus' },
  { id: 'plan', label: 'Planungs-Hub', path: '/planen' },
  { id: 'kanban', label: 'Kanban-Board', path: '/planen?tab=kanban' },
  { id: 'matrix', label: 'Eisenhower-Matrix', path: '/planen?tab=matrix' },
  { id: 'week', label: 'Wochenplan', path: '/planen?tab=week' },
  { id: 'calendar', label: 'Flow-Kalender', path: '/kalender' },
  { id: 'projects', label: 'Projekte', path: '/projekte' },
  { id: 'tasks', label: 'Aufgaben', path: '/aufgaben' },
  { id: 'meetings', label: 'Meetings', path: '/meetings' },
  { id: 'routine', label: 'Routine', path: '/routine' },
  { id: 'notes', label: 'Notizen', path: '/notizen' },
  { id: 'insights', label: 'Insights & Statistik', path: '/insights' },
  { id: 'export', label: 'Export & Tools', path: '/integrationen' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [captureMode, setCaptureMode] = useState(false)
  const [captureText, setCaptureText] = useState('')
  const navigate = useNavigate()
  const { quickCapture, tasks, setWorkflow } = useApp()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        setCaptureMode(false)
        setQuery('')
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const matchedTasks = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    return tasks
      .filter(
        (t) =>
          t.status === 'open' &&
          (t.title.toLowerCase().includes(q) ||
            t.project?.toLowerCase().includes(q)),
      )
      .slice(0, 8)
  }, [query, tasks])

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  )

  if (!open) return null

  const run = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captureText.trim()) return
    await quickCapture(captureText)
    setCaptureText('')
    setCaptureMode(false)
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="animate-fade-in w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg-elevated)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {captureMode ? (
          <form onSubmit={handleCapture} className="p-4">
            <p className="text-sm font-medium text-white">Quick Capture</p>
            <input
              autoFocus
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              placeholder="Gedanke erfassen..."
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            />
          </form>
        ) : (
          <>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Aufgaben, Seiten, Befehle suchen..."
              className="w-full border-b border-white/10 bg-transparent px-4 py-4 text-white placeholder:text-slate-500 focus:outline-none"
            />
            <ul className="max-h-80 overflow-y-auto py-2">
              <li>
                <button
                  type="button"
                  onClick={() => setCaptureMode(true)}
                  className="flex w-full px-4 py-2.5 text-left text-sm text-indigo-300 hover:bg-white/5"
                >
                  + Quick Capture – Gedanke erfassen
                </button>
              </li>

              {matchedTasks.length > 0 && (
                <>
                  <li className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    Aufgaben
                  </li>
                  {matchedTasks.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkflow(task.id, 'in_progress')
                          navigate('/fokus')
                          setOpen(false)
                        }}
                        className="flex w-full flex-col px-4 py-2 text-left hover:bg-white/5"
                      >
                        <span className="text-sm text-white">{task.title}</span>
                        {task.project && (
                          <span className="text-[10px] text-slate-500">
                            {task.project}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </>
              )}

              {filtered.length > 0 && (
                <>
                  <li className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    Navigation
                  </li>
                  {filtered.map((action) => (
                    <li key={action.id}>
                      <button
                        type="button"
                        onClick={() => run(action.path)}
                        className="flex w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        {action.label}
                      </button>
                    </li>
                  ))}
                </>
              )}

              {filtered.length === 0 && matchedTasks.length === 0 && query && (
                <li className="px-4 py-6 text-center text-sm text-slate-500">
                  Nichts gefunden
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
