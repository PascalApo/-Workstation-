import { useEffect, useLayoutEffect, useRef } from 'react'
import { useCalendarDrag } from '../../context/CalendarDragContext'
import type { CalendarEvent } from '../../types'
import { formatTimeRange } from '../../utils/calendar'
import { getEventsForDate } from '../../utils/calendarEvents'
import { card, emptyState } from '../ui/classes'
import { DraggableEvent } from './DraggableEvent'

interface DayAgendaProps {
  date: string
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function DayAgenda({ date, events, onEventClick }: DayAgendaProps) {
  const dayEvents = getEventsForDate(events, date)
  const timed = dayEvents.filter((e) => e.startTime)
  const allDay = dayEvents.filter((e) => !e.startTime)
  const meetings = dayEvents.filter((e) => e.type === 'meeting')
  const tasks = dayEvents.filter((e) => e.type === 'task')
  const openTasks = tasks.filter((t) => t.status !== 'done')

  const dropRef = useRef<HTMLDivElement>(null)
  const { dropTarget, isDragging, clearZones, registerZone, setOnEventClick } =
    useCalendarDrag()

  useEffect(() => {
    setOnEventClick(onEventClick)
  }, [onEventClick, setOnEventClick])

  useLayoutEffect(() => {
    clearZones()
    if (dropRef.current) {
      registerZone({
        date,
        columnIndex: 0,
        allDay: true,
        rect: dropRef.current.getBoundingClientRect(),
      })
    }
  })

  const isDrop = isDragging && dropTarget?.date === date

  return (
    <div
      ref={dropRef}
      className={`space-y-6 p-6 transition-all ${card} ${
        isDrop
          ? 'border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/30'
          : ''
      }`}
    >
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-blue-500/10 p-4 text-center ring-1 ring-blue-500/20">
          <p className="text-2xl font-bold text-blue-300">{meetings.length}</p>
          <p className="text-sm text-blue-400">Meetings</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-4 text-center ring-1 ring-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-300">{openTasks.length}</p>
          <p className="text-sm text-emerald-400">Offene Aufgaben</p>
        </div>
        <div className="rounded-lg bg-white/5 p-4 text-center ring-1 ring-white/10">
          <p className="text-2xl font-bold text-slate-200">{dayEvents.length}</p>
          <p className="text-sm text-slate-400">Gesamt</p>
        </div>
      </div>

      {allDay.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Ganztägig
          </h3>
          <div className="space-y-2">
            {allDay.map((event) => (
              <DraggableEvent key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {timed.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Zeitplan
          </h3>
          <div className="space-y-2">
            {timed.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="w-24 shrink-0 text-sm font-medium text-slate-400">
                  {formatTimeRange(event.startTime, event.endTime)}
                </div>
                <div className="flex-1">
                  <DraggableEvent event={event} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {dayEvents.length === 0 && (
        <div className={emptyState}>
          <p className="text-lg font-medium text-slate-400">Freier Tag</p>
          <p className="mt-1 text-sm">
            Ziehe Aufgaben aus der Inbox hierher.
          </p>
        </div>
      )}

      {isDrop && (
        <p className="animate-snap-pulse text-center text-sm font-medium text-violet-400">
          Loslassen zum Verschieben auf diesen Tag
        </p>
      )}
    </div>
  )
}
