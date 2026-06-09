import { DraggableTaskCard } from '../dnd/DraggableTaskCard'
import { TaskDropZone } from '../dnd/TaskDropZone'
import { useApp } from '../../context/AppContext'
import type { EisenhowerQuadrant } from '../../types'
import { QUADRANT_LABELS, QUADRANT_ORDER, suggestQuadrant } from '../../utils/tasks'

const quadrantStyles: Record<EisenhowerQuadrant, string> = {
  urgent_important: 'border-rose-500/40 bg-rose-500/10',
  not_urgent_important: 'border-indigo-500/40 bg-indigo-500/10',
  urgent_not_important: 'border-amber-500/40 bg-amber-500/10',
  not_urgent_not_important: 'border-slate-500/40 bg-slate-500/10',
}

export function EisenhowerMatrix() {
  const { tasks, setQuadrant, removeTask } = useApp()
  const active = tasks.filter((t) => t.status !== 'done')

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {QUADRANT_ORDER.map((q) => {
        const qTasks = active.filter((t) => suggestQuadrant(t) === q)
        const meta = QUADRANT_LABELS[q]
        return (
          <div
            key={q}
            className={`rounded-2xl border p-4 ${quadrantStyles[q]}`}
          >
            <div className="mb-3">
              <h3 className="font-semibold text-white">{meta.title}</h3>
              <p className="text-xs text-slate-400">{meta.subtitle}</p>
              <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                {meta.action}
              </span>
            </div>
            <TaskDropZone
              onDropTask={(id) => setQuadrant(id, q)}
              hint="Aufgaben hierher ziehen"
              minHeight="min-h-[100px]"
              className="border-transparent bg-transparent p-0"
              activeClassName="border-indigo-500/50 bg-indigo-500/10"
            >
              <div className="space-y-2">
                {qTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    compact
                    showDelete
                    onDelete={removeTask}
                  />
                ))}
                {qTasks.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-600">
                    Aufgaben hierher ziehen
                  </p>
                )}
              </div>
            </TaskDropZone>
          </div>
        )
      })}
    </div>
  )
}
