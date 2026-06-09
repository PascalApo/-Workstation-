import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EisenhowerMatrix } from '../components/plan/EisenhowerMatrix'
import { InboxProcessor } from '../components/plan/InboxProcessor'
import { KanbanBoard } from '../components/plan/KanbanBoard'
import { WeeklyPlanner } from '../components/plan/WeeklyPlanner'
import type { PlanTab } from '../types'

const tabs: { key: PlanTab; label: string; desc: string }[] = [
  { key: 'kanban', label: 'Kanban', desc: 'Workflow per Drag & Drop' },
  { key: 'matrix', label: 'Eisenhower', desc: 'Prioritäten-Matrix' },
  { key: 'week', label: 'Wochenplan', desc: 'Ziele & Wochenüberblick' },
]

export function PlanPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as PlanTab) || 'kanban'

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Planungs-Hub"
        subtitle="Organisiere Aufgaben mit den wichtigsten Planungs-Tools"
      />

      <InboxProcessor />

      <div className="mb-4 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
        <span className="font-semibold text-indigo-300">Drag & Drop:</span>{' '}
        Ziehe Aufgaben zwischen Spalten, Quadranten und Wochentagen. Der
        Eingang lässt sich per Schnell-Zone einplanen.
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setParams({ tab: t.key })}
            className={`rounded-xl px-4 py-2.5 text-left transition-all ${
              tab === t.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'border border-white/10 bg-[var(--bg-surface)] text-slate-400 hover:text-white'
            }`}
          >
            <span className="block text-sm font-semibold">{t.label}</span>
            <span
              className={`text-[10px] ${tab === t.key ? 'text-indigo-200' : 'text-slate-600'}`}
            >
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {tab === 'kanban' && <KanbanBoard />}
      {tab === 'matrix' && <EisenhowerMatrix />}
      {tab === 'week' && <WeeklyPlanner />}
    </div>
  )
}
