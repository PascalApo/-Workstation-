import { useApp } from '../../context/AppContext'
import type { WorkflowStatus } from '../../types'
import { WORKFLOW_LABELS } from '../../utils/tasks'
import { TaskDropZone } from './TaskDropZone'

const statuses: { key: WorkflowStatus; color: string }[] = [
  { key: 'inbox', color: 'border-amber-500/30 bg-amber-500/5' },
  { key: 'open', color: 'border-blue-500/30 bg-blue-500/5' },
  { key: 'in_progress', color: 'border-violet-500/30 bg-violet-500/5' },
  { key: 'done', color: 'border-emerald-500/30 bg-emerald-500/5' },
]

export function WorkflowStrip() {
  const { setWorkflow } = useApp()

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-4">
      <p className="mb-3 text-xs text-slate-500">
        Aufgaben hierher ziehen, um den Status zu ändern
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statuses.map((s) => (
          <TaskDropZone
            key={s.key}
            label={WORKFLOW_LABELS[s.key]}
            hint="Ziehen"
            minHeight="min-h-[56px]"
            className={`p-2 ${s.color}`}
            onDropTask={(id) => setWorkflow(id, s.key)}
          />
        ))}
      </div>
    </div>
  )
}
