import type { CalendarEvent, CalendarView } from '../types'

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const
export const WEEKDAYS_LONG = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const
export const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const

export const HOUR_START = 7
export const HOUR_END = 20
export const HOUR_HEIGHT = 56
export const FLOW_HOUR_HEIGHT = 64
export const SLOT_MINUTES = 15

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISO(iso: string): Date {
  return new Date(iso + 'T12:00:00')
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function addMonths(iso: string, months: number): string {
  const d = parseISO(iso)
  d.setMonth(d.getMonth() + months)
  return toISO(d)
}

export function startOfWeek(iso: string): string {
  const d = parseISO(iso)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toISO(d)
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6)
}

export function getWeekDays(iso: string): string[] {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getMonthGrid(iso: string): string[][] {
  const d = parseISO(iso)
  const year = d.getFullYear()
  const month = d.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)

  let startOffset = first.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const days: string[] = []
  for (let i = startOffset; i > 0; i--) {
    const prev = new Date(year, month, 1 - i)
    days.push(toISO(prev))
  }
  for (let day = 1; day <= last.getDate(); day++) {
    days.push(toISO(new Date(year, month, day)))
  }
  while (days.length % 7 !== 0) {
    const next = new Date(year, month + 1, days.length - last.getDate() - startOffset + 1)
    days.push(toISO(next))
  }

  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

export function isWeekend(iso: string): boolean {
  const day = parseISO(iso).getDay()
  return day === 0 || day === 6
}

export function timeToMinutes(time?: string): number {
  if (!time) return -1
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES
}

export function getEventDurationMinutes(start?: string, end?: string): number {
  if (!start) return 60
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  return e > s ? e - s : 60
}

export function addMinutesToTime(time: string, mins: number): string {
  return minutesToTime(timeToMinutes(time) + mins)
}

export function getDropEndTime(startTime: string, durationMinutes: number): string {
  return addMinutesToTime(startTime, durationMinutes)
}

export function yToSnappedMinutes(y: number, gridTop: number): number {
  const rel = Math.max(0, y - gridTop)
  const raw = (rel / FLOW_HOUR_HEIGHT) * 60 + HOUR_START * 60
  return snapMinutes(
    Math.max(
      HOUR_START * 60,
      Math.min(HOUR_END * 60 - SLOT_MINUTES, raw),
    ),
  )
}

export function minutesToFlowY(minutes: number): number {
  return ((minutes - HOUR_START * 60) / 60) * FLOW_HOUR_HEIGHT
}

export function formatTimeRange(start?: string, end?: string): string {
  if (!start) return 'Ganztägig'
  if (end) return `${start} – ${end}`
  return start
}

export function getViewTitle(view: CalendarView, focusDate: string): string {
  const d = parseISO(focusDate)
  if (view === 'month') {
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
  if (view === 'flow') {
    const start = parseISO(startOfWeek(focusDate))
    const end = parseISO(endOfWeek(focusDate))
    const fmt = (date: Date) =>
      date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)} ${d.getFullYear()}`
  }
  return d.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export interface EventLane {
  lane: number
  laneCount: number
}

/**
 * Ordnet überlappende Termine nebeneinander an (Spalten/Lanes),
 * damit sich nichts verdeckt – wie in professionellen Kalendern.
 */
export function computeEventLanes(
  events: { id: string; startTime?: string; endTime?: string }[],
): Map<string, EventLane> {
  const result = new Map<string, EventLane>()
  const sorted = events
    .filter((e) => e.startTime)
    .map((e) => {
      const start = timeToMinutes(e.startTime)
      const end = e.endTime
        ? Math.max(timeToMinutes(e.endTime), start + SLOT_MINUTES)
        : start + 60
      return { id: e.id, start, end, lane: 0 }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  let cluster: typeof sorted = []
  let clusterEnd = -1

  const flush = () => {
    if (cluster.length === 0) return
    const laneEnds: number[] = []
    for (const ev of cluster) {
      let lane = laneEnds.findIndex((end) => end <= ev.start)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(ev.end)
      } else {
        laneEnds[lane] = ev.end
      }
      ev.lane = lane
    }
    for (const ev of cluster) {
      result.set(ev.id, { lane: ev.lane, laneCount: laneEnds.length })
    }
    cluster = []
    clusterEnd = -1
  }

  for (const ev of sorted) {
    if (cluster.length > 0 && ev.start >= clusterEnd) flush()
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, ev.end)
  }
  flush()
  return result
}

/** Einträge, die sich mit dem Zeitfenster überschneiden (erledigte ausgenommen). */
export function getTimeConflicts(
  events: CalendarEvent[],
  date: string,
  startTime: string,
  endTime: string,
): CalendarEvent[] {
  const s = timeToMinutes(startTime)
  const e = timeToMinutes(endTime)
  return events.filter((ev) => {
    if (ev.date !== date || !ev.startTime || ev.status === 'done') return false
    const evStart = timeToMinutes(ev.startTime)
    const evEnd = ev.endTime ? timeToMinutes(ev.endTime) : evStart + 60
    return evStart < e && evEnd > s
  })
}

/** Nächste konfliktfreie Startzeit ab fromTime im 15-Min-Raster, sonst null. */
export function findNextFreeTime(
  events: CalendarEvent[],
  date: string,
  fromTime: string,
  durationMinutes: number,
): string | null {
  let start = snapMinutes(timeToMinutes(fromTime))
  const limit = HOUR_END * 60
  while (start + durationMinutes <= limit) {
    const slotStart = minutesToTime(start)
    const slotEnd = minutesToTime(start + durationMinutes)
    if (getTimeConflicts(events, date, slotStart, slotEnd).length === 0) {
      return slotStart
    }
    start += SLOT_MINUTES
  }
  return null
}

export function sortEventsByTime<T extends { startTime?: string; title: string }>(
  events: T[],
): T[] {
  return [...events].sort((a, b) => {
    const ta = timeToMinutes(a.startTime)
    const tb = timeToMinutes(b.startTime)
    if (ta === -1 && tb === -1) return a.title.localeCompare(b.title)
    if (ta === -1) return -1
    if (tb === -1) return 1
    return ta - tb
  })
}
