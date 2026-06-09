export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDateDE(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

export function formatDateLongDE(iso: string): string {
  const date = new Date(iso + 'T12:00:00')
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function isToday(iso?: string): boolean {
  if (!iso) return false
  return iso === todayISO()
}

export function isThisWeek(iso?: string): boolean {
  if (!iso) return false
  const date = new Date(iso + 'T12:00:00')
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return date >= start && date <= end
}

export function isOverdue(iso?: string, status?: string): boolean {
  if (!iso || status === 'done') return false
  return iso < todayISO()
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function startOfWeekISO(iso?: string): string {
  const d = iso ? new Date(iso + 'T12:00:00') : new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dayNum}`
}

export function getWeekDayLabels(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })
  })
}
