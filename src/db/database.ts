import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DEFAULT_ROUTINE_TEMPLATES } from '../constants/defaults'
import type {
  FocusSession,
  Meeting,
  Note,
  RoutineCheck,
  RoutineTemplates,
  RoutineType,
  Task,
  WeeklyGoal,
} from '../types'
import { generateId, todayISO } from '../utils/date'
import { normalizeTask } from '../utils/tasks'

interface SSPDB extends DBSchema {
  tasks: {
    key: string
    value: Task
    indexes: { 'by-status': string; 'by-dueDate': string }
  }
  meetings: {
    key: string
    value: Meeting
    indexes: { 'by-date': string }
  }
  routines: {
    key: string
    value: RoutineCheck
    indexes: { 'by-date': string; 'by-type': RoutineType }
  }
  weeklyGoals: {
    key: string
    value: WeeklyGoal
    indexes: { 'by-week': string }
  }
  settings: {
    key: string
    value: RoutineTemplates
  }
  notes: {
    key: string
    value: Note
    indexes: { 'by-updated': string }
  }
  focusSessions: {
    key: string
    value: FocusSession
    indexes: { 'by-date': string }
  }
}

const DB_NAME = 'ssp-alltag'
const DB_VERSION = 3
const TEMPLATES_KEY = 'routineTemplates'

let dbPromise: Promise<IDBPDatabase<SSPDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SSPDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
          taskStore.createIndex('by-status', 'status')
          taskStore.createIndex('by-dueDate', 'dueDate')

          const meetingStore = db.createObjectStore('meetings', {
            keyPath: 'id',
          })
          meetingStore.createIndex('by-date', 'date')

          const routineStore = db.createObjectStore('routines', {
            keyPath: 'id',
          })
          routineStore.createIndex('by-date', 'date')
          routineStore.createIndex('by-type', 'type')

          db.createObjectStore('settings')
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('weeklyGoals')) {
            const goalStore = db.createObjectStore('weeklyGoals', {
              keyPath: 'id',
            })
            goalStore.createIndex('by-week', 'weekStart')
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('notes')) {
            const noteStore = db.createObjectStore('notes', { keyPath: 'id' })
            noteStore.createIndex('by-updated', 'updatedAt')
          }
          if (!db.objectStoreNames.contains('focusSessions')) {
            const sessionStore = db.createObjectStore('focusSessions', {
              keyPath: 'id',
            })
            sessionStore.createIndex('by-date', 'date')
          }
        }
      },
    })
  }
  return dbPromise
}

export async function initDB(): Promise<void> {
  const db = await getDB()
  const existing = await db.get('settings', TEMPLATES_KEY)
  if (!existing) {
    await db.put('settings', DEFAULT_ROUTINE_TEMPLATES, TEMPLATES_KEY)
  }
}

export async function getRoutineTemplates(): Promise<RoutineTemplates> {
  const db = await getDB()
  const templates = await db.get('settings', TEMPLATES_KEY)
  return templates ?? DEFAULT_ROUTINE_TEMPLATES
}

export async function saveRoutineTemplates(
  templates: RoutineTemplates,
): Promise<void> {
  const db = await getDB()
  await db.put('settings', templates, TEMPLATES_KEY)
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB()
  const tasks = await db.getAll('tasks')
  return tasks.map(normalizeTask)
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDB()
  await db.put('tasks', normalizeTask(task))
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

export async function getAllMeetings(): Promise<Meeting[]> {
  const db = await getDB()
  return db.getAll('meetings')
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  const db = await getDB()
  await db.put('meetings', meeting)
}

export async function deleteMeeting(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('meetings', id)
}

export async function getAllRoutines(): Promise<RoutineCheck[]> {
  const db = await getDB()
  return db.getAll('routines')
}

export async function saveRoutine(routine: RoutineCheck): Promise<void> {
  const db = await getDB()
  await db.put('routines', routine)
}

export async function getAllWeeklyGoals(): Promise<WeeklyGoal[]> {
  const db = await getDB()
  return db.getAll('weeklyGoals')
}

export async function saveWeeklyGoal(goal: WeeklyGoal): Promise<void> {
  const db = await getDB()
  await db.put('weeklyGoals', goal)
}

export async function deleteWeeklyGoal(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('weeklyGoals', id)
}

export async function getOrCreateRoutine(
  type: RoutineType,
  date: string = todayISO(),
): Promise<RoutineCheck> {
  const db = await getDB()
  const all = await db.getAllFromIndex('routines', 'by-date', date)
  const existing = all.find((r) => r.type === type)
  if (existing) return existing

  const templates = await getRoutineTemplates()
  const routine: RoutineCheck = {
    id: generateId(),
    type,
    date,
    items: templates[type].map((label) => ({
      id: generateId(),
      label,
      done: false,
    })),
  }
  await db.put('routines', routine)
  return routine
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDB()
  return db.getAll('notes')
}

export async function saveNote(note: Note): Promise<void> {
  const db = await getDB()
  await db.put('notes', note)
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('notes', id)
}

export async function getAllFocusSessions(): Promise<FocusSession[]> {
  const db = await getDB()
  return db.getAll('focusSessions')
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  const db = await getDB()
  await db.put('focusSessions', session)
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('tasks')
  await db.clear('meetings')
  await db.clear('routines')
  await db.clear('weeklyGoals')
  await db.clear('notes')
  await db.clear('focusSessions')
  await db.put('settings', DEFAULT_ROUTINE_TEMPLATES, TEMPLATES_KEY)
}

export async function importAllData(data: {
  tasks: Task[]
  meetings: Meeting[]
  routines: RoutineCheck[]
  routineTemplates: RoutineTemplates
  weeklyGoals?: WeeklyGoal[]
  notes?: Note[]
  focusSessions?: FocusSession[]
}): Promise<void> {
  const db = await getDB()
  await db.clear('tasks')
  await db.clear('meetings')
  await db.clear('routines')
  await db.clear('weeklyGoals')
  await db.clear('notes')
  await db.clear('focusSessions')

  for (const task of data.tasks) await db.put('tasks', normalizeTask(task))
  for (const meeting of data.meetings) await db.put('meetings', meeting)
  for (const routine of data.routines) await db.put('routines', routine)
  for (const goal of data.weeklyGoals ?? [])
    await db.put('weeklyGoals', goal)
  for (const note of data.notes ?? []) await db.put('notes', note)
  for (const session of data.focusSessions ?? [])
    await db.put('focusSessions', session)
  await db.put('settings', data.routineTemplates, TEMPLATES_KEY)
}
