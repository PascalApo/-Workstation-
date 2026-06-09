import { useEffect, useLayoutEffect, useRef } from 'react'
import { useCalendarDrag } from '../../context/CalendarDragContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import type { CalendarCreateSlot, CalendarEvent } from '../../types'
import { todayISO } from '../../utils/date'
import {
  WEEKDAYS_SHORT,
  getMonthGrid,
  isSameMonth,
  isWeekend,
} from '../../utils/calendar'
import { getEventsForDate } from '../../utils/calendarEvents'
import { DraggableEvent } from './DraggableEvent'
import { QuickCreatePopover } from './QuickCreatePopover'

interface MonthGridProps {
  focusDate: string
  events: CalendarEvent[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onEventClick: (event: CalendarEvent) => void
  onCreateSlot: (slot: CalendarCreateSlot) => void
  createSlot: CalendarCreateSlot | null
  onCancelCreateSlot: () => void
  onUpdateCreateSlot: (slot: CalendarCreateSlot) => void
}

export function MonthGrid({
  focusDate,
  events,
  selectedDate,
  onSelectDate,
  onEventClick,
  onCreateSlot,
  createSlot,
  onCancelCreateSlot,
  onUpdateCreateSlot,
}: MonthGridProps) {
  const weeks = getMonthGrid(focusDate)
  const today = todayISO()
  const { dropTarget, isDragging, clearZones, registerZone, setOnEventClick } =
    useCalendarDrag()
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isMobile = useIsMobile()

  useEffect(() => {
    setOnEventClick(onEventClick)
  }, [onEventClick, setOnEventClick])

  useLayoutEffect(() => {
    clearZones()
    cellRefs.current.forEach((el, date) => {
      const weekIndex = weeks.findIndex((w) => w.includes(date))
      const colIndex = weeks[weekIndex]?.indexOf(date) ?? 0
      registerZone({
        date,
        columnIndex: colIndex,
        allDay: true,
        rect: el.getBoundingClientRect(),
      })
    })
  })

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] shadow-lg">
      <div className="grid grid-cols-7 rounded-t-2xl border-b border-white/10 bg-white/5">
        {WEEKDAYS_SHORT.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div
          key={wi}
          className="grid grid-cols-7 border-b border-white/5 last:border-b-0"
        >
          {week.map((date, ci) => {
            const dayEvents = getEventsForDate(events, date)
            const inMonth = isSameMonth(date, focusDate)
            const isToday = date === today
            const isSelected = date === selectedDate
            const weekend = isWeekend(date)
            const isDrop =
              isDragging && dropTarget?.date === date && dropTarget.allDay
            const isCreating = createSlot?.date === date
            const meetings = dayEvents.filter((e) => e.type === 'meeting').length
            const tasks = dayEvents.filter((e) => e.type === 'task').length

            return (
              <div
                key={date}
                ref={(el) => {
                  if (el) cellRefs.current.set(date, el)
                  else cellRefs.current.delete(date)
                }}
                onClick={() => onSelectDate(date)}
                onDoubleClick={(e) => {
                  if (isDragging) return
                  e.stopPropagation()
                  onCreateSlot({ date })
                }}
                title="Doppelklick: Neuer Termin"
                className={`relative min-h-[84px] cursor-pointer border-r border-white/5 p-1 transition-all last:border-r-0 sm:min-h-[130px] sm:p-1.5 ${
                  isDrop
                    ? 'bg-violet-500/20 ring-2 ring-inset ring-violet-400/60'
                    : isCreating
                      ? 'bg-emerald-500/20 ring-2 ring-inset ring-emerald-400/70'
                      : isSelected
                      ? 'bg-indigo-500/15 ring-2 ring-inset ring-indigo-400/50'
                      : isToday
                        ? 'bg-amber-500/10'
                        : weekend
                          ? 'bg-black/20'
                          : 'hover:bg-white/5'
                } ${!inMonth ? 'opacity-35' : ''} ${
                  wi === weeks.length - 1
                    ? 'first:rounded-bl-2xl last:rounded-br-2xl'
                    : ''
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? 'bg-amber-500 text-slate-900'
                        : isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-300'
                    }`}
                  >
                    {parseInt(date.slice(8), 10)}
                  </span>
                  <div className="flex gap-0.5">
                    {meetings > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    )}
                    {tasks > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <DraggableEvent key={event.id} event={event} compact />
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="px-1 text-[10px] font-medium text-slate-500">
                      +{dayEvents.length - 3} weitere
                    </p>
                  )}
                  {isDrop && (
                    <p className="animate-snap-pulse px-1 text-[10px] font-medium text-violet-300">
                      Ablegen
                    </p>
                  )}
                </div>

                {isCreating && createSlot && (
                  <QuickCreatePopover
                    slot={createSlot}
                    events={events}
                    onCancel={onCancelCreateSlot}
                    onSaved={onCancelCreateSlot}
                    onSlotChange={onUpdateCreateSlot}
                    compact
                    className={
                      isMobile
                        ? 'fixed inset-x-3 bottom-24 z-50'
                        : `absolute top-0 z-50 w-72 ${
                            ci <= 4 ? 'left-full ml-1' : 'right-full mr-1'
                          }`
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
