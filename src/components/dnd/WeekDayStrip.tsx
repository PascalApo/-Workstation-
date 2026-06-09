import { getWeekDayLabels, startOfWeekISO } from '../../utils/date'
import { TaskDropZone } from './TaskDropZone'

interface WeekDayStripProps {
  weekStart?: string
  onDropTaskOnDay?: (taskId: string, date: string) => void
  onDropMeetingOnDay?: (meetingId: string, date: string) => void
  taskCounts?: Record<string, number>
  meetingCounts?: Record<string, number>
}

export function WeekDayStrip({
  weekStart = startOfWeekISO(),
  onDropTaskOnDay,
  onDropMeetingOnDay,
  taskCounts = {},
  meetingCounts = {},
}: WeekDayStripProps) {
  const labels = getWeekDayLabels(weekStart)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="grid grid-cols-7 gap-2">
      {labels.map((label, i) => {
        const date = dates[i]
        const tasks = taskCounts[date] ?? 0
        const meetings = meetingCounts[date] ?? 0
        return (
          <TaskDropZone
            key={date}
            label={label}
            hint="·"
            minHeight="min-h-[64px]"
            className="p-2 text-center"
            onDropTask={
              onDropTaskOnDay
                ? (id) => onDropTaskOnDay(id, date)
                : undefined
            }
            onDropMeeting={
              onDropMeetingOnDay
                ? (id) => onDropMeetingOnDay(id, date)
                : undefined
            }
          >
            {(tasks > 0 || meetings > 0) && (
              <div className="text-[10px] text-slate-500">
                {tasks > 0 && <span>{tasks} Aufg.</span>}
                {meetings > 0 && (
                  <span className={tasks > 0 ? ' ml-1' : ''}>
                    {meetings} Meet.
                  </span>
                )}
              </div>
            )}
          </TaskDropZone>
        )
      })}
    </div>
  )
}
