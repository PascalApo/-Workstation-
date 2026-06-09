import { useEffect, useRef, useState } from 'react'
import { MEETING_NOTE_TEMPLATE } from '../../constants/defaults'
import { useApp } from '../../context/AppContext'
import type { CalendarCreateSlot, CalendarEvent } from '../../types'
import { formatDateDE } from '../../utils/date'
import {
  HOUR_END,
  HOUR_START,
  WEEKDAYS_LONG,
  findNextFreeTime,
  formatTimeRange,
  getDropEndTime,
  getEventDurationMinutes,
  getTimeConflicts,
  minutesToTime,
  parseISO,
  timeToMinutes,
} from '../../utils/calendar'
import { btnPrimary, input } from '../ui/classes'

type CreateType = 'meeting' | 'task'

const DURATIONS = [30, 60, 90, 120] as const
const QUICK_TIMES = ['09:00', '10:00', '14:00', '16:00'] as const

interface QuickCreatePopoverProps {
  slot: CalendarCreateSlot
  events: CalendarEvent[]
  onCancel: () => void
  onSaved: () => void
  onSlotChange: (slot: CalendarCreateSlot) => void
  className?: string
  style?: React.CSSProperties
  compact?: boolean
}

export function QuickCreatePopover({
  slot,
  events,
  onCancel,
  onSaved,
  onSlotChange,
  className = '',
  style,
  compact = false,
}: QuickCreatePopoverProps) {
  const { addMeeting, addTask } = useApp()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CreateType>('meeting')
  const inputRef = useRef<HTMLInputElement>(null)

  const timed = Boolean(slot.startTime)
  const startTime = slot.startTime ?? '09:00'
  const duration = timed
    ? getEventDurationMinutes(slot.startTime, slot.endTime)
    : 60
  const endTime = getDropEndTime(startTime, duration)
  const weekday = WEEKDAYS_LONG[(parseISO(slot.date).getDay() + 6) % 7]

  const conflicts = timed
    ? getTimeConflicts(events, slot.date, startTime, endTime)
    : []
  const nextFree =
    conflicts.length > 0
      ? findNextFreeTime(events, slot.date, startTime, duration)
      : null

  const setStart = (t: string) =>
    onSlotChange({
      date: slot.date,
      startTime: t,
      endTime: getDropEndTime(t, duration),
    })

  const setDuration = (d: number) =>
    onSlotChange({
      date: slot.date,
      startTime,
      endTime: getDropEndTime(startTime, d),
    })

  const shiftStart = (delta: number) => {
    const mins = Math.min(
      Math.max(timeToMinutes(startTime) + delta, HOUR_START * 60),
      HOUR_END * 60 - duration,
    )
    setStart(minutesToTime(mins))
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [slot.date, slot.startTime])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (type === 'meeting') {
      await addMeeting({
        title: title.trim(),
        date: slot.date,
        startTime: timed ? startTime : undefined,
        endTime: timed ? endTime : undefined,
        notes: MEETING_NOTE_TEMPLATE,
        followUpStatus: 'open',
        actionItems: [],
      })
    } else {
      await addTask({
        title: title.trim(),
        priority: 'medium',
        dueDate: slot.date,
        scheduledTime: timed ? startTime : undefined,
        scheduledEndTime: timed ? endTime : undefined,
        workflowStatus: 'open',
      })
    }
    onSaved()
  }

  const pill = 'rounded-lg px-2 py-1 text-xs font-medium transition-colors'
  const pillActive = 'bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/60'
  const pillIdle = 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'

  return (
    <form
      onSubmit={handleSubmit}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`rounded-xl border border-emerald-400/50 bg-slate-900/95 p-3 shadow-2xl shadow-emerald-500/20 backdrop-blur-md ${compact ? 'text-xs' : ''} ${className}`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Neuer Eintrag
          </p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {weekday}, {formatDateDE(slot.date)}
          </p>
          <p className="text-lg font-extrabold leading-tight text-emerald-300">
            {timed ? formatTimeRange(startTime, endTime) : 'Ganztägig'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-1.5 py-0.5 text-sm text-white/40 hover:bg-white/10 hover:text-white"
          aria-label="Abbrechen"
        >
          ✕
        </button>
      </div>

      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`${input} mb-2`}
        placeholder="Titel eingeben…"
        required
      />

      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setType('meeting')}
          className={`${pill} flex-1 ${type === 'meeting' ? pillActive : pillIdle}`}
        >
          ◆ Termin
        </button>
        <button
          type="button"
          onClick={() => setType('task')}
          className={`${pill} flex-1 ${type === 'task' ? pillActive : pillIdle}`}
        >
          ● Aufgabe
        </button>
      </div>

      {!timed && (
        <div className="mb-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Uhrzeit festlegen?
          </p>
          <div className="flex flex-wrap gap-1">
            <button type="button" className={`${pill} ${pillActive}`}>
              Ganztag
            </button>
            {QUICK_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setStart(t)}
                className={`${pill} ${pillIdle}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {timed && (
        <>
          <div className="mb-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftStart(-15)}
              className={`${pill} ${pillIdle}`}
              title="15 Minuten früher"
            >
              −15
            </button>
            <span className="flex-1 text-center text-sm font-bold text-white">
              {startTime} Uhr
            </span>
            <button
              type="button"
              onClick={() => shiftStart(15)}
              className={`${pill} ${pillIdle}`}
              title="15 Minuten später"
            >
              +15
            </button>
          </div>
          <div className="mb-2 flex gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`${pill} flex-1 ${duration === d ? pillActive : pillIdle}`}
              >
                {d}′
              </button>
            ))}
          </div>
        </>
      )}

      {conflicts.length > 0 && (
        <div className="mb-2 rounded-lg border border-amber-400/40 bg-amber-500/15 p-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300">
            ⚠ Überschneidung
          </p>
          {conflicts.slice(0, 3).map((c) => (
            <p key={c.id} className="mt-0.5 truncate text-[11px] text-amber-100">
              {c.title} · {formatTimeRange(c.startTime, c.endTime)}
            </p>
          ))}
          {conflicts.length > 3 && (
            <p className="mt-0.5 text-[10px] text-amber-200/70">
              +{conflicts.length - 3} weitere
            </p>
          )}
          {nextFree && (
            <button
              type="button"
              onClick={() => setStart(nextFree)}
              className="mt-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30"
            >
              → Frei ab {nextFree} Uhr
            </button>
          )}
        </div>
      )}

      <button type="submit" className={`w-full ${btnPrimary}`}>
        Speichern
      </button>
      <p className="mt-1.5 text-center text-[10px] text-white/35">
        Enter speichert · Esc bricht ab
      </p>
    </form>
  )
}
