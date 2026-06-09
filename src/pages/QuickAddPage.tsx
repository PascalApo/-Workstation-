import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MEETING_NOTE_TEMPLATE } from '../constants/defaults'
import { useApp } from '../context/AppContext'
import { defaultMeetingEnd } from '../utils/calendarEvents'
import { todayISO } from '../utils/date'

type Status = 'saving' | 'done' | 'error'

/** Nimmt Quick-Add-Aufrufe der Chrome-Erweiterung entgegen (/quickadd?title=...). */
export function QuickAddPage() {
  const { addTask, addMeeting, loading } = useApp()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<Status>('saving')
  const [savedTitle, setSavedTitle] = useState('')
  const [savedKind, setSavedKind] = useState<'task' | 'meeting'>('task')
  const ranRef = useRef(false)

  useEffect(() => {
    if (loading || ranRef.current) return
    ranRef.current = true

    const title = params.get('title')?.trim()
    if (!title) {
      setStatus('error')
      return
    }
    const type = params.get('type') === 'meeting' ? 'meeting' : 'task'
    const date = params.get('date') || undefined
    const time = params.get('time') || undefined
    const notes = params.get('notes')?.trim() || undefined

    const save = async () => {
      if (type === 'meeting') {
        await addMeeting({
          title,
          date: date ?? todayISO(),
          startTime: time,
          endTime: time ? defaultMeetingEnd(time) : undefined,
          notes: notes ? `${notes}\n\n${MEETING_NOTE_TEMPLATE}` : MEETING_NOTE_TEMPLATE,
          followUpStatus: 'open',
          actionItems: [],
        })
      } else {
        // Ohne Datum → Eingang (Inbox) zur späteren Planung
        await addTask({
          title,
          priority: 'medium',
          dueDate: date,
          scheduledTime: time,
          scheduledEndTime: time ? defaultMeetingEnd(time) : undefined,
          description: notes,
          workflowStatus: date || time ? 'open' : 'inbox',
        })
      }
      setSavedTitle(title)
      setSavedKind(type)
      setStatus('done')
    }
    save().catch(() => setStatus('error'))
  }, [loading, params, addTask, addMeeting])

  return (
    <div className="mx-auto mt-12 max-w-md animate-fade-in">
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-8 text-center shadow-xl">
        {status === 'saving' && (
          <>
            <p className="text-3xl">⏳</p>
            <h1 className="mt-3 text-lg font-bold text-white">Speichere …</h1>
          </>
        )}
        {status === 'done' && (
          <>
            <p className="text-3xl">✅</p>
            <h1 className="mt-3 text-lg font-bold text-white">
              {savedKind === 'meeting' ? 'Termin' : 'Aufgabe'} gespeichert
            </h1>
            <p className="mt-1 truncate text-sm text-slate-400">{savedTitle}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-3xl">⚠️</p>
            <h1 className="mt-3 text-lg font-bold text-white">
              Nichts zu speichern
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Kein Titel übergeben – bitte über die Erweiterung erneut senden.
            </p>
          </>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/kalender"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Zum Kalender
          </Link>
          <Link
            to="/planen"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Planungs-Hub
          </Link>
        </div>
      </div>
    </div>
  )
}
