import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  formatCountdown,
  getMinutesUntilMeeting,
  getNextMeetingToday,
} from '../integrations/meetingExport'
import { formatTimeRange } from '../utils/calendar'
import { todayISO } from '../utils/date'

export function NextMeetingWidget() {
  const { meetings } = useApp()
  const [minutes, setMinutes] = useState<number | null>(null)
  const today = todayISO()
  const next = getNextMeetingToday(meetings, today)

  useEffect(() => {
    if (!next) return
    const update = () => setMinutes(getMinutesUntilMeeting(next))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [next])

  if (!next) return null

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
            Nächstes Meeting
          </p>
          <p className="mt-1 font-semibold text-white">{next.title}</p>
          <p className="text-sm text-slate-400">
            {next.startTime && formatTimeRange(next.startTime, next.endTime)}
            {minutes !== null && (
              <span className="ml-2 text-violet-300">
                · {formatCountdown(minutes)}
              </span>
            )}
          </p>
        </div>
        {next.meetingUrl ? (
          <a
            href={next.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            Beitreten →
          </a>
        ) : (
          <span className="text-xs text-slate-500">Kein Meeting-Link</span>
        )}
      </div>
    </div>
  )
}
