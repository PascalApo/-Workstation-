import type { Meeting, Task, WeeklyGoal } from '../types'

const TASK_HEADERS = [
  'title',
  'project',
  'priority',
  'dueDate',
  'scheduledTime',
  'workflowStatus',
  'status',
  'description',
] as const

const MEETING_HEADERS = [
  'title',
  'date',
  'startTime',
  'endTime',
  'participants',
  'meetingUrl',
  'followUpStatus',
  'notes',
] as const

const GOAL_HEADERS = ['title', 'weekStart', 'done'] as const

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function parseCsvLine(line: string): string[] {
  return (
    line.match(/("([^"]|"")*"|[^,]*)/g)?.map((v) =>
      v.replace(/^"|"$/g, '').replace(/""/g, '"').trim(),
    ) ?? []
  )
}

export function tasksToCsv(tasks: Task[]): string {
  const rows = [TASK_HEADERS.join(',')]
  for (const t of tasks) {
    rows.push(
      TASK_HEADERS.map((h) => escapeCsv(String(t[h] ?? ''))).join(','),
    )
  }
  return rows.join('\n')
}

export function meetingsToCsv(meetings: Meeting[]): string {
  const rows = [MEETING_HEADERS.join(',')]
  for (const m of meetings) {
    rows.push(
      MEETING_HEADERS.map((h) => escapeCsv(String(m[h as keyof Meeting] ?? ''))).join(','),
    )
  }
  return rows.join('\n')
}

export function weeklyGoalsToCsv(goals: WeeklyGoal[]): string {
  const rows = [GOAL_HEADERS.join(',')]
  for (const g of goals) {
    rows.push(
      GOAL_HEADERS.map((h) =>
        escapeCsv(h === 'done' ? String(g.done) : String(g[h] ?? '')),
      ).join(','),
    )
  }
  return rows.join('\n')
}

export function allDataToCsv(
  tasks: Task[],
  meetings: Meeting[],
  goals: WeeklyGoal[],
): string {
  return [
    '# TASKS',
    tasksToCsv(tasks),
    '',
    '# MEETINGS',
    meetingsToCsv(meetings),
    '',
    '# WEEKLY_GOALS',
    weeklyGoalsToCsv(goals),
  ].join('\n')
}

export function parseCsvTasks(content: string): Omit<Task, 'id' | 'createdAt'>[] {
  const section = extractSection(content, 'TASKS') ?? content
  const lines = section.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const tasks: Omit<Task, 'id' | 'createdAt'>[] = []

  for (const line of lines.slice(1)) {
    if (!line.trim() || line.startsWith('#')) continue
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    if (!row.title) continue
    tasks.push({
      title: row.title,
      project: row.project || undefined,
      priority: (row.priority as Task['priority']) || 'medium',
      dueDate: row.dueDate || undefined,
      scheduledTime: row.scheduledTime || undefined,
      workflowStatus: (row.workflowStatus as Task['workflowStatus']) || 'open',
      status: (row.status as Task['status']) || 'open',
      description: row.description || undefined,
    })
  }
  return tasks
}

export function parseCsvMeetings(
  content: string,
): Omit<Meeting, 'id' | 'createdAt' | 'actionItems'>[] {
  const section = extractSection(content, 'MEETINGS')
  if (!section) return []
  const lines = section.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const meetings: Omit<Meeting, 'id' | 'createdAt' | 'actionItems'>[] = []

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    if (!row.title || !row.date) continue
    meetings.push({
      title: row.title,
      date: row.date,
      startTime: row.startTime || undefined,
      endTime: row.endTime || undefined,
      participants: row.participants || undefined,
      meetingUrl: row.meetingUrl || undefined,
      followUpStatus: (row.followUpStatus as Meeting['followUpStatus']) || 'open',
      notes: row.notes || '',
    })
  }
  return meetings
}

export function parseCsvWeeklyGoals(
  content: string,
): Omit<WeeklyGoal, 'id' | 'createdAt'>[] {
  const section = extractSection(content, 'WEEKLY_GOALS')
  if (!section) return []
  const lines = section.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const goals: Omit<WeeklyGoal, 'id' | 'createdAt'>[] = []

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    if (!row.title || !row.weekStart) continue
    goals.push({
      title: row.title,
      weekStart: row.weekStart,
      done: row.done === 'true',
    })
  }
  return goals
}

function extractSection(content: string, name: string): string | null {
  const marker = `# ${name}`
  const idx = content.indexOf(marker)
  if (idx === -1) return null
  const rest = content.slice(idx + marker.length)
  const nextMarker = rest.search(/\n# [A-Z_]+/)
  return nextMarker === -1 ? rest.trim() : rest.slice(0, nextMarker).trim()
}

export function isDuplicateMeeting(
  existing: Meeting[],
  incoming: { title: string; date: string },
): boolean {
  return existing.some(
    (m) =>
      m.title.toLowerCase() === incoming.title.toLowerCase() &&
      m.date === incoming.date,
  )
}

export function isDuplicateTask(
  existing: Task[],
  incoming: { title: string; dueDate?: string },
): boolean {
  return existing.some(
    (t) =>
      t.title.toLowerCase() === incoming.title.toLowerCase() &&
      t.dueDate === incoming.dueDate,
  )
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
