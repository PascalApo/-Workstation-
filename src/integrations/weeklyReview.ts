import { FOLLOW_UP_LABELS } from '../constants/defaults'
import type { Meeting, Task, WeeklyGoal } from '../types'
import { formatDateDE, startOfWeekISO } from '../utils/date'

export function formatWeeklyReview(
  tasks: Task[],
  meetings: Meeting[],
  weeklyGoals: WeeklyGoal[],
  weekStart = startOfWeekISO(),
): string {
  const weekEnd = new Date(weekStart + 'T12:00:00')
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndISO = weekEnd.toISOString().slice(0, 10)

  const weekTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEndISO,
  )
  const doneTasks = weekTasks.filter((t) => t.status === 'done')
  const openTasks = weekTasks.filter((t) => t.status === 'open')
  const weekMeetings = meetings.filter(
    (m) => m.date >= weekStart && m.date <= weekEndISO,
  )
  const openFollowUps = weekMeetings.filter((m) => m.followUpStatus === 'open')
  const goals = weeklyGoals.filter((g) => g.weekStart === weekStart)
  const doneGoals = goals.filter((g) => g.done)

  let text = `📊 Wochen-Review (${formatDateDE(weekStart)} – ${formatDateDE(weekEndISO)})\n\n`

  text += `🎯 Wochenziele (${doneGoals.length}/${goals.length}):\n`
  if (goals.length === 0) {
    text += `• Keine Wochenziele gesetzt\n`
  } else {
    goals.forEach((g) => {
      text += `${g.done ? '✓' : '○'} ${g.title}\n`
    })
  }
  text += '\n'

  text += `✅ Aufgaben: ${doneTasks.length} erledigt, ${openTasks.length} offen\n`
  if (openTasks.length > 0) {
    openTasks.slice(0, 8).forEach((t) => {
      text += `• ${t.title}${t.dueDate ? ` (${formatDateDE(t.dueDate)})` : ''}\n`
    })
    if (openTasks.length > 8) text += `• … +${openTasks.length - 8} weitere\n`
  }
  text += '\n'

  text += `👥 Meetings: ${weekMeetings.length}\n`
  if (openFollowUps.length > 0) {
    text += `Offene Follow-ups (${openFollowUps.length}):\n`
    openFollowUps.forEach((m) => {
      text += `• ${m.title} (${formatDateDE(m.date)}) – ${FOLLOW_UP_LABELS[m.followUpStatus]}\n`
    })
  }

  const top3Done = tasks.filter(
    (t) =>
      t.status === 'done' &&
      t.isTop3 &&
      t.top3Date &&
      t.top3Date >= weekStart &&
      t.top3Date <= weekEndISO,
  )
  text += `\n⭐ Top-3 erledigt diese Woche: ${top3Done.length}\n`

  return text.trim()
}

export function printWeeklyReview(
  tasks: Task[],
  meetings: Meeting[],
  weeklyGoals: WeeklyGoal[],
) {
  const content = formatWeeklyReview(tasks, meetings, weeklyGoals)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><head><title>Wochen-Review</title>
    <style>body{font-family:system-ui;padding:2rem;max-width:700px;line-height:1.6}
    pre{white-space:pre-wrap}</style></head>
    <body><pre>${content.replace(/</g, '&lt;')}</pre>
    <script>window.print();</script></body></html>
  `)
  win.document.close()
}
