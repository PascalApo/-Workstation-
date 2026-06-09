import type { Meeting, Task } from '../types'
import { isOverdue, todayISO } from '../utils/date'
import { getMinutesUntilMeeting } from './meetingExport'

const STORAGE_KEY = 'ssp-reminder-state'

export interface ReminderSettings {
  enabled: boolean
  meetingMinutesBefore: number
  top3MorningHour: number
  overdueDailyHour: number
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  meetingMinutesBefore: 15,
  top3MorningHour: 8,
  overdueDailyHour: 9,
}

interface ReminderState {
  fired: Record<string, string>
}

function loadState(): ReminderState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { fired: {} }
    return JSON.parse(raw) as ReminderState
  } catch {
    return { fired: {} }
  }
}

function saveState(state: ReminderState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function dayKey(): string {
  return todayISO()
}

function wasFired(id: string): boolean {
  const state = loadState()
  return state.fired[id] === dayKey()
}

function markFired(id: string) {
  const state = loadState()
  state.fired[id] = dayKey()
  saveState(state)
}

export function getReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem('ssp-reminder-settings')
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveReminderSettings(settings: ReminderSettings) {
  localStorage.setItem('ssp-reminder-settings', JSON.stringify(settings))
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function showNotification(title: string, body: string, url = '/') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const n = new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png` })
  n.onclick = () => {
    window.focus()
    window.location.href = url
    n.close()
  }
}

export function checkReminders(
  tasks: Task[],
  meetings: Meeting[],
  settings = getReminderSettings(),
) {
  if (!settings.enabled || Notification.permission !== 'granted') return

  const today = todayISO()
  const now = new Date()
  const hour = now.getHours()

  for (const meeting of meetings) {
    if (meeting.date !== today || !meeting.startTime) continue
    const minutes = getMinutesUntilMeeting(meeting)
    if (minutes === null) continue
    const id = `meeting-${meeting.id}`
    if (
      minutes > 0 &&
      minutes <= settings.meetingMinutesBefore &&
      !wasFired(id)
    ) {
      showNotification(
        `Meeting in ${minutes} Min`,
        `${meeting.title}${meeting.startTime ? ` um ${meeting.startTime}` : ''}`,
        meeting.meetingUrl ?? '/kalender',
      )
      markFired(id)
    }
  }

  const top3Id = 'top3-empty'
  if (hour >= settings.top3MorningHour && !wasFired(top3Id)) {
    const top3 = tasks.filter(
      (t) => t.isTop3 && t.top3Date === today && t.status === 'open',
    )
    if (top3.length === 0) {
      showNotification(
        'Top 3 noch leer',
        'Lege deine 3 Prioritäten für heute fest.',
        '/',
      )
      markFired(top3Id)
    }
  }

  const overdueId = 'overdue-daily'
  if (hour >= settings.overdueDailyHour && !wasFired(overdueId)) {
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status))
    if (overdue.length > 0) {
      showNotification(
        `${overdue.length} überfällige Aufgabe${overdue.length !== 1 ? 'n' : ''}`,
        overdue[0].title + (overdue.length > 1 ? ` (+${overdue.length - 1})` : ''),
        '/aufgaben',
      )
      markFired(overdueId)
    }
  }
}
