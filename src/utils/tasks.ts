import type { EisenhowerQuadrant, Task, WorkflowStatus } from '../types'

export function normalizeTask(task: Task): Task {
  if (task.status === 'done') {
    return { ...task, workflowStatus: 'done' }
  }
  if (task.workflowStatus) return task
  if (!task.dueDate) {
    return { ...task, workflowStatus: 'inbox' }
  }
  return { ...task, workflowStatus: 'open' }
}

export function getWorkflowStatus(task: Task): WorkflowStatus {
  return normalizeTask(task).workflowStatus
}

export const WORKFLOW_LABELS: Record<WorkflowStatus, string> = {
  inbox: 'Eingang',
  open: 'Geplant',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
}

export const QUADRANT_LABELS: Record<
  EisenhowerQuadrant,
  { title: string; subtitle: string; action: string }
> = {
  urgent_important: {
    title: 'Dringend & Wichtig',
    subtitle: 'Sofort erledigen',
    action: 'Jetzt tun',
  },
  not_urgent_important: {
    title: 'Wichtig',
    subtitle: 'Einplanen',
    action: 'Termin setzen',
  },
  urgent_not_important: {
    title: 'Dringend',
    subtitle: 'Delegieren / kurz halten',
    action: 'Schnell abarbeiten',
  },
  not_urgent_not_important: {
    title: 'Niedrige Prio',
    subtitle: 'Eliminieren oder später',
    action: 'Prüfen & streichen',
  },
}

export const QUADRANT_ORDER: EisenhowerQuadrant[] = [
  'urgent_important',
  'not_urgent_important',
  'urgent_not_important',
  'not_urgent_not_important',
]

export function suggestQuadrant(task: Task): EisenhowerQuadrant {
  if (task.quadrant) return task.quadrant
  if (task.priority === 'high') return 'urgent_important'
  if (task.priority === 'medium') return 'not_urgent_important'
  return 'not_urgent_not_important'
}

export function groupByProject(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>()
  for (const task of tasks) {
    const key = task.project?.trim() || 'Ohne Projekt'
    const list = map.get(key) ?? []
    list.push(task)
    map.set(key, list)
  }
  return map
}
