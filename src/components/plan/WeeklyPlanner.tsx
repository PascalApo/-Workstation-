import { useState } from 'react'
import { DraggableTaskCard } from '../dnd/DraggableTaskCard'
import { TaskDropZone } from '../dnd/TaskDropZone'
import { useApp } from '../../context/AppContext'
import { formatDateDE, getWeekDayLabels, isThisWeek, startOfWeekISO } from '../../utils/date'
export function WeeklyPlanner() {
  const {
    tasks,
    weeklyGoals,
    addWeeklyGoal,
    toggleWeeklyGoal,
    removeWeeklyGoal,
    updateTask,
    removeTask,
  } = useApp()
  const weekStart = startOfWeekISO()
  const [goalText, setGoalText] = useState('')

  const weekGoals = weeklyGoals.filter((g) => g.weekStart === weekStart)
  const weekTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && isThisWeek(t.dueDate),
  )
  const unscheduled = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.workflowStatus !== 'inbox' &&
      (!t.dueDate || !isThisWeek(t.dueDate)),
  )
  const dayLabels = getWeekDayLabels(weekStart)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalText.trim() || weekGoals.length >= 3) return
    await addWeeklyGoal(goalText)
    setGoalText('')
  }

  const moveTaskToDay = async (taskId: string, date: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    await updateTask({ ...task, dueDate: date, workflowStatus: 'open' })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <h3 className="font-semibold text-white">Wochenziele (max. 3)</h3>
        <p className="mt-1 text-sm text-slate-400">
          Was muss diese Woche unbedingt passieren?
        </p>
        <form onSubmit={handleAddGoal} className="mt-4 flex gap-2">
          <input
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            disabled={weekGoals.length >= 3}
            placeholder="z.B. Projekt-X Konzept fertigstellen"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={weekGoals.length >= 3}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            +
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {weekGoals.map((goal) => (
            <li
              key={goal.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--bg-elevated)] px-4 py-3"
            >
              <input
                type="checkbox"
                checked={goal.done}
                onChange={() => toggleWeeklyGoal(goal.id)}
                className="h-4 w-4 rounded border-white/20"
              />
              <span
                className={`flex-1 text-sm ${goal.done ? 'text-slate-500 line-through' : 'text-white'}`}
              >
                {goal.title}
              </span>
              <button
                type="button"
                onClick={() => removeWeeklyGoal(goal.id)}
                className="text-xs text-slate-600 hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      {unscheduled.length > 0 && (
        <section className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="font-semibold text-amber-200">
            Ungeplant ({unscheduled.length})
          </h3>
          <p className="mt-1 text-xs text-amber-200/70">
            Ziehe Aufgaben auf einen Wochentag
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.slice(0, 12).map((t) => (
              <DraggableTaskCard
                key={t.id}
                task={t}
                compact
                showDelete
                onDelete={removeTask}
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-5">
        <h3 className="font-semibold text-white">
          Wochenplan – Drag & Drop ({weekTasks.length})
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Aufgaben zwischen Tagen verschieben
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {dayLabels.map((label, i) => {
            const date = weekDates[i]
            const dayTasks = weekTasks.filter((t) => t.dueDate === date)
            return (
              <TaskDropZone
                key={date}
                label={label}
                hint="Frei"
                minHeight="min-h-[140px]"
                className="bg-[var(--bg-elevated)] p-2"
                onDropTask={(id) => moveTaskToDay(id, date)}
              >
                <div className="space-y-1.5">
                  {dayTasks.map((t) => (
                    <DraggableTaskCard
                      key={t.id}
                      task={t}
                      compact
                      showGrip={false}
                      showDelete
                      onDelete={removeTask}
                    />
                  ))}
                </div>
              </TaskDropZone>
            )
          })}
        </div>
        {weekTasks.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Woche: {formatDateDE(weekStart)} – {formatDateDE(weekDates[6])}
          </p>
        )}
      </section>
    </div>
  )
}
