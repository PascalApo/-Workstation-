import { PRIORITY_LABELS } from '../../constants/defaults'
import { useCalendarDrag } from '../../context/CalendarDragContext'
import type { CalendarEvent } from '../../types'
import { formatTimeRange } from '../../utils/calendar'

interface DraggableEventProps {
  event: CalendarEvent
  compact?: boolean
  style?: React.CSSProperties
  className?: string
}

const taskGradients = {
  high: 'from-rose-500 to-red-600 shadow-rose-500/30',
  medium: 'from-amber-400 to-orange-500 shadow-amber-500/30',
  low: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
  done: 'from-slate-300 to-slate-400 shadow-slate-400/20',
}

export function DraggableEvent({
  event,
  compact = false,
  style,
  className = '',
}: DraggableEventProps) {
  const { startDrag, session, justDroppedId, onEventClick, isDragging } =
    useCalendarDrag()
  const isMeeting = event.type === 'meeting'
  const isDone = event.status === 'done'
  const isThisDragging = session?.event.id === event.id
  const justDropped = justDroppedId === event.id

  const gradient = isMeeting
    ? 'from-blue-500 to-indigo-600 shadow-blue-500/35'
    : isDone
      ? taskGradients.done
      : taskGradients[event.priority ?? 'medium']

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={(e) => startDrag(event, e)}
      onClick={(e) => {
        if (isDragging) return
        e.stopPropagation()
        onEventClick(event)
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      style={style}
      className={`group touch-none select-none rounded-xl border border-white/20 bg-gradient-to-br px-2.5 text-left text-white shadow-lg transition-all duration-200 ${gradient} ${
        compact ? 'py-1 text-[11px]' : 'py-2 text-xs'
      } ${isThisDragging ? 'scale-95 opacity-30' : 'hover:scale-[1.02] hover:shadow-xl'} ${
        justDropped ? 'animate-drop-flash' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20 text-[9px] ${
            compact ? 'hidden' : ''
          }`}
        >
          ⋮⋮
        </span>
        <span className="shrink-0 opacity-90">{isMeeting ? '◆' : '●'}</span>
        <span
          className={`truncate font-semibold ${isDone ? 'line-through opacity-70' : ''}`}
        >
          {event.title}
        </span>
        {event.isTop3 && (
          <span className="shrink-0 text-[10px] text-yellow-200">★</span>
        )}
      </div>
      {!compact && event.startTime && (
        <p className="mt-0.5 truncate pl-5 text-[10px] font-medium text-white/75">
          {formatTimeRange(event.startTime, event.endTime)}
        </p>
      )}
      {!compact && event.type === 'task' && event.priority && !isDone && (
        <p className="mt-0.5 truncate pl-5 text-[10px] text-white/60">
          {PRIORITY_LABELS[event.priority]}
        </p>
      )}
    </div>
  )
}
