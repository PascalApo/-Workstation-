import { useState, type ReactNode } from 'react'
import { getMeetingDragId, getTaskDragId } from './taskDrag'

interface TaskDropZoneProps {
  onDropTask?: (taskId: string) => void
  onDropMeeting?: (meetingId: string) => void
  label?: string
  hint?: string
  className?: string
  activeClassName?: string
  children?: ReactNode
  minHeight?: string
}

export function TaskDropZone({
  onDropTask,
  onDropMeeting,
  label,
  hint = 'Hierher ziehen',
  className = '',
  activeClassName = 'border-indigo-500/60 bg-indigo-500/15 ring-2 ring-indigo-500/30',
  children,
  minHeight = 'min-h-[80px]',
}: TaskDropZoneProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsOver(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    const taskId = getTaskDragId(e)
    const meetingId = getMeetingDragId(e)
    if (taskId && onDropTask) onDropTask(taskId)
    else if (meetingId && onDropMeeting) onDropMeeting(meetingId)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={() => setIsOver(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOver(false)
        }
      }}
      onDrop={handleDrop}
      className={`rounded-xl border border-dashed transition-all ${minHeight} ${
        isOver ? activeClassName : 'border-white/15 bg-white/[0.02]'
      } ${className}`}
    >
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      )}
      {children ?? (
        <p
          className={`flex h-full items-center justify-center py-4 text-center text-xs ${
            isOver ? 'font-medium text-indigo-300' : 'text-slate-600'
          }`}
        >
          {isOver ? 'Loslassen' : hint}
        </p>
      )}
    </div>
  )
}
