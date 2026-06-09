import { PRIORITY_LABELS, RECURRENCE_LABELS } from '../constants/defaults'
import type { Task } from '../types'
import { formatDateDE, isOverdue } from '../utils/date'
import { setTaskDragData } from './dnd/taskDrag'
import { useTaskDragOptional } from './dnd/TaskDragContext'
import { PriorityBadge } from './PriorityBadge'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete?: (id: string) => void
  showProject?: boolean
  draggable?: boolean
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
  showProject = true,
  draggable = false,
}: TaskItemProps) {
  const overdue = isOverdue(task.dueDate, task.status)
  const dragCtx = useTaskDragOptional()

  return (
    <div
      draggable={draggable && task.status !== 'done'}
      onDragStart={
        draggable
          ? (e) => {
              setTaskDragData(e, task.id)
              dragCtx?.setDraggingTask(task)
            }
          : undefined
      }
      onDragEnd={
        draggable ? () => dragCtx?.setDraggingTask(null) : undefined
      }
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        task.status === 'done'
          ? 'border-white/10 bg-white/5 opacity-70'
          : overdue
            ? 'border-red-500/30 bg-red-500/10'
            : 'border-white/10 bg-white/5'
      }`}
    >
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={() => onToggle(task.id)}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-indigo-500"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}
          >
            {task.title}
          </p>
          <PriorityBadge priority={task.priority} />
          {task.isTop3 && task.top3Date && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/30">
              Top 3
            </span>
          )}
          {task.recurrence && (
            <span
              className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-sky-500/30"
              title={`Wiederholt sich: ${RECURRENCE_LABELS[task.recurrence]}`}
            >
              ↻ {RECURRENCE_LABELS[task.recurrence]}
            </span>
          )}
        </div>
        {showProject && task.project && (
          <p className="mt-1 text-sm text-slate-500">{task.project}</p>
        )}
        {task.dueDate && (
          <p
            className={`mt-1 text-sm ${overdue ? 'font-medium text-red-400' : 'text-slate-500'}`}
          >
            Fällig: {formatDateDE(task.dueDate)}
            {overdue && ' (überfällig)'}
          </p>
        )}
        {task.description && (
          <p className="mt-1 text-sm text-slate-500">{task.description}</p>
        )}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="text-sm text-slate-400 hover:text-red-600"
          title="Löschen"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function TaskPrioritySelect({
  value,
  onChange,
}: {
  value: Task['priority']
  onChange: (v: Task['priority']) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Task['priority'])}
      className="rounded-lg border border-white/15 bg-[var(--bg-elevated)] px-3 py-2 text-sm text-white"
    >
      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}
