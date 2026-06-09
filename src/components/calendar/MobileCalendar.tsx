import { useMemo, useRef, useState } from 'react'
import type {
  CalendarCreateSlot,
  CalendarEvent,
} from '../../types'
import { todayISO } from '../../utils/date'
import {
  MONTHS,
  WEEKDAYS_SHORT,
  addMonths,
  formatTimeRange,
  getMonthGrid,
  isSameMonth,
  parseISO,
} from '../../utils/calendar'
import { getEventsForDate } from '../../utils/calendarEvents'
import { IcsImportButton } from './IcsImportButton'
import { QuickCreatePopover } from './QuickCreatePopover'

interface MobileCalendarProps {
  events: CalendarEvent[]
}

/**
 * Mobile Kalender-Ansicht im Stil des iOS-Kalenders:
 * fixiertes Monatsraster ohne horizontales Scrollen,
 * darunter die Tagesliste des ausgewählten Tags.
 */
export function MobileCalendar({ events }: MobileCalendarProps) {
  const today = todayISO()
  const [focusDate, setFocusDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)
  const [createSlot, setCreateSlot] = useState<CalendarCreateSlot | null>(null)
  const touchStartX = useRef<number | null>(null)

  const weeks = useMemo(() => getMonthGrid(focusDate), [focusDate])
  const monthLabel = `${MONTHS[parseISO(focusDate).getMonth()]} ${parseISO(focusDate).getFullYear()}`

  const dayEvents = useMemo(
    () =>
      [...getEventsForDate(events, selectedDate)].sort((a, b) =>
        (a.startTime ?? '00:00').localeCompare(b.startTime ?? '00:00'),
      ),
    [events, selectedDate],
  )

  const goMonth = (dir: -1 | 1) => setFocusDate(addMonths(focusDate, dir))

  const selectDay = (date: string) => {
    setSelectedDate(date)
    if (!isSameMonth(date, focusDate)) setFocusDate(date)
  }

  const openCreate = () =>
    setCreateSlot({
      date: selectedDate,
      startTime: '09:00',
      endTime: '10:00',
    })

  return (
    <div className="space-y-3">
      {/* Kopfzeile: Monat + Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{monthLabel}</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-indigo-300 active:bg-white/10"
            aria-label="Voriger Monat"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              setFocusDate(today)
              setSelectedDate(today)
            }}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-indigo-300 active:bg-white/10"
          >
            Heute
          </button>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-indigo-300 active:bg-white/10"
            aria-label="Nächster Monat"
          >
            ›
          </button>
        </div>
      </div>

      {/* Fixiertes Monatsraster – füllt exakt die Bildschirmbreite */}
      <div
        className="glass rounded-2xl border border-white/10 p-2"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          touchStartX.current = null
          if (Math.abs(dx) > 50) goMonth(dx < 0 ? 1 : -1)
        }}
      >
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS_SHORT.map((d) => (
            <span
              key={d}
              className="py-1 text-[11px] font-semibold uppercase text-slate-500"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((date) => {
            const inMonth = isSameMonth(date, focusDate)
            const isToday = date === today
            const isSelected = date === selectedDate
            const dots = getEventsForDate(events, date).slice(0, 3)
            return (
              <button
                key={date}
                type="button"
                onClick={() => selectDay(date)}
                className="flex h-12 flex-col items-center justify-start pt-1"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? 'bg-indigo-500 font-bold text-white'
                      : isToday
                        ? 'font-bold text-indigo-400 ring-1 ring-indigo-400/50'
                        : inMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                  }`}
                >
                  {parseISO(date).getDate()}
                </span>
                <span className="mt-0.5 flex gap-0.5">
                  {dots.map((e) => (
                    <span
                      key={e.id}
                      className={`h-1 w-1 rounded-full ${
                        e.type === 'meeting' ? 'bg-blue-400' : 'bg-emerald-400'
                      }`}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Import + Neuer Termin */}
      <div className="flex gap-2">
        <IcsImportButton
          label="⤓ Apple-Kalender importieren"
          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-300 active:bg-white/10"
        />
        <button
          type="button"
          onClick={openCreate}
          className="flex-1 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white active:bg-indigo-500"
        >
          + Neuer Termin
        </button>
      </div>

      {/* Tagesliste des ausgewählten Tags */}
      <div className="glass rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white">
          {parseISO(selectedDate).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h2>
        {dayEvents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Keine Termine.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {dayEvents.map((event) => (
              <li
                key={event.id}
                className={`flex items-start gap-3 rounded-xl border-l-4 bg-white/5 px-3 py-2.5 ${
                  event.type === 'meeting'
                    ? 'border-blue-400'
                    : event.status === 'done'
                      ? 'border-slate-600 opacity-60'
                      : 'border-emerald-400'
                }`}
              >
                <span className="w-[88px] shrink-0 pt-0.5 font-mono text-xs text-slate-400">
                  {event.startTime
                    ? formatTimeRange(event.startTime, event.endTime)
                    : 'Ganztägig'}
                </span>
                <span
                  className={`min-w-0 flex-1 text-sm font-medium ${
                    event.status === 'done'
                      ? 'text-slate-500 line-through'
                      : 'text-white'
                  }`}
                >
                  {event.title}
                  {event.project && (
                    <span className="block text-xs font-normal text-slate-500">
                      {event.project}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Eingabe als Bottom-Sheet */}
      {createSlot && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setCreateSlot(null)}
          />
          <QuickCreatePopover
            slot={createSlot}
            events={events}
            onCancel={() => setCreateSlot(null)}
            onSaved={() => setCreateSlot(null)}
            onSlotChange={setCreateSlot}
            className="fixed inset-x-3 bottom-24 z-50"
            compact
          />
        </>
      )}
    </div>
  )
}
