import type { Meeting, Task } from '../types'
import { MEETING_NOTE_TEMPLATE } from '../constants/defaults'

function unfoldIcs(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
}

function parseIcsDate(value: string): { date: string; time?: string } {
  const clean = value.replace(/Z$/, '').split('T')
  const raw = clean[0]
  const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  if (clean[1] && clean[1].length >= 4) {
    const time = `${clean[1].slice(0, 2)}:${clean[1].slice(2, 4)}`
    return { date, time }
  }
  return { date }
}

export interface ParsedIcsEvent {
  title: string
  date: string
  startTime?: string
  endTime?: string
  description?: string
  location?: string
  url?: string
  participants?: string
}

export function parseIcsFile(content: string): ParsedIcsEvent[] {
  const unfolded = unfoldIcs(content)
  const blocks = unfolded.split('BEGIN:VEVENT')
  const events: ParsedIcsEvent[] = []

  for (const block of blocks.slice(1)) {
    const chunk = block.split('END:VEVENT')[0]
    const get = (key: string) => {
      const match = chunk.match(new RegExp(`^${key}[^:]*:(.+)$`, 'm'))
      return match?.[1]?.trim()
    }

    const title = get('SUMMARY')
    if (!title) continue

    const dtStart = get('DTSTART')
    const dtEnd = get('DTEND')
    if (!dtStart) continue

    const start = parseIcsDate(dtStart)
    const end = dtEnd ? parseIcsDate(dtEnd) : undefined

    events.push({
      title,
      date: start.date,
      startTime: start.time,
      endTime: end?.time,
      description: get('DESCRIPTION')?.replace(/\\n/g, '\n'),
      location: get('LOCATION'),
      url: get('URL'),
      participants: get('ATTENDEE')?.replace(/^mailto:/i, ''),
    })
  }

  return events
}

export function icsEventsToMeetings(
  events: ParsedIcsEvent[],
): Omit<Meeting, 'id' | 'createdAt'>[] {
  return events.map((e) => ({
    title: e.title,
    date: e.date,
    startTime: e.startTime,
    endTime: e.endTime,
    participants: e.participants || e.location,
    meetingUrl: e.url,
    notes: e.description || MEETING_NOTE_TEMPLATE,
    followUpStatus: 'open' as const,
    actionItems: [],
  }))
}

function toIcsDateTime(date: string, time?: string): string {
  const d = date.replace(/-/g, '')
  if (!time) return d
  const t = time.replace(':', '') + '00'
  return `${d}T${t}`
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateIcs(
  meetings: Meeting[],
  tasks: Task[],
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SSP Workstation//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const m of meetings) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:ssp-meeting-${m.id}@workstation`)
    lines.push(`DTSTART:${toIcsDateTime(m.date, m.startTime)}`)
    if (m.endTime) lines.push(`DTEND:${toIcsDateTime(m.date, m.endTime)}`)
    lines.push(`SUMMARY:${escapeIcs(m.title)}`)
    if (m.notes) lines.push(`DESCRIPTION:${escapeIcs(m.notes.slice(0, 500))}`)
    if (m.participants) lines.push(`LOCATION:${escapeIcs(m.participants)}`)
    if (m.meetingUrl) lines.push(`URL:${m.meetingUrl}`)
    lines.push('END:VEVENT')
  }

  for (const t of tasks) {
    if (!t.dueDate || t.status === 'done') continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:ssp-task-${t.id}@workstation`)
    lines.push(`DTSTART:${toIcsDateTime(t.dueDate, t.scheduledTime)}`)
    if (t.scheduledEndTime)
      lines.push(`DTEND:${toIcsDateTime(t.dueDate, t.scheduledEndTime)}`)
    lines.push(`SUMMARY:${escapeIcs(`[Aufgabe] ${t.title}`)}`)
    if (t.project) lines.push(`CATEGORIES:${escapeIcs(t.project)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
