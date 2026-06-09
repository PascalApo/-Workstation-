import type { CalendarEvent, Meeting, Task } from '../types'
import { generateId } from './date'
import { sortEventsByTime } from './calendar'

export function tasksToEvents(tasks: Task[]): CalendarEvent[] {
  return tasks
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: `task-${t.id}`,
      sourceId: t.id,
      type: 'task' as const,
      title: t.title,
      date: t.dueDate!,
      startTime: t.scheduledTime,
      endTime: t.scheduledEndTime,
      priority: t.priority,
      status: t.status,
      project: t.project,
      isTop3: t.isTop3,
    }))
}

export function meetingsToEvents(meetings: Meeting[]): CalendarEvent[] {
  return meetings.map((m) => ({
    id: `meeting-${m.id}`,
    sourceId: m.id,
    type: 'meeting' as const,
    title: m.title,
    date: m.date,
    startTime: m.startTime,
    endTime: m.endTime,
    participants: m.participants,
    followUpStatus: m.followUpStatus,
  }))
}

export function buildCalendarEvents(
  tasks: Task[],
  meetings: Meeting[],
): CalendarEvent[] {
  return sortEventsByTime([
    ...tasksToEvents(tasks),
    ...meetingsToEvents(meetings),
  ])
}

export function getEventsForDate(
  events: CalendarEvent[],
  date: string,
): CalendarEvent[] {
  return sortEventsByTime(events.filter((e) => e.date === date))
}

export function getUnscheduledTasks(tasks: Task[]): Task[] {
  return tasks
    .filter(
      (t) =>
        t.status === 'open' &&
        (t.workflowStatus === 'inbox' || !t.dueDate),
    )
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })
}

export function defaultMeetingEnd(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number)
  const endH = h + 1
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function createQuickTask(
  title: string,
  date: string,
  time?: string,
): Omit<Task, 'id' | 'createdAt' | 'status'> {
  return {
    title,
    priority: 'medium',
    dueDate: date,
    scheduledTime: time,
    scheduledEndTime: time ? defaultMeetingEnd(time) : undefined,
    workflowStatus: 'open',
  }
}

export function createQuickMeeting(
  title: string,
  date: string,
  startTime?: string,
): Omit<Meeting, 'id' | 'createdAt'> {
  return {
    title,
    date,
    startTime,
    endTime: startTime ? defaultMeetingEnd(startTime) : undefined,
    notes: '',
    followUpStatus: 'open',
    actionItems: [],
  }
}

export function dragPayload(type: 'task' | 'meeting', id: string): string {
  return JSON.stringify({ type, id })
}

export function parseDragPayload(raw: string): { type: 'task' | 'meeting'; id: string } | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.type && parsed?.id) return parsed
  } catch {
    return null
  }
  return null
}

export function newActionItemId(): string {
  return generateId()
}
