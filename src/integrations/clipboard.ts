import type { Meeting, Task } from '../types'
import { formatDateLongDE, todayISO } from '../utils/date'
import { formatTimeRange } from '../utils/calendar'

/** @deprecated Alias – use formatDayPlan */
export const formatDayPlanForTeams = formatDayPlan

export function formatDayPlan(
  tasks: Task[],
  meetings: Meeting[],
  date = todayISO(),
): string {
  const dayTasks = tasks.filter(
    (t) => t.status === 'open' && (t.dueDate === date || t.isTop3),
  )
  const top3 = dayTasks.filter((t) => t.isTop3 && t.top3Date === date)
  const dayMeetings = meetings.filter((m) => m.date === date)

  let text = `Tagesplan ${formatDateLongDE(date)}\n\n`

  if (top3.length > 0) {
    text += `Top 3:\n`
    top3.forEach((t, i) => {
      text += `${i + 1}. ${t.title}\n`
    })
    text += '\n'
  }

  if (dayMeetings.length > 0) {
    text += `Meetings:\n`
    dayMeetings.forEach((m) => {
      const time = m.startTime
        ? formatTimeRange(m.startTime, m.endTime)
        : 'Ganztägig'
      text += `• ${time} – ${m.title}`
      if (m.meetingUrl) text += ` (${m.meetingUrl})`
      text += '\n'
    })
    text += '\n'
  }

  const otherTasks = dayTasks.filter((t) => !top3.includes(t))
  if (otherTasks.length > 0) {
    text += `Aufgaben:\n`
    otherTasks.forEach((t) => {
      text += `• ${t.title}${t.project ? ` [${t.project}]` : ''}\n`
    })
  }

  return text.trim()
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function shareText(text: string, title: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return true
    } catch {
      return false
    }
  }
  return copyToClipboard(text)
}
