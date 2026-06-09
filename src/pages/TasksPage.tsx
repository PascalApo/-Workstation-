import { useState } from 'react'
import { WorkflowStrip } from '../components/dnd/WorkflowStrip'
import { DraggableTaskCard } from '../components/dnd/DraggableTaskCard'
import { WeekDayStrip } from '../components/dnd/WeekDayStrip'
import { TaskItem, TaskPrioritySelect } from '../components/TaskItem'
import {
  btnPrimary,
  btnTab,
  btnTabActive,
  card,
  emptyState,
  input,
  label,
} from '../components/ui/classes'
import { useApp } from '../context/AppContext'
import type { Priority, Task } from '../types'
import { isOverdue, isThisWeek, isToday, startOfWeekISO, todayISO } from '../utils/date'
import { defaultMeetingEnd } from '../utils/calendarEvents'

type Filter = 'all' | 'today' | 'week' | 'overdue' | 'done'

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'today', label: 'Heute' },
  { key: 'week', label: 'Diese Woche' },
  { key: 'overdue', label: 'Überfällig' },
  { key: 'done', label: 'Erledigt' },
]

export function TasksPage() {
  const { tasks, addTask, toggleTaskDone, removeTask, updateTask } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState(todayISO())
  const [scheduledTime, setScheduledTime] = useState('')

  const filtered = tasks
    .filter((task) => {
      switch (filter) {
        case 'today':
          return task.status === 'open' && (isToday(task.dueDate) || !task.dueDate)
        case 'week':
          return task.status === 'open' && task.dueDate && isThisWeek(task.dueDate)
        case 'overdue':
          return isOverdue(task.dueDate, task.status)
        case 'done':
          return task.status === 'done'
        default:
          return task.status === 'open'
      }
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      return a.createdAt.localeCompare(b.createdAt)
    })

  const weekStart = startOfWeekISO()
  const taskCounts: Record<string, number> = {}
  tasks
    .filter((t) => t.status === 'open' && t.dueDate && isThisWeek(t.dueDate))
    .forEach((t) => {
      if (t.dueDate) taskCounts[t.dueDate] = (taskCounts[t.dueDate] ?? 0) + 1
    })

  const moveToDay = async (taskId: string, date: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    await updateTask({ ...task, dueDate: date, workflowStatus: 'open' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await addTask({
      title: title.trim(),
      project: project.trim() || undefined,
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      scheduledTime: scheduledTime || undefined,
      scheduledEndTime: scheduledTime
        ? defaultMeetingEnd(scheduledTime)
        : undefined,
      workflowStatus: 'open',
    })
    setTitle('')
    setProject('')
    setDescription('')
    setPriority('medium')
    setDueDate(todayISO())
    setScheduledTime('')
    setShowForm(false)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Aufgaben</h1>
          <p className="mt-1 text-slate-400">
            {filtered.length} Aufgabe{filtered.length !== 1 ? 'n' : ''} · Drag & Drop
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={btnPrimary}>
          {showForm ? 'Abbrechen' : '+ Neue Aufgabe'}
        </button>
      </div>

      <WorkflowStrip />

      <section className={`p-4 ${card}`}>
        <p className="mb-3 text-xs text-slate-500">
          Aufgaben auf einen Wochentag ziehen
        </p>
        <WeekDayStrip
          weekStart={weekStart}
          taskCounts={taskCounts}
          onDropTaskOnDay={moveToDay}
        />
      </section>

      {showForm && (
        <form onSubmit={handleSubmit} className={`space-y-4 p-6 ${card}`}>
          <div>
            <label className={label}>Titel *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={input}
              placeholder="Was muss erledigt werden?"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Projekt / Kunde</label>
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className={input}
                placeholder="z.B. Projektname"
              />
            </div>
            <div>
              <label className={label}>Fälligkeit</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={input}
              />
            </div>
          </div>
          <div>
            <label className={label}>Uhrzeit im Kalender (optional)</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className={`${input} sm:max-w-xs`}
            />
          </div>
          <div>
            <label className={label}>Priorität</label>
            <TaskPrioritySelect value={priority} onChange={setPriority} />
          </div>
          <div>
            <label className={label}>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={input}
            />
          </div>
          <button type="submit" className={btnPrimary}>
            Aufgabe speichern
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? btnTabActive : btnTab}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className={emptyState}>Keine Aufgaben in diesem Filter.</p>
        ) : filter === 'done' ? (
          filtered.map((task: Task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTaskDone}
              onDelete={removeTask}
            />
          ))
        ) : (
          filtered.map((task: Task) => (
            <div key={task.id} className="flex items-center gap-2">
              <div className="flex-1">
                <DraggableTaskCard task={task} />
              </div>
              <button
                type="button"
                onClick={() => toggleTaskDone(task.id)}
                className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-400 hover:text-emerald-400"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="shrink-0 text-xs text-slate-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
