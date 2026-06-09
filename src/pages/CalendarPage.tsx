import { useCallback, useMemo, useState } from 'react'
import { CalendarHeader } from '../components/calendar/CalendarHeader'
import { DayAgenda } from '../components/calendar/DayAgenda'
import { DayPlanner } from '../components/calendar/DayPlanner'
import { DragGhost } from '../components/calendar/DragGhost'
import { FlowCanvas } from '../components/calendar/FlowCanvas'
import { MobileCalendar } from '../components/calendar/MobileCalendar'
import { MonthGrid } from '../components/calendar/MonthGrid'
import { UnscheduledPanel } from '../components/calendar/UnscheduledPanel'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  CalendarDragProvider,
  type DropTarget,
} from '../context/CalendarDragContext'
import { useApp } from '../context/AppContext'
import type {
  CalendarCreateSlot,
  CalendarEvent,
  CalendarView,
} from '../types'
import { todayISO, isOverdue } from '../utils/date'
import {
  addDays,
  addMonths,
  endOfWeek,
  getDropEndTime,
  startOfWeek,
} from '../utils/calendar'
import {
  buildCalendarEvents,
  getUnscheduledTasks,
} from '../utils/calendarEvents'

function CalendarContent() {
  const { loading, tasks, meetings, updateTask, updateMeeting } = useApp()
  const isMobile = useIsMobile()
  const [view, setView] = useState<CalendarView>('flow')
  const [focusDate, setFocusDate] = useState(todayISO())
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showPlanner, setShowPlanner] = useState(true)
  const [createSlot, setCreateSlot] = useState<CalendarCreateSlot | null>(null)

  const events = useMemo(
    () => buildCalendarEvents(tasks, meetings),
    [tasks, meetings],
  )

  const unscheduled = useMemo(() => getUnscheduledTasks(tasks), [tasks])

  const stats = useMemo(() => {
    const weekStart = startOfWeek(focusDate)
    const weekEnd = endOfWeek(focusDate)
    const inWeek = events.filter(
      (e) => e.date >= weekStart && e.date <= weekEnd,
    )
    return {
      meetings: inWeek.filter((e) => e.type === 'meeting').length,
      tasks: inWeek.filter((e) => e.type === 'task' && e.status !== 'done')
        .length,
      overdue: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
    }
  }, [events, focusDate, tasks])

  const handleMove = useCallback(
    async (
      event: CalendarEvent,
      target: DropTarget,
      durationMinutes: number,
    ) => {
      if (event.type === 'task') {
        const task = tasks.find((t) => t.id === event.sourceId)
        if (!task) return
        await updateTask({
          ...task,
          dueDate: target.date,
          scheduledTime: target.allDay ? undefined : target.time,
          scheduledEndTime:
            !target.allDay && target.time
              ? getDropEndTime(target.time, durationMinutes)
              : undefined,
        })
      } else {
        const meeting = meetings.find((m) => m.id === event.sourceId)
        if (!meeting) return
        await updateMeeting({
          ...meeting,
          date: target.date,
          startTime: target.allDay ? undefined : target.time,
          endTime:
            !target.allDay && target.time
              ? getDropEndTime(target.time, durationMinutes)
              : undefined,
        })
      }
      setSelectedDate(target.date)
    },
    [tasks, meetings, updateTask, updateMeeting],
  )

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setFocusDate(date)
    setSelectedEvent(null)
    setShowPlanner(true)
  }

  const handleCreateSlot = (slot: CalendarCreateSlot) => {
    setSelectedDate(slot.date)
    setFocusDate(slot.date)
    setSelectedEvent(null)
    setCreateSlot(slot)
  }

  const handleNavigate = (direction: -1 | 1) => {
    if (view === 'month') {
      setFocusDate(addMonths(focusDate, direction))
    } else if (view === 'flow') {
      setFocusDate(addDays(focusDate, direction * 7))
    } else {
      const next = addDays(focusDate, direction)
      setFocusDate(next)
      setSelectedDate(next)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedDate(event.date)
    setShowPlanner(true)
  }

  if (loading) {
    return <p className="text-slate-500">Lade Kalender...</p>
  }

  if (isMobile) {
    return <MobileCalendar events={events} />
  }

  return (
    <CalendarDragProvider onMove={handleMove}>
      <div className="mx-auto max-w-[1600px] space-y-4">
        <CalendarHeader
          view={view}
          focusDate={focusDate}
          onViewChange={(v) => {
            setView(v)
            if (v === 'day') setSelectedDate(focusDate)
          }}
          onPrev={() => handleNavigate(-1)}
          onNext={() => handleNavigate(1)}
          onToday={() => {
            const t = todayISO()
            setFocusDate(t)
            setSelectedDate(t)
          }}
          stats={stats}
        />

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
          <span className="font-semibold text-violet-300">Drag & Drop:</span>
          <span>
            Klick auf Uhrzeit-Zeile → grüne Markierung, Eingabe daneben.
            Überschneidungen werden automatisch erkannt.
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {view === 'flow' && (
              <FlowCanvas
                focusDate={focusDate}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onCreateSlot={handleCreateSlot}
                createSlot={createSlot}
                onCancelCreateSlot={() => setCreateSlot(null)}
                onUpdateCreateSlot={setCreateSlot}
              />
            )}
            {view === 'month' && (
              <MonthGrid
                focusDate={focusDate}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onEventClick={handleEventClick}
                onCreateSlot={handleCreateSlot}
                createSlot={createSlot}
                onCancelCreateSlot={() => setCreateSlot(null)}
                onUpdateCreateSlot={setCreateSlot}
              />
            )}
            {view === 'day' && (
              <DayAgenda
                date={selectedDate}
                events={events}
                onEventClick={handleEventClick}
              />
            )}

            <UnscheduledPanel tasks={unscheduled} />
          </div>

          {showPlanner && (
            <div className="sticky top-8 h-fit">
              <DayPlanner
                date={selectedDate}
                events={events}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
                onClose={() => setShowPlanner(false)}
              />
            </div>
          )}
        </div>

        {!showPlanner && (
          <button
            type="button"
            onClick={() => setShowPlanner(true)}
            className="fixed bottom-6 right-6 rounded-full bg-violet-600 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-violet-700"
          >
            Tagesplaner öffnen
          </button>
        )}
      </div>
      <DragGhost />
    </CalendarDragProvider>
  )
}

export function CalendarPage() {
  return <CalendarContent />
}
