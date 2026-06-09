import { useState } from 'react'
import { DraggableTaskCard } from '../dnd/DraggableTaskCard'
import { TaskDropZone } from '../dnd/TaskDropZone'
import { useApp } from '../../context/AppContext'
import { todayISO, startOfWeekISO } from '../../utils/date'

export function InboxProcessor() {
  const { tasks, processInboxItem, removeTask } = useApp()
  const inbox = tasks.filter((t) => t.workflowStatus === 'inbox')
  const [editing, setEditing] = useState<string | null>(null)
  const [project, setProject] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())

  if (inbox.length === 0) return null

  const process = async (id: string, date?: string) => {
    await processInboxItem(id, {
      project: project.trim() || undefined,
      dueDate: date ?? dueDate,
      workflowStatus: 'open',
    })
    setEditing(null)
    setProject('')
    setDueDate(todayISO())
  }

  const quickDrop = async (taskId: string, type: 'today' | 'week' | 'open') => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    if (type === 'open') {
      await processInboxItem(taskId, { workflowStatus: 'open' })
    } else if (type === 'today') {
      await processInboxItem(taskId, {
        dueDate: todayISO(),
        workflowStatus: 'open',
      })
    } else {
      await processInboxItem(taskId, {
        dueDate: startOfWeekISO(),
        workflowStatus: 'open',
      })
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <h3 className="font-semibold text-amber-200">
        Eingang verarbeiten ({inbox.length})
      </h3>
      <p className="mt-1 text-sm text-amber-200/70">
        Ziehe Einträge auf eine Schnell-Zone oder bearbeite einzeln
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <TaskDropZone
          label="Heute"
          hint="Heute planen"
          minHeight="min-h-[52px]"
          className="border-amber-500/20 p-2"
          onDropTask={(id) => quickDrop(id, 'today')}
        />
        <TaskDropZone
          label="Diese Woche"
          hint="Woche planen"
          minHeight="min-h-[52px]"
          className="border-amber-500/20 p-2"
          onDropTask={(id) => quickDrop(id, 'week')}
        />
        <TaskDropZone
          label="Offen"
          hint="Ohne Datum"
          minHeight="min-h-[52px]"
          className="border-amber-500/20 p-2"
          onDropTask={(id) => quickDrop(id, 'open')}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {inbox.map((task) => (
          <li key={task.id}>
            {editing === task.id ? (
              <div className="rounded-xl border border-white/10 bg-[var(--bg-elevated)] p-3 space-y-2">
                <p className="text-sm font-medium text-white">{task.title}</p>
                <input
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Projekt / Kunde"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white"
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => process(task.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white"
                  >
                    Einplanen
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="text-xs text-slate-500"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <DraggableTaskCard task={task} compact />
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(task.id)}
                  className="shrink-0 rounded-lg bg-indigo-600/80 px-3 py-2 text-xs text-white"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="shrink-0 text-xs text-slate-600 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
