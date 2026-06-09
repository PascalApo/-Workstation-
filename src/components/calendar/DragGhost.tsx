import { createPortal } from 'react-dom'
import { useCalendarDrag } from '../../context/CalendarDragContext'
import { formatTimeRange, getDropEndTime } from '../../utils/calendar'

export function DragGhost() {
  const { session, ghostPos, dropTarget } = useCalendarDrag()

  if (!session || !ghostPos) return null

  const { event, offsetX, offsetY, durationMinutes } = session
  const isMeeting = event.type === 'meeting'

  const previewTime = dropTarget?.allDay
    ? undefined
    : dropTarget?.time ?? event.startTime
  const previewEnd =
    previewTime && !dropTarget?.allDay
      ? getDropEndTime(previewTime, durationMinutes)
      : undefined

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] w-56 rounded-2xl border-2 border-white/30 bg-gradient-to-br from-violet-600 to-indigo-700 px-3 py-2.5 text-white shadow-2xl shadow-violet-500/40"
      style={{
        left: ghostPos.x - offsetX,
        top: ghostPos.y - offsetY,
        transform: 'rotate(-2deg) scale(1.06)',
      }}
    >
      <p className="truncate text-sm font-bold">{event.title}</p>
      <p className="mt-0.5 text-xs text-violet-200">
        {dropTarget
          ? dropTarget.allDay
            ? `Ganztägig · ${dropTarget.date.slice(8)}.`
            : formatTimeRange(previewTime, previewEnd)
          : 'Ziehe auf einen Tag oder eine Uhrzeit'}
      </p>
      <p className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/50">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        {isMeeting ? 'Meeting' : 'Aufgabe'}
      </p>
    </div>,
    document.body,
  )
}
