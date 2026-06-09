import type { Task } from '../../types'
import { PriorityBadge } from '../PriorityBadge'
import { setTaskDragData } from './taskDrag'
import { useTaskDragOptional } from './TaskDragContext'

interface DraggableTaskCardProps {
  task: Task
  compact?: boolean
  showGrip?: boolean
  showDelete?: boolean
  onDelete?: (id: string) => void
  className?: string
}

export function DraggableTaskCard({
  task,
  compact = false,
  showGrip = true,
  showDelete = false,
  onDelete,
  className = '',
}: DraggableTaskCardProps) {
  const dragCtx = useTaskDragOptional()
  const isDone = task.status === 'done' || task.workflowStatus === 'done'

  const onDragStart = (e: React.DragEvent) => {
    setTaskDragData(e, task.id)
    dragCtx?.setDraggingTask(task)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4'
    }
  }

  const onDragEnd = (e: React.DragEvent) => {
    dragCtx?.setDraggingTask(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm(`„${task.title}" wirklich löschen?`)) {
      onDelete(task.id)
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab touch-none rounded-xl border border-white/10 bg-[var(--bg-elevated)] active:cursor-grabbing hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-500/10 ${
        compact ? 'p-2' : 'p-3'
      } ${isDone ? 'opacity-60' : ''} ${className}`}
    >
      <div className="flex items-start gap-2">
        {showGrip && (
          <span className="mt-0.5 shrink-0 text-slate-600 select-none">⋮⋮</span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium text-white ${compact ? 'text-xs' : 'text-sm'} ${isDone ? 'line-through' : ''}`}
          >
            {task.title}
          </p>
          {!compact && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={task.priority} />
              {task.project && (
                <span className="text-[10px] text-slate-500">{task.project}</span>
              )}
              {task.dueDate && (
                <span className="text-[10px] text-slate-500">{task.dueDate}</span>
              )}
            </div>
          )}
          {compact && task.dueDate && (
            <p className="mt-0.5 text-[10px] text-slate-500">{task.dueDate}</p>
          )}
        </div>
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            title="Aufgabe löschen"
            className={`shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-red-500/20 hover:text-red-400 ${
              isDone ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.48 0 .896.062 1.25.164V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.414c.354-.102.77-.164 1.25-.164z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
