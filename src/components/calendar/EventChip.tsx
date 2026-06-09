import { PRIORITY_LABELS } from '../../constants/defaults'
import type { CalendarEvent } from '../../types'
import { formatTimeRange } from '../../utils/calendar'

interface EventChipProps {
  event: CalendarEvent
  compact?: boolean
  draggable?: boolean
  onClick?: () => void
  onDragStart?: () => void
}

const taskStyles = {
  high: 'bg-red-500/90 text-white border-red-600',
  medium: 'bg-amber-500/90 text-white border-amber-600',
  low: 'bg-emerald-600/90 text-white border-emerald-700',
  done: 'bg-slate-300 text-slate-600 border-slate-400 line-through',
}

export function EventChip({
  event,
  compact = false,
  draggable = true,
  onClick,
  onDragStart,
}: EventChipProps) {
  const isMeeting = event.type === 'meeting'
  const isDone = event.status === 'done'

  const style = isMeeting
    ? 'bg-blue-600 text-white border-blue-700'
    : isDone
      ? taskStyles.done
      : taskStyles[event.priority ?? 'medium']

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/ssp-event',
      JSON.stringify({ type: event.type, id: event.sourceId }),
    )
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.()
  }

  return (
    <button
      type="button"
      draggable={draggable && !isDone}
      onDragStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={`group w-full rounded-md border px-2 text-left transition-all hover:brightness-110 hover:shadow-sm ${style} ${
        compact ? 'py-0.5 text-[11px] leading-tight' : 'py-1.5 text-xs'
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="shrink-0 opacity-80">{isMeeting ? '👥' : '✓'}</span>
        <span className="truncate font-medium">{event.title}</span>
        {event.isTop3 && (
          <span className="shrink-0 rounded bg-white/25 px-1 text-[9px]">★</span>
        )}
      </div>
      {!compact && (event.startTime || isMeeting) && (
        <p className="mt-0.5 truncate pl-4 text-[10px] opacity-80">
          {formatTimeRange(event.startTime, event.endTime)}
        </p>
      )}
      {!compact && event.type === 'task' && event.priority && !isDone && (
        <p className="mt-0.5 pl-4 text-[10px] opacity-70">
          {PRIORITY_LABELS[event.priority]}
          {event.project && ` · ${event.project}`}
        </p>
      )}
    </button>
  )
}
