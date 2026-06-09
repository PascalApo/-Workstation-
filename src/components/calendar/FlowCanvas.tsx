import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  FLOW_HOUR_HEIGHT,
  HOUR_END,
  HOUR_START,
  useCalendarDrag,
  getDropPreviewHeight,
} from '../../context/CalendarDragContext'
import type { CalendarEvent } from '../../types'
import { todayISO } from '../../utils/date'
import type { CalendarCreateSlot } from '../../types'
import { useIsMobile } from '../../hooks/useIsMobile'
import {
  WEEKDAYS_SHORT,
  computeEventLanes,
  formatTimeRange,
  getDropEndTime,
  getWeekDays,
  isWeekend,
  minutesToFlowY,
  minutesToTime,
  timeToMinutes,
  yToSnappedMinutes,
} from '../../utils/calendar'
import { getEventsForDate } from '../../utils/calendarEvents'
import { CreateSlotHighlight, CreateSlotRowBand } from './CreateSlotHighlight'
import { DraggableEvent } from './DraggableEvent'
import { QuickCreatePopover } from './QuickCreatePopover'

interface FlowCanvasProps {
  focusDate: string
  events: CalendarEvent[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onCreateSlot: (slot: CalendarCreateSlot) => void
  createSlot: CalendarCreateSlot | null
  onCancelCreateSlot: () => void
  onUpdateCreateSlot: (slot: CalendarCreateSlot) => void
}

export function FlowCanvas({
  focusDate,
  events,
  selectedDate,
  onSelectDate,
  onCreateSlot,
  createSlot,
  onCancelCreateSlot,
  onUpdateCreateSlot,
}: FlowCanvasProps) {
  const days = getWeekDays(focusDate)
  const today = todayISO()
  const hours = Array.from(
    { length: HOUR_END - HOUR_START },
    (_, i) => HOUR_START + i,
  )
  const totalHeight = (HOUR_END - HOUR_START) * FLOW_HOUR_HEIGHT

  const {
    dropTarget,
    isDragging,
    session,
    clearZones,
    registerZone,
    registerTimedGrid,
  } = useCalendarDrag()

  const allDayRefs = useRef<(HTMLDivElement | null)[]>([])
  const timedColRefs = useRef<(HTMLDivElement | null)[]>([])
  const timedGridRef = useRef<HTMLDivElement | null>(null)
  const hScrollRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useIsMobile()

  const updateZones = () => {
    clearZones()
    days.forEach((date, i) => {
      const allDayEl = allDayRefs.current[i]
      if (allDayEl) {
        registerZone({
          date,
          columnIndex: i,
          allDay: true,
          rect: allDayEl.getBoundingClientRect(),
        })
      }
      const timedEl = timedColRefs.current[i]
      if (timedEl) {
        registerZone({
          date,
          columnIndex: i,
          allDay: false,
          rect: timedEl.getBoundingClientRect(),
        })
      }
    })
    if (timedGridRef.current) {
      registerTimedGrid(timedGridRef.current.getBoundingClientRect())
    }
  }

  useLayoutEffect(() => {
    updateZones()
  })

  useEffect(() => {
    const onResize = () => updateZones()
    const scrollEl = timedGridRef.current?.parentElement
    const hScrollEl = hScrollRef.current
    window.addEventListener('resize', onResize)
    scrollEl?.addEventListener('scroll', onResize)
    hScrollEl?.addEventListener('scroll', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      scrollEl?.removeEventListener('scroll', onResize)
      hScrollEl?.removeEventListener('scroll', onResize)
    }
  }, [focusDate])

  // Beim ersten Öffnen zur aktuellen Zeit (heute) bzw. 08:00 scrollen
  useEffect(() => {
    const scrollEl = timedGridRef.current?.parentElement
    if (!scrollEl) return
    const current = new Date()
    const currentMin = current.getHours() * 60 + current.getMinutes()
    const inRange =
      currentMin >= HOUR_START * 60 && currentMin < HOUR_END * 60
    const target = minutesToFlowY(inRange ? currentMin : 8 * 60)
    scrollEl.scrollTop = Math.max(0, target - 140)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const showNowLine =
    days.includes(today) &&
    nowMinutes >= HOUR_START * 60 &&
    nowMinutes < HOUR_END * 60
  const nowTop = minutesToFlowY(nowMinutes)
  const snapDuration = session?.durationMinutes ?? 60
  const createHour =
    createSlot?.startTime != null
      ? Math.floor(timeToMinutes(createSlot.startTime) / 60)
      : null
  const createColIndex = createSlot ? days.indexOf(createSlot.date) : -1

  // Popover links oder rechts neben der markierten Spalte, nie darüber
  const POPOVER_WIDTH = 280
  const popoverLeft = (colIndex: number) =>
    colIndex <= 3
      ? `calc(52px + ${colIndex + 1} * ((100% - 52px) / 7) + 6px)`
      : `calc(52px + ${colIndex} * ((100% - 52px) / 7) - ${POPOVER_WIDTH + 6}px)`

  // Markierten Slot automatisch in den sichtbaren Bereich scrollen
  useEffect(() => {
    if (!createSlot?.startTime) return
    const scrollEl = timedGridRef.current?.parentElement
    if (!scrollEl) return
    const slotTop = minutesToFlowY(timeToMinutes(createSlot.startTime))
    const viewTop = scrollEl.scrollTop
    const viewBottom = viewTop + scrollEl.clientHeight
    if (slotTop < viewTop + 24 || slotTop > viewBottom - 160) {
      scrollEl.scrollTo({ top: Math.max(0, slotTop - 120), behavior: 'smooth' })
    }
  }, [createSlot?.startTime, createSlot?.date])

  return (
    <div className="flow-canvas overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 shadow-2xl">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
          Flow Canvas
        </p>
        <p className="text-sm text-white/60">
          Klick auf Uhrzeit-Zeile · grüne Markierung und Eintragung
        </p>
      </div>

      <div ref={hScrollRef} className="overflow-x-auto">
      <div className="min-w-[760px]">
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-white/10 bg-white/5">
        <div />
        {days.map((date, i) => {
          const isToday = date === today
          const isSelected = date === selectedDate
          const dayEvents = getEventsForDate(events, date)
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`border-l border-white/10 px-2 py-3 text-center transition-all ${
                isSelected
                  ? 'bg-indigo-500/30 ring-1 ring-inset ring-indigo-400/50'
                  : isToday
                    ? 'bg-amber-500/10'
                    : isWeekend(date)
                      ? 'bg-black/10'
                      : 'hover:bg-white/5'
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                {WEEKDAYS_SHORT[i]}
              </p>
              <p
                className={`mt-1 text-xl font-bold ${
                  isToday ? 'text-amber-300' : 'text-white'
                }`}
              >
                {parseInt(date.slice(8), 10)}
              </p>
              {dayEvents.length > 0 && (
                <p className="mt-0.5 text-[10px] text-indigo-300">
                  {dayEvents.length} Einträge
                </p>
              )}
            </button>
          )
        })}
      </div>

      <div className="relative grid grid-cols-[52px_repeat(7,1fr)] border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center px-2 text-[9px] font-bold uppercase tracking-wider text-white/30">
          Tag
        </div>
        {days.map((date, i) => {
          const allDay = getEventsForDate(events, date).filter(
            (e) => !e.startTime,
          )
          const isDrop =
            isDragging && dropTarget?.date === date && dropTarget.allDay
          const isCreatingAllDay =
            createSlot?.date === date && !createSlot.startTime
          return (
            <div
              key={`allday-${date}`}
              ref={(el) => {
                allDayRefs.current[i] = el
              }}
              onClick={() => {
                if (isDragging) return
                onCreateSlot({ date })
              }}
              title="Klick: Ganztägiger Termin"
              className={`relative min-h-[52px] cursor-cell space-y-1 border-l border-white/10 p-1.5 transition-all ${
                isDrop
                  ? 'bg-violet-500/25 ring-2 ring-inset ring-violet-400'
                  : isCreatingAllDay
                    ? 'bg-emerald-500/25 ring-2 ring-inset ring-emerald-400'
                    : isWeekend(date)
                      ? 'bg-black/15'
                      : ''
              }`}
            >
              {allDay.map((event) => (
                <DraggableEvent key={event.id} event={event} compact />
              ))}
              {isDrop && (
                <div className="animate-snap-pulse rounded-lg border border-dashed border-violet-300/60 px-2 py-1 text-[10px] text-violet-200">
                  Hier ablegen
                </div>
              )}
            </div>
          )
        })}

        {createSlot && !createSlot.startTime && createColIndex >= 0 && (
          <QuickCreatePopover
            slot={createSlot}
            events={events}
            onCancel={onCancelCreateSlot}
            onSaved={onCancelCreateSlot}
            onSlotChange={onUpdateCreateSlot}
            className={
              isMobile ? 'fixed inset-x-3 bottom-24 z-50' : 'absolute z-50'
            }
            style={
              isMobile
                ? undefined
                : {
                    width: POPOVER_WIDTH,
                    left: popoverLeft(createColIndex),
                    top: 'calc(100% + 4px)',
                  }
            }
          />
        )}
      </div>

      <div className="max-h-[65vh] overflow-y-auto">
        <div
          ref={timedGridRef}
          className="relative grid grid-cols-[52px_repeat(7,1fr)]"
          style={{ height: totalHeight }}
        >
          {createSlot?.startTime && (
            <CreateSlotRowBand slot={createSlot} />
          )}

          <div className="relative border-r border-white/10">
            {hours.map((hour) => {
              const isCreateHour = createHour === hour
              return (
                <div
                  key={hour}
                  role="button"
                  tabIndex={0}
                  title={`Klick: Termin um ${String(hour).padStart(2, '0')}:00`}
                  onClick={() => {
                    if (isDragging) return
                    const start = `${String(hour).padStart(2, '0')}:00`
                    onCreateSlot({
                      date: selectedDate,
                      startTime: start,
                      endTime: getDropEndTime(start, 60),
                    })
                  }}
                  className={`absolute right-0 cursor-pointer rounded-l px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    isCreateHour
                      ? 'bg-emerald-500/60 font-bold text-emerald-50 ring-2 ring-emerald-300/70'
                      : 'text-white/35 hover:bg-emerald-500/20 hover:text-emerald-100'
                  }`}
                  style={{
                    top: (hour - HOUR_START) * FLOW_HOUR_HEIGHT - 6,
                  }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              )
            })}
          </div>

          {days.map((date, colIndex) => {
            const timed = getEventsForDate(events, date).filter(
              (e) => e.startTime,
            )
            const laneMap = computeEventLanes(timed)
            const isDropCol =
              isDragging &&
              dropTarget?.date === date &&
              !dropTarget.allDay &&
              dropTarget.time
            const isColHighlight = isDragging && dropTarget?.date === date
            const isCreatingHere =
              createSlot?.date === date && Boolean(createSlot.startTime)

            return (
              <div
                key={`timed-${date}`}
                ref={(el) => {
                  timedColRefs.current[colIndex] = el
                }}
                onClick={(e) => {
                  if (isDragging) return
                  const grid = timedGridRef.current
                  if (!grid) return
                  const gridRect = grid.getBoundingClientRect()
                  const minutes = yToSnappedMinutes(e.clientY, gridRect.top)
                  const startTime = minutesToTime(minutes)
                  onCreateSlot({
                    date,
                    startTime,
                    endTime: getDropEndTime(startTime, 60),
                  })
                }}
                title="Klick: Termin zu dieser Uhrzeit"
                className={`relative cursor-cell border-l border-white/10 transition-colors ${
                  isColHighlight
                    ? 'bg-indigo-500/10'
                    : isCreatingHere
                      ? 'bg-emerald-500/5'
                      : isWeekend(date)
                        ? 'bg-black/15'
                        : ''
                }`}
              >
                {isCreatingHere && createSlot && (
                  <CreateSlotHighlight slot={createSlot} />
                )}
                {hours.map((hour) => (
                  <div key={hour}>
                    <div
                      className="absolute w-full border-t border-white/10"
                      style={{
                        top: (hour - HOUR_START) * FLOW_HOUR_HEIGHT,
                      }}
                    />
                    {[1, 2, 3].map((sub) => (
                      <div
                        key={`${hour}-${sub}`}
                        className="absolute w-full border-t border-white/[0.04]"
                        style={{
                          top:
                            (hour - HOUR_START) * FLOW_HOUR_HEIGHT +
                            sub * (FLOW_HOUR_HEIGHT / 4),
                        }}
                      />
                    ))}
                  </div>
                ))}

                {isDropCol && dropTarget.time && (
                  <div
                    className="pointer-events-none absolute left-1 right-1 z-20 animate-snap-pulse rounded-xl border-2 border-dashed border-violet-400 bg-violet-500/25 backdrop-blur-sm"
                    style={{
                      top: minutesToFlowY(timeToMinutes(dropTarget.time)),
                      height: getDropPreviewHeight(snapDuration),
                    }}
                  >
                    <p className="px-2 py-1 text-[10px] font-bold text-violet-100">
                      {formatTimeRange(
                        dropTarget.time,
                        getDropEndTime(dropTarget.time, snapDuration),
                      )}
                    </p>
                  </div>
                )}

                {showNowLine && date === today && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="h-2.5 w-2.5 -ml-1 animate-pulse rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-rose-500 to-rose-500/0" />
                  </div>
                )}

                {timed.map((event) => {
                  const start = timeToMinutes(event.startTime)
                  const end = timeToMinutes(event.endTime) || start + 60
                  const top = minutesToFlowY(start)
                  const height = Math.max(minutesToFlowY(end) - top, 28)
                  if (start < HOUR_START * 60) return null

                  // Überlappende Termine nebeneinander statt übereinander
                  const { lane, laneCount } = laneMap.get(event.id) ?? {
                    lane: 0,
                    laneCount: 1,
                  }
                  const widthPct = 100 / laneCount

                  return (
                    <div
                      key={event.id}
                      className="absolute z-10"
                      style={{
                        top,
                        height,
                        left: `calc(${lane * widthPct}% + 3px)`,
                        width: `calc(${widthPct}% - 6px)`,
                      }}
                    >
                      <DraggableEvent event={event} className="h-full" />
                    </div>
                  )
                })}
              </div>
            )
          })}

          {createSlot?.startTime && createColIndex >= 0 && (
            <QuickCreatePopover
              slot={createSlot}
              events={events}
              onCancel={onCancelCreateSlot}
              onSaved={onCancelCreateSlot}
              onSlotChange={onUpdateCreateSlot}
              className={
                isMobile ? 'fixed inset-x-3 bottom-24 z-50' : 'absolute z-50'
              }
              style={
                isMobile
                  ? undefined
                  : {
                      width: POPOVER_WIDTH,
                      left: popoverLeft(createColIndex),
                      top: Math.max(
                        4,
                        Math.min(
                          minutesToFlowY(timeToMinutes(createSlot.startTime)),
                          totalHeight - 420,
                        ),
                      ),
                    }
              }
            />
          )}
        </div>
      </div>
      </div>
      </div>
    </div>
  )
}
