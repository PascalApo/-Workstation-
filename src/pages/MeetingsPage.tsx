import { useState } from 'react'
import { DraggableMeetingCard } from '../components/dnd/DraggableMeetingCard'
import { WeekDayStrip } from '../components/dnd/WeekDayStrip'
import { MeetingActions } from '../components/MeetingActions'
import { FOLLOW_UP_LABELS, MEETING_NOTE_TEMPLATE } from '../constants/defaults'
import {
  btnPrimary,
  btnSecondary,
  card,
  emptyState,
  input,
  label,
  select,
} from '../components/ui/classes'
import { useApp } from '../context/AppContext'
import type { ActionItem, FollowUpStatus, Meeting } from '../types'
import { formatDateDE, generateId, isThisWeek, startOfWeekISO, todayISO } from '../utils/date'
import { defaultMeetingEnd } from '../utils/calendarEvents'
export function MeetingsPage() {
  const { meetings, addMeeting, updateMeeting, removeMeeting } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [participants, setParticipants] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [notes, setNotes] = useState(MEETING_NOTE_TEMPLATE)
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>('open')
  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  const sorted = [...meetings].sort((a, b) => b.date.localeCompare(a.date))
  const weekStart = startOfWeekISO()
  const meetingCounts: Record<string, number> = {}
  meetings
    .filter((m) => isThisWeek(m.date))
    .forEach((m) => {
      meetingCounts[m.date] = (meetingCounts[m.date] ?? 0) + 1
    })

  const moveMeetingToDay = async (meetingId: string, date: string) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    if (!meeting) return
    await updateMeeting({ ...meeting, date })
  }

  const resetForm = () => {
    setTitle('')
    setDate(todayISO())
    setStartTime('')
    setEndTime('')
    setParticipants('')
    setMeetingUrl('')
    setNotes(MEETING_NOTE_TEMPLATE)
    setFollowUpStatus('open')
    setActionItems([])
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (meeting: Meeting) => {
    setEditingId(meeting.id)
    setTitle(meeting.title)
    setDate(meeting.date)
    setStartTime(meeting.startTime ?? '')
    setEndTime(meeting.endTime ?? '')
    setParticipants(meeting.participants ?? '')
    setMeetingUrl(meeting.meetingUrl ?? '')
    setNotes(meeting.notes)
    setFollowUpStatus(meeting.followUpStatus)
    setActionItems(meeting.actionItems)
    setShowForm(true)
  }

  const addActionItem = () => {
    setActionItems([
      ...actionItems,
      { id: generateId(), title: '', dueDate: todayISO() },
    ])
  }

  const updateActionItem = (
    id: string,
    field: keyof ActionItem,
    value: string,
  ) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    )
  }

  const removeActionItem = (id: string) => {
    setActionItems(actionItems.filter((item) => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      participants: participants.trim() || undefined,
      meetingUrl: meetingUrl.trim() || undefined,
      notes,
      followUpStatus,
      actionItems: actionItems.filter((a) => a.title.trim()),
    }

    if (editingId) {
      const existing = meetings.find((m) => m.id === editingId)
      if (existing) {
        await updateMeeting({ ...existing, ...payload })
      }
    } else {
      await addMeeting(payload)
    }
    resetForm()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Meetings</h1>
          <p className="mt-1 text-slate-400">
            Notizen & Follow-ups · Meetings per Drag verschieben
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className={btnPrimary}
        >
          + Neues Meeting
        </button>
      </div>

      <section className={`p-4 ${card}`}>
        <p className="mb-3 text-xs text-slate-500">
          Meeting auf einen Wochentag ziehen zum Umplanen
        </p>
        <WeekDayStrip
          weekStart={weekStart}
          meetingCounts={meetingCounts}
          onDropMeetingOnDay={moveMeetingToDay}
        />
      </section>

      {showForm && (
        <form onSubmit={handleSubmit} className={`space-y-4 p-6 ${card}`}>
          <h2 className="text-lg font-semibold text-white">
            {editingId ? 'Meeting bearbeiten' : 'Neues Meeting'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Titel *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={input}
                required
              />
            </div>
            <div>
              <label className={label}>Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={input}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Von (Uhrzeit)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  if (e.target.value && !endTime) {
                    setEndTime(defaultMeetingEnd(e.target.value))
                  }
                }}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Bis (Uhrzeit)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={input}
              />
            </div>
          </div>
          <div>
            <label className={label}>Teilnehmer</label>
            <input
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className={input}
              placeholder="Namen, getrennt durch Komma"
            />
          </div>
          <div>
            <label className={label}>Meeting-Link (Video-Call)</label>
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className={input}
              placeholder="https://meet.jit.si/... oder anderer Link"
            />
          </div>
          <div>
            <label className={label}>Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={10}
              className={`${input} font-mono`}
            />
          </div>
          <div>
            <label className={label}>Follow-up Status</label>
            <select
              value={followUpStatus}
              onChange={(e) =>
                setFollowUpStatus(e.target.value as FollowUpStatus)
              }
              className={select}
            >
              {Object.entries(FOLLOW_UP_LABELS).map(([key, lbl]) => (
                <option key={key} value={key}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={label}>
                Action Items (werden zu Aufgaben)
              </label>
              <button
                type="button"
                onClick={addActionItem}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                + Action Item
              </button>
            </div>
            <div className="space-y-2">
              {actionItems.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <input
                    value={item.title}
                    onChange={(e) =>
                      updateActionItem(item.id, 'title', e.target.value)
                    }
                    placeholder="Nächster Schritt"
                    className={`flex-1 ${input}`}
                  />
                  <input
                    type="date"
                    value={item.dueDate ?? ''}
                    onChange={(e) =>
                      updateActionItem(item.id, 'dueDate', e.target.value)
                    }
                    className={input}
                  />
                  <button
                    type="button"
                    onClick={() => removeActionItem(item.id)}
                    className="px-2 text-slate-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className={btnPrimary}>
              Speichern
            </button>
            <button type="button" onClick={resetForm} className={btnSecondary}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className={emptyState}>Noch keine Meetings erfasst.</p>
        ) : (
          sorted.map((meeting) => (
            <div key={meeting.id} className={`p-5 ${card}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <DraggableMeetingCard meeting={meeting} />
                  <p className="mt-2 text-sm text-slate-400">
                    {formatDateDE(meeting.date)}
                    {meeting.participants && ` · ${meeting.participants}`}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300 ring-1 ring-white/10">
                    {FOLLOW_UP_LABELS[meeting.followUpStatus]}
                  </span>
                  {meeting.meetingUrl && (
                    <a
                      href={meeting.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-violet-400 hover:text-violet-300"
                    >
                      Meeting öffnen →
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(meeting)}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => removeMeeting(meeting.id)}
                    className="text-sm text-slate-500 hover:text-red-400"
                  >
                    Löschen
                  </button>
                </div>
              </div>
              {meeting.actionItems.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
                  {meeting.actionItems.map((item) => (
                    <li key={item.id} className="text-sm text-slate-400">
                      → {item.title}
                      {item.dueDate && ` (bis ${formatDateDE(item.dueDate)})`}
                    </li>
                  ))}
                </ul>
              )}
              {meeting.notes && (
                <pre className="mt-3 max-h-32 overflow-hidden whitespace-pre-wrap border-t border-white/10 pt-3 text-sm text-slate-500">
                  {meeting.notes.slice(0, 300)}
                  {meeting.notes.length > 300 && '...'}
                </pre>
              )}
              <div className="mt-3 border-t border-white/10 pt-3">
                <MeetingActions meeting={meeting} compact />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
