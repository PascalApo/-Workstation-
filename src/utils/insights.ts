import type { FocusSession, RoutineCheck, Task } from '../types'
import { addDaysISO, todayISO } from './date'

export interface DayActivity {
  date: string
  completed: number
  focusMinutes: number
}

/** Aktivität pro Tag für die letzten `days` Tage (älteste zuerst). */
export function activityByDay(
  tasks: Task[],
  sessions: FocusSession[],
  days: number,
): DayActivity[] {
  const today = todayISO()
  const start = addDaysISO(today, -(days - 1))

  const completedMap = new Map<string, number>()
  for (const t of tasks) {
    if (!t.completedAt) continue
    const date = t.completedAt.slice(0, 10)
    if (date < start || date > today) continue
    completedMap.set(date, (completedMap.get(date) ?? 0) + 1)
  }

  const focusMap = new Map<string, number>()
  for (const s of sessions) {
    if (s.date < start || s.date > today) continue
    focusMap.set(s.date, (focusMap.get(s.date) ?? 0) + s.minutes)
  }

  return Array.from({ length: days }, (_, i) => {
    const date = addDaysISO(start, i)
    return {
      date,
      completed: completedMap.get(date) ?? 0,
      focusMinutes: focusMap.get(date) ?? 0,
    }
  })
}

/** Tage in Folge (bis heute bzw. gestern) mit mindestens einer Aktivität. */
export function calcStreak(activity: DayActivity[]): number {
  let streak = 0
  for (let i = activity.length - 1; i >= 0; i--) {
    const day = activity[i]
    const active = day.completed > 0 || day.focusMinutes > 0
    if (active) {
      streak++
    } else if (i === activity.length - 1) {
      // Heute noch nichts erledigt → Streak von gestern zählt weiter
      continue
    } else {
      break
    }
  }
  return streak
}

export interface ScorePart {
  label: string
  points: number
  max: number
}

/** Erklärbarer Produktivitäts-Score (0–100) für heute. */
export function productivityScore(
  tasks: Task[],
  sessions: FocusSession[],
  routines: RoutineCheck[],
): { total: number; parts: ScorePart[] } {
  const today = todayISO()

  const doneToday = tasks.filter(
    (t) => t.completedAt?.slice(0, 10) === today,
  ).length
  const pendingToday = tasks.filter(
    (t) => t.status === 'open' && t.dueDate === today,
  ).length
  const planned = doneToday + pendingToday
  const taskRatio = planned === 0 ? 1 : doneToday / planned
  const taskPts = Math.round(45 * taskRatio)

  const focusMinutes = sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.minutes, 0)
  const focusPts = Math.round(25 * Math.min(1, focusMinutes / 75))

  const todayRoutines = routines.filter(
    (r) => r.date === today && r.type !== 'weekly_review',
  )
  const routineItems = todayRoutines.flatMap((r) => r.items)
  const routineRatio =
    routineItems.length === 0
      ? 0
      : routineItems.filter((i) => i.done).length / routineItems.length
  const routinePts = Math.round(20 * routineRatio)

  const overdue = tasks.filter(
    (t) => t.status === 'open' && t.dueDate && t.dueDate < today,
  ).length
  const overduePts = Math.max(0, 10 - 2 * overdue)

  const parts: ScorePart[] = [
    { label: `Aufgaben heute (${doneToday}/${planned || '–'})`, points: taskPts, max: 45 },
    { label: `Fokus-Zeit (${focusMinutes} Min.)`, points: focusPts, max: 25 },
    { label: 'Routinen', points: routinePts, max: 20 },
    {
      label: overdue > 0 ? `Keine Altlasten (${overdue} überfällig)` : 'Keine Altlasten',
      points: overduePts,
      max: 10,
    },
  ]
  return { total: taskPts + focusPts + routinePts + overduePts, parts }
}

/** Offene Aufgaben gruppiert nach Projekt, absteigend sortiert. */
export function openByProject(tasks: Task[]): { project: string; count: number }[] {
  const map = new Map<string, number>()
  for (const t of tasks) {
    if (t.status !== 'open') continue
    const key = t.project?.trim() || 'Ohne Projekt'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([project, count]) => ({ project, count }))
    .sort((a, b) => b.count - a.count)
}
