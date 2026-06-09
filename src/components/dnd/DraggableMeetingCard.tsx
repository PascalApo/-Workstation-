import type { Meeting } from '../../types'
import { formatTimeRange } from '../../utils/calendar'
import { setMeetingDragData } from './taskDrag'
import { useTaskDragOptional } from './TaskDragContext'

interface DraggableMeetingCardProps {
  meeting: Meeting
  compact?: boolean
}

export function DraggableMeetingCard({
  meeting,
  compact = false,
}: DraggableMeetingCardProps) {
  const dragCtx = useTaskDragOptional()

  const onDragStart = (e: React.DragEvent) => {
    setMeetingDragData(e, meeting.id)
    dragCtx?.setDraggingMeeting(meeting)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4'
    }
  }

  const onDragEnd = (e: React.DragEvent) => {
    dragCtx?.setDraggingMeeting(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab rounded-xl border border-white/10 bg-[var(--bg-elevated)] active:cursor-grabbing hover:border-violet-500/40 ${
        compact ? 'px-2 py-1.5' : 'p-3'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-slate-600 select-none">⋮⋮</span>
        <div className="min-w-0">
          <p className={`truncate font-medium text-white ${compact ? 'text-xs' : 'text-sm'}`}>
            {meeting.title}
          </p>
          {meeting.startTime && (
            <p className="text-[10px] text-slate-500">
              {formatTimeRange(meeting.startTime, meeting.endTime)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
