import type { CalendarEvent } from '../../types'
import { todayISO } from '../../utils/date'
import {
  HOUR_END,
  HOUR_HEIGHT,
  HOUR_START,
  WEEKDAYS_SHORT,
  getWeekDays,
  isWeekend,
  timeToMinutes,
} from '../../utils/calendar'
import { getEventsForDate } from '../../utils/calendarEvents'
import { EventChip } from './EventChip'

interface WeekGridProps {
  focusDate: string
  events: CalendarEvent[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onDrop: (date: string, payload: string, time?: string) => void
  onEventClick: (event: CalendarEvent) => void
}

export function WeekGrid({
  focusDate,
  events,
  selectedDate,
  onSelectDate,
  onDrop,
  onEventClick,
}: WeekGridProps) {
  const days = getWeekDays(focusDate)
  const today = todayISO()
  const hours = Array.from(
    { length: HOUR_END - HOUR_START },
    (_, i) => HOUR_START + i,
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (
    e: React.DragEvent,
    date: string,
    hour?: number,
  ) => {
    e.preventDefault()
    const payload =
      e.dataTransfer.getData('application/ssp-event') ||
      e.dataTransfer.getData('application/ssp-task')
    if (payload) {
      const time = hour !== undefined ? `${String(hour).padStart(2, '0')}:00` : undefined
      onDrop(date, payload, time)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200">
        <div />
        {days.map((date, i) => {
          const isToday = date === today
          const isSelected = date === selectedDate
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`border-l border-slate-100 px-2 py-3 text-center transition-colors ${
                isSelected
                  ? 'bg-blue-50'
                  : isToday
                    ? 'bg-amber-50'
                    : isWeekend(date)
                      ? 'bg-slate-50'
                      : ''
              }`}
            >
              <p className="text-xs font-medium text-slate-500">{WEEKDAYS_SHORT[i]}</p>
              <p
                className={`mt-1 text-lg font-bold ${
                  isToday ? 'text-blue-600' : 'text-slate-900'
                }`}
              >
                {parseInt(date.slice(8), 10)}
              </p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50/80">
        <div className="px-2 py-2 text-[10px] font-medium text-slate-400">Tag</div>
        {days.map((date) => {
          const allDay = getEventsForDate(events, date).filter((e) => !e.startTime)
          return (
            <div
              key={`allday-${date}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
              className="min-h-[48px] space-y-0.5 border-l border-slate-100 p-1"
            >
              {allDay.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  compact
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          )
        })}
      </div>

      <div className="relative max-h-[600px] overflow-y-auto">
        <div
          className="grid grid-cols-[56px_repeat(7,1fr)]"
          style={{ height: (HOUR_END - HOUR_START) * HOUR_HEIGHT }}
        >
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 text-[10px] text-slate-400"
                style={{
                  top: (hour - HOUR_START) * HOUR_HEIGHT - 6,
                }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((date) => {
            const timed = getEventsForDate(events, date).filter((e) => e.startTime)
            return (
              <div
                key={`grid-${date}`}
                className="relative border-l border-slate-100"
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date, hour)}
                    className="absolute w-full border-t border-slate-50"
                    style={{
                      top: (hour - HOUR_START) * HOUR_HEIGHT,
                      height: HOUR_HEIGHT,
                    }}
                  />
                ))}

                {timed.map((event) => {
                  const start = timeToMinutes(event.startTime)
                  const end = timeToMinutes(event.endTime) || start + 60
                  const top = ((start - HOUR_START * 60) / 60) * HOUR_HEIGHT
                  const height = Math.max(
                    ((end - start) / 60) * HOUR_HEIGHT,
                    28,
                  )
                  if (start < HOUR_START * 60) return null

                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 z-10"
                      style={{ top, height }}
                    >
                      <EventChip
                        event={event}
                        onClick={() => onEventClick(event)}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
