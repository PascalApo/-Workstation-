import type { CalendarCreateSlot } from '../../types'
import {
  formatTimeRange,
  getEventDurationMinutes,
  minutesToFlowY,
  timeToMinutes,
} from '../../utils/calendar'
import { getDropPreviewHeight } from '../../context/CalendarDragContext'

interface CreateSlotHighlightProps {
  slot: CalendarCreateSlot
  className?: string
}

function slotMetrics(slot: CalendarCreateSlot) {
  const duration = getEventDurationMinutes(slot.startTime, slot.endTime)
  const top = minutesToFlowY(timeToMinutes(slot.startTime!))
  const height = getDropPreviewHeight(duration)
  return { top, height, duration }
}

/** Volle Zeilenmarkierung über alle Tage */
export function CreateSlotRowBand({ slot }: CreateSlotHighlightProps) {
  if (!slot.startTime) return null
  const { top, height } = slotMetrics(slot)

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[14] border-y-2 border-emerald-400/70 bg-emerald-400/20"
      style={{ top, height }}
    />
  )
}

export function CreateSlotHighlight({ slot, className = '' }: CreateSlotHighlightProps) {
  if (!slot.startTime) return null
  const { top, height } = slotMetrics(slot)

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 z-[15] rounded-lg border-2 border-emerald-400 bg-emerald-500/40 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300/50 ${className}`}
      style={{ top, height }}
    >
      <p className="px-2 py-1 text-[10px] font-bold text-emerald-50">
        {formatTimeRange(slot.startTime, slot.endTime)}
      </p>
    </div>
  )
}
