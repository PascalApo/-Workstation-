import { FOLLOW_UP_LABELS } from '../constants/defaults'
import type { Meeting } from '../types'
import { formatDateDE, todayISO } from '../utils/date'
import { formatTimeRange } from '../utils/calendar'

export function formatMeetingFollowUp(meeting: Meeting): string {
  const time = meeting.startTime
    ? formatTimeRange(meeting.startTime, meeting.endTime)
    : 'Ganztägig'

  let text = `Follow-up: ${meeting.title}\n`
  text += `Datum: ${formatDateDE(meeting.date)} · ${time}\n`
  if (meeting.participants) text += `Teilnehmer: ${meeting.participants}\n`
  text += `Status: ${FOLLOW_UP_LABELS[meeting.followUpStatus]}\n\n`

  if (meeting.notes.trim()) {
    text += `Notizen:\n${meeting.notes.trim()}\n\n`
  }

  const openItems = meeting.actionItems.filter((a) => a.title.trim())
  if (openItems.length > 0) {
    text += `Nächste Schritte:\n`
    openItems.forEach((item) => {
      text += `• ${item.title}`
      if (item.dueDate) text += ` (bis ${formatDateDE(item.dueDate)})`
      if (item.assignee) text += ` – ${item.assignee}`
      text += '\n'
    })
  }

  return text.trim()
}

export function formatMeetingForOneNote(meeting: Meeting): string {
  const time = meeting.startTime
    ? formatTimeRange(meeting.startTime, meeting.endTime)
    : 'Ganztägig'

  let html = `<h1>${escapeHtml(meeting.title)}</h1>`
  html += `<p><b>Datum:</b> ${formatDateDE(meeting.date)} · ${time}</p>`
  if (meeting.participants) {
    html += `<p><b>Teilnehmer:</b> ${escapeHtml(meeting.participants)}</p>`
  }
  html += `<p><b>Follow-up:</b> ${FOLLOW_UP_LABELS[meeting.followUpStatus]}</p>`
  html += `<h2>Notizen</h2><pre>${escapeHtml(meeting.notes.trim())}</pre>`

  const openItems = meeting.actionItems.filter((a) => a.title.trim())
  if (openItems.length > 0) {
    html += `<h2>Nächste Schritte</h2><ul>`
    openItems.forEach((item) => {
      let line = escapeHtml(item.title)
      if (item.dueDate) line += ` (bis ${formatDateDE(item.dueDate)})`
      html += `<li>${line}</li>`
    })
    html += `</ul>`
  }

  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function getNextMeetingToday(
  meetings: Meeting[],
  date = todayISO(),
): Meeting | null {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const todayMeetings = meetings
    .filter((m) => m.date === date && m.startTime)
    .sort((a, b) => a.startTime!.localeCompare(b.startTime!))

  for (const m of todayMeetings) {
    const [h, min] = m.startTime!.split(':').map(Number)
    const startMinutes = h * 60 + min
    let endMinutes = startMinutes + 60
    if (m.endTime) {
      const [eh, em] = m.endTime.split(':').map(Number)
      endMinutes = eh * 60 + em
    }
    if (endMinutes >= currentMinutes - 5) return m
  }
  return null
}

export function getMinutesUntilMeeting(meeting: Meeting): number | null {
  if (!meeting.startTime) return null
  const now = new Date()
  const [h, min] = meeting.startTime.split(':').map(Number)
  const target = new Date(meeting.date + 'T12:00:00')
  target.setHours(h, min, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 60000)
}

export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'jetzt'
  if (minutes < 60) return `in ${minutes} Min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`
}
