import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { checkReminders, getReminderSettings } from '../integrations/reminders'
import { updateAppBadge } from '../pwa'
import { isOverdue } from '../utils/date'

const CHECK_INTERVAL_MS = 5 * 60 * 1000

export function ReminderScheduler() {
  const { tasks, meetings, loading } = useApp()

  useEffect(() => {
    if (loading) return
    const settings = getReminderSettings()
    if (!settings.enabled) return

    checkReminders(tasks, meetings, settings)
    const id = setInterval(() => {
      checkReminders(tasks, meetings, getReminderSettings())
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [tasks, meetings, loading])

  // Überfällige Aufgaben als Badge auf dem App-Icon (installierte PWA)
  useEffect(() => {
    if (loading) return
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length
    updateAppBadge(overdue)
  }, [tasks, loading])

  return null
}
