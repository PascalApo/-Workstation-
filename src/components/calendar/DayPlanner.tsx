import { useEffect, useState } from 'react'
import { useCalendarDrag } from '../../context/CalendarDragContext'
import { FOLLOW_UP_LABELS, MEETING_NOTE_TEMPLATE } from '../../constants/defaults'
import { useApp } from '../../context/AppContext'
import type { CalendarEvent, FollowUpStatus, Priority } from '../../types'
import { formatDateLongDE } from '../../utils/date'
import { defaultMeetingEnd } from '../../utils/calendarEvents'
import { getEventsForDate } from '../../utils/calendarEvents'
import { MeetingActions } from '../MeetingActions'
import { DraggableEvent } from './DraggableEvent'
import { TaskPrioritySelect } from '../TaskItem'
import { btnPrimary, cardElevated, input, label, select } from '../ui/classes'

interface DayPlannerProps {
  date: string
  events: CalendarEvent[]
  selectedEvent: CalendarEvent | null
  onSelectEvent: (event: CalendarEvent | null) => void
  onClose: () => void
}

export function DayPlanner({
  date,
  events,
  selectedEvent,
  onSelectEvent,
  onClose,
}: DayPlannerProps) {
  const {
    tasks,
    meetings,
    addTask,
    addMeeting,
    updateMeeting,
    toggleTaskDone,
    removeTask,
    removeMeeting,
  } = useApp()
  const dayEvents = getEventsForDate(events, date)
  const { setOnEventClick } = useCalendarDrag()

  const [tab, setTab] = useState<'overview' | 'task' | 'meeting'>('overview')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState<Priority>('medium')
  const [taskTime, setTaskTime] = useState('')
  const [taskProject, setTaskProject] = useState('')

  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingTime, setMeetingTime] = useState('09:00')
  const [meetingEnd, setMeetingEnd] = useState('10:00')
  const [meetingParticipants, setMeetingParticipants] = useState('')

  useEffect(() => {
    setOnEventClick(onSelectEvent)
  }, [onSelectEvent, setOnEventClick])

  const selectedTask =
    selectedEvent?.type === 'task'
      ? tasks.find((t) => t.id === selectedEvent.sourceId)
      : null
  const selectedMeeting =
    selectedEvent?.type === 'meeting'
      ? meetings.find((m) => m.id === selectedEvent.sourceId)
      : null

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    await addTask({
      title: taskTitle.trim(),
      priority: taskPriority,
      dueDate: date,
      scheduledTime: taskTime || undefined,
      scheduledEndTime: taskTime ? defaultMeetingEnd(taskTime) : undefined,
      project: taskProject.trim() || undefined,
      workflowStatus: 'open',
    })
    setTaskTitle('')
    setTaskTime('')
    setTaskProject('')
    setTab('overview')
  }

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingTitle.trim()) return
    await addMeeting({
      title: meetingTitle.trim(),
      date,
      startTime: meetingTime,
      endTime: meetingEnd,
      participants: meetingParticipants.trim() || undefined,
      notes: MEETING_NOTE_TEMPLATE,
      followUpStatus: 'open',
      actionItems: [],
    })
    setMeetingTitle('')
    setMeetingParticipants('')
    setTab('overview')
  }

  return (
    <div className={`flex h-full flex-col ${cardElevated}`}>
      <div className="flex items-start justify-between border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">
            Tagesplaner
          </p>
          <h3 className="mt-1 font-semibold text-white">
            {formatDateLongDE(date)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex border-b border-white/10">
        {(['overview', 'task', 'meeting'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t)
              onSelectEvent(null)
            }}
            className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-indigo-500 text-indigo-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'overview'
              ? 'Übersicht'
              : t === 'task'
                ? '+ Aufgabe'
                : '+ Meeting'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            {selectedEvent && (selectedTask || selectedMeeting) ? (
              <div className="space-y-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-white">
                    {selectedEvent.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(null)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Schließen
                  </button>
                </div>

                {selectedTask && (
                  <>
                    <p className="text-sm text-slate-400">
                      {selectedTask.project && `${selectedTask.project} · `}
                      Priorität: {selectedTask.priority}
                    </p>
                    {selectedTask.description && (
                      <p className="text-sm text-slate-400">
                        {selectedTask.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTaskDone(selectedTask.id)}
                        className={btnPrimary}
                      >
                        {selectedTask.status === 'done'
                          ? 'Wieder öffnen'
                          : 'Erledigt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeTask(selectedTask.id)
                          onSelectEvent(null)
                        }}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Löschen
                      </button>
                    </div>
                  </>
                )}

                {selectedMeeting && (
                  <>
                    <p className="text-sm text-slate-400">
                      {selectedMeeting.participants}
                    </p>
                    <p className="text-sm text-slate-400">
                      Follow-up:{' '}
                      {FOLLOW_UP_LABELS[selectedMeeting.followUpStatus]}
                    </p>
                    <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-slate-500">
                      {selectedMeeting.notes}
                    </pre>
                    <div className="flex gap-2">
                      <select
                        value={selectedMeeting.followUpStatus}
                        onChange={(e) =>
                          updateMeeting({
                            ...selectedMeeting,
                            followUpStatus: e.target.value as FollowUpStatus,
                          })
                        }
                        className={select}
                      >
                        {Object.entries(FOLLOW_UP_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          removeMeeting(selectedMeeting.id)
                          onSelectEvent(null)
                        }}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400"
                      >
                        Löschen
                      </button>
                    </div>
                    <MeetingActions meeting={selectedMeeting} compact />
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Noch nichts geplant.
                  </p>
                ) : (
                  dayEvents.map((event) => (
                    <DraggableEvent key={event.id} event={event} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'task' && (
          <form onSubmit={handleAddTask} className="space-y-3">
            <div>
              <label className={label}>Aufgabe *</label>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className={input}
                placeholder="Was erledigen?"
                required
              />
            </div>
            <div>
              <label className={label}>Uhrzeit (optional)</label>
              <input
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Projekt</label>
              <input
                value={taskProject}
                onChange={(e) => setTaskProject(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Priorität</label>
              <TaskPrioritySelect value={taskPriority} onChange={setTaskPriority} />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Aufgabe einplanen
            </button>
          </form>
        )}

        {tab === 'meeting' && (
          <form onSubmit={handleAddMeeting} className="space-y-3">
            <div>
              <label className={label}>Meeting-Titel *</label>
              <input
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className={input}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label}>Von</label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => {
                    setMeetingTime(e.target.value)
                    setMeetingEnd(defaultMeetingEnd(e.target.value))
                  }}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Bis</label>
                <input
                  type="time"
                  value={meetingEnd}
                  onChange={(e) => setMeetingEnd(e.target.value)}
                  className={input}
                />
              </div>
            </div>
            <div>
              <label className={label}>Teilnehmer</label>
              <input
                value={meetingParticipants}
                onChange={(e) => setMeetingParticipants(e.target.value)}
                className={input}
              />
            </div>
            <button type="submit" className={`w-full ${btnPrimary}`}>
              Meeting einplanen
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
