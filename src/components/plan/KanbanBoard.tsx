import { useState } from 'react'
import { DraggableTaskCard } from '../dnd/DraggableTaskCard'
import { TaskDropZone } from '../dnd/TaskDropZone'
import { useApp } from '../../context/AppContext'
import type { WorkflowStatus } from '../../types'
import { WORKFLOW_LABELS } from '../../utils/tasks'

const columns: { key: WorkflowStatus; color: string }[] = [
  { key: 'inbox', color: 'border-amber-500/30 bg-amber-500/5' },
  { key: 'open', color: 'border-blue-500/30 bg-blue-500/5' },
  { key: 'in_progress', color: 'border-violet-500/30 bg-violet-500/5' },
  { key: 'done', color: 'border-emerald-500/30 bg-emerald-500/5' },
]

export function KanbanBoard() {
  const { tasks, setWorkflow, removeTask, removeCompletedTasks } = useApp()
  const [activeCol, setActiveCol] = useState<WorkflowStatus | null>(null)

  const handleClearDone = async () => {
    const doneCount = tasks.filter((t) => t.workflowStatus === 'done').length
    if (doneCount === 0) return
    if (
      !confirm(
        `${doneCount} erledigte Aufgabe${doneCount !== 1 ? 'n' : ''} endgültig löschen?`,
      )
    ) {
      return
    }
    await removeCompletedTasks()
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.workflowStatus === col.key)
        return (
          <div
            key={col.key}
            className={`rounded-2xl border p-4 transition-all ${col.color} ${
              activeCol === col.key ? 'ring-2 ring-indigo-500/40' : ''
            }`}
            onDragEnter={() => setActiveCol(col.key)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setActiveCol(null)
              }
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                {WORKFLOW_LABELS[col.key]}
              </h3>
              <div className="flex items-center gap-2">
                {col.key === 'done' && colTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearDone}
                    title="Alle erledigten löschen"
                    className="rounded-lg border border-red-500/30 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
                  >
                    Aufräumen
                  </button>
                )}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                  {colTasks.length}
                </span>
              </div>
            </div>
            <TaskDropZone
              onDropTask={(id) => {
                setWorkflow(id, col.key)
                setActiveCol(null)
              }}
              hint="Karte hierher ziehen"
              minHeight="min-h-[120px]"
              className="border-transparent bg-transparent p-0"
              activeClassName="border-indigo-500/50 bg-indigo-500/10"
            >
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    showDelete
                    onDelete={removeTask}
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="py-8 text-center text-xs text-slate-600">
                    Karten hierher ziehen
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
