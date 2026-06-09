export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'open' | 'done'
export type WorkflowStatus = 'inbox' | 'open' | 'in_progress' | 'done'
export type EisenhowerQuadrant =
  | 'urgent_important'
  | 'not_urgent_important'
  | 'urgent_not_important'
  | 'not_urgent_not_important'
export type FollowUpStatus = 'open' | 'done' | 'waiting'
export type RoutineType = 'daily_morning' | 'daily_evening' | 'weekly_review'
export type PlanTab = 'kanban' | 'matrix' | 'week'

export interface Task {
  id: string
  title: string
  description?: string
  project?: string
  priority: Priority
  dueDate?: string
  scheduledTime?: string
  scheduledEndTime?: string
  status: TaskStatus
  workflowStatus: WorkflowStatus
  quadrant?: EisenhowerQuadrant
  sourceMeetingId?: string
  isTop3?: boolean
  top3Date?: string
  createdAt: string
  completedAt?: string
}

export interface WeeklyGoal {
  id: string
  weekStart: string
  title: string
  done: boolean
  createdAt: string
}

export interface ActionItem {
  id: string
  title: string
  assignee?: string
  dueDate?: string
  taskId?: string
}

export interface Meeting {
  id: string
  date: string
  startTime?: string
  endTime?: string
  title: string
  participants?: string
  meetingUrl?: string
  notes: string
  followUpStatus: FollowUpStatus
  actionItems: ActionItem[]
  createdAt: string
}

export interface IntegrationSettings {
  /** Reserved for future optional settings */
  _version?: number
}

export type CalendarView = 'flow' | 'month' | 'day'

export interface CalendarCreateSlot {
  date: string
  startTime?: string
  endTime?: string
}

export type CalendarEventType = 'meeting' | 'task'

export interface CalendarEvent {
  id: string
  sourceId: string
  type: CalendarEventType
  title: string
  date: string
  startTime?: string
  endTime?: string
  priority?: Priority
  status?: TaskStatus
  project?: string
  participants?: string
  followUpStatus?: FollowUpStatus
  isTop3?: boolean
}

export interface RoutineItem {
  id: string
  label: string
  done: boolean
}

export interface RoutineCheck {
  id: string
  type: RoutineType
  date: string
  items: RoutineItem[]
  notes?: string
}

export interface RoutineTemplates {
  daily_morning: string[]
  daily_evening: string[]
  weekly_review: string[]
}

export interface AppExport {
  version: 2
  exportedAt: string
  tasks: Task[]
  meetings: Meeting[]
  routines: RoutineCheck[]
  routineTemplates: RoutineTemplates
  weeklyGoals: WeeklyGoal[]
}
