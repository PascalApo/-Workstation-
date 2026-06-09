import type { Meeting, Task, WeeklyGoal } from '../types'
import { formatDateLongDE, todayISO } from '../utils/date'
import { formatWeeklyReview } from './weeklyReview'
import { formatDayPlan } from './clipboard'
import { formatMeetingFollowUp } from './meetingExport'

export function formatDayPlanMarkdown(
  tasks: Task[],
  meetings: Meeting[],
  date = todayISO(),
): string {
  const plain = formatDayPlan(tasks, meetings, date)
  const lines = [`# Tagesplan ${formatDateLongDE(date)}`, '']
  for (const line of plain.split('\n').slice(1)) {
    if (line.endsWith(':') && !line.startsWith('•')) {
      lines.push(`## ${line.replace(':', '')}`)
    } else if (line.startsWith('•')) {
      lines.push(`- ${line.slice(2)}`)
    } else if (/^\d+\./.test(line)) {
      lines.push(line)
    } else if (line.trim()) {
      lines.push(line)
    }
  }
  return lines.join('\n')
}

export function formatWeeklyReviewMarkdown(
  tasks: Task[],
  meetings: Meeting[],
  goals: WeeklyGoal[],
): string {
  const plain = formatWeeklyReview(tasks, meetings, goals)
  return `# Wochen-Review\n\n\`\`\`\n${plain}\n\`\`\``
}

export function formatMeetingMarkdown(meeting: Meeting): string {
  const text = formatMeetingFollowUp(meeting)
  return `# Follow-up: ${meeting.title}\n\n${text.split('\n').map((l) => (l ? `- ${l}` : '')).join('\n')}`
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
