import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  deleteMeeting,
  deleteNote,
  deleteTask,
  deleteWeeklyGoal,
  getAllFocusSessions,
  getAllMeetings,
  getAllNotes,
  getAllRoutines,
  getAllTasks,
  getAllWeeklyGoals,
  getOrCreateRoutine,
  getRoutineTemplates,
  importAllData,
  initDB,
  saveFocusSession,
  saveMeeting,
  saveNote,
  saveRoutine,
  saveTask,
  saveWeeklyGoal,
} from '../db/database'
import type {
  ActionItem,
  AppExport,
  EisenhowerQuadrant,
  FocusSession,
  Meeting,
  Note,
  NoteColor,
  RoutineCheck,
  RoutineTemplates,
  RoutineType,
  Task,
  WeeklyGoal,
  WorkflowStatus,
} from '../types'
import {
  generateId,
  nextRecurrenceDate,
  startOfWeekISO,
  todayISO,
} from '../utils/date'
import { normalizeTask } from '../utils/tasks'

type TaskInput = Omit<Task, 'id' | 'createdAt' | 'status' | 'workflowStatus'> & {
  workflowStatus?: WorkflowStatus
}

interface AppContextValue {
  loading: boolean
  tasks: Task[]
  meetings: Meeting[]
  routines: RoutineCheck[]
  weeklyGoals: WeeklyGoal[]
  notes: Note[]
  focusSessions: FocusSession[]
  routineTemplates: RoutineTemplates
  inboxCount: number
  refresh: () => Promise<void>
  quickCapture: (title: string) => Promise<Task>
  addTask: (task: TaskInput) => Promise<Task>
  updateTask: (task: Task) => Promise<void>
  removeTask: (id: string) => Promise<void>
  removeCompletedTasks: () => Promise<number>
  setWorkflow: (id: string, workflowStatus: WorkflowStatus) => Promise<void>
  setQuadrant: (id: string, quadrant: EisenhowerQuadrant) => Promise<void>
  processInboxItem: (id: string, updates: Partial<Task>) => Promise<void>
  toggleTaskDone: (id: string) => Promise<void>
  setTop3: (taskIds: string[]) => Promise<void>
  addWeeklyGoal: (title: string, weekStart?: string) => Promise<WeeklyGoal>
  toggleWeeklyGoal: (id: string) => Promise<void>
  removeWeeklyGoal: (id: string) => Promise<void>
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => Promise<Meeting>
  updateMeeting: (meeting: Meeting) => Promise<void>
  removeMeeting: (id: string) => Promise<void>
  getRoutineForToday: (type: RoutineType) => Promise<RoutineCheck>
  updateRoutine: (routine: RoutineCheck) => Promise<void>
  addNote: (input: { title: string; content: string; color?: NoteColor }) => Promise<Note>
  updateNote: (note: Note) => Promise<void>
  removeNote: (id: string) => Promise<void>
  logFocusSession: (input: { minutes: number; taskId?: string; taskTitle?: string }) => Promise<void>
  exportData: () => AppExport
  importData: (data: AppExport) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [routines, setRoutines] = useState<RoutineCheck[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])
  const [routineTemplates, setRoutineTemplates] = useState<RoutineTemplates>({
    daily_morning: [],
    daily_evening: [],
    weekly_review: [],
  })

  const refresh = useCallback(async () => {
    const [
      loadedTasks,
      loadedMeetings,
      loadedRoutines,
      goals,
      templates,
      loadedNotes,
      loadedSessions,
    ] = await Promise.all([
      getAllTasks(),
      getAllMeetings(),
      getAllRoutines(),
      getAllWeeklyGoals(),
      getRoutineTemplates(),
      getAllNotes(),
      getAllFocusSessions(),
    ])
    setTasks(loadedTasks)
    setMeetings(loadedMeetings)
    setRoutines(loadedRoutines)
    setWeeklyGoals(goals)
    setRoutineTemplates(templates)
    setNotes(loadedNotes)
    setFocusSessions(loadedSessions)
  }, [])

  useEffect(() => {
    initDB()
      .then(refresh)
      .finally(() => setLoading(false))
  }, [refresh])

  const inboxCount = useMemo(
    () => tasks.filter((t) => t.workflowStatus === 'inbox').length,
    [tasks],
  )

  const quickCapture = useCallback(
    async (title: string) => {
      const task: Task = {
        id: generateId(),
        title: title.trim(),
        priority: 'medium',
        status: 'open',
        workflowStatus: 'inbox',
        createdAt: new Date().toISOString(),
      }
      await saveTask(task)
      await refresh()
      return task
    },
    [refresh],
  )

  const addTask = useCallback(
    async (input: TaskInput) => {
      const task: Task = normalizeTask({
        ...input,
        id: generateId(),
        status: 'open',
        workflowStatus: input.workflowStatus ?? (input.dueDate ? 'open' : 'inbox'),
        createdAt: new Date().toISOString(),
      })
      await saveTask(task)
      await refresh()
      return task
    },
    [refresh],
  )

  const updateTask = useCallback(
    async (task: Task) => {
      await saveTask(task)
      await refresh()
    },
    [refresh],
  )

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(id)
      await refresh()
    },
    [refresh],
  )

  const removeCompletedTasks = useCallback(async () => {
    const done = tasks.filter(
      (t) => t.status === 'done' || t.workflowStatus === 'done',
    )
    await Promise.all(done.map((t) => deleteTask(t.id)))
    await refresh()
    return done.length
  }, [tasks, refresh])

  /** Beim Abschließen einer wiederkehrenden Aufgabe die nächste Instanz anlegen. */
  const spawnNextOccurrence = useCallback(async (task: Task) => {
    if (!task.recurrence) return
    const base = task.dueDate ?? todayISO()
    const nextDue = nextRecurrenceDate(base, task.recurrence)
    const next: Task = normalizeTask({
      ...task,
      id: generateId(),
      dueDate: nextDue,
      status: 'open',
      workflowStatus: 'open',
      isTop3: false,
      top3Date: undefined,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
    })
    await saveTask(next)
  }, [])

  const setWorkflow = useCallback(
    async (id: string, workflowStatus: WorkflowStatus) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      const done = workflowStatus === 'done'
      await saveTask({
        ...task,
        workflowStatus,
        status: done ? 'done' : 'open',
        completedAt: done ? new Date().toISOString() : undefined,
      })
      if (done && task.status !== 'done') await spawnNextOccurrence(task)
      await refresh()
    },
    [tasks, refresh, spawnNextOccurrence],
  )

  const setQuadrant = useCallback(
    async (id: string, quadrant: EisenhowerQuadrant) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      await saveTask({ ...task, quadrant })
      await refresh()
    },
    [tasks, refresh],
  )

  const processInboxItem = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      await saveTask(
        normalizeTask({
          ...task,
          ...updates,
          workflowStatus: updates.workflowStatus ?? 'open',
        }),
      )
      await refresh()
    },
    [tasks, refresh],
  )

  const toggleTaskDone = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      const done = task.status !== 'done'
      await saveTask({
        ...task,
        status: done ? 'done' : 'open',
        workflowStatus: done ? 'done' : 'open',
        completedAt: done ? new Date().toISOString() : undefined,
      })
      if (done) await spawnNextOccurrence(task)
      await refresh()
    },
    [tasks, refresh, spawnNextOccurrence],
  )

  const setTop3 = useCallback(
    async (taskIds: string[]) => {
      const today = todayISO()
      const selected = new Set(taskIds.slice(0, 3))
      await Promise.all(
        tasks.map((task) => {
          const isSelected = selected.has(task.id)
          const wasTop3 = task.isTop3 && task.top3Date === today
          if (isSelected === wasTop3) return Promise.resolve()
          return saveTask({
            ...task,
            isTop3: isSelected,
            top3Date: isSelected ? today : undefined,
          })
        }),
      )
      await refresh()
    },
    [tasks, refresh],
  )

  const addWeeklyGoal = useCallback(
    async (title: string, weekStart = startOfWeekISO()) => {
      const goal: WeeklyGoal = {
        id: generateId(),
        weekStart,
        title: title.trim(),
        done: false,
        createdAt: new Date().toISOString(),
      }
      await saveWeeklyGoal(goal)
      await refresh()
      return goal
    },
    [refresh],
  )

  const toggleWeeklyGoal = useCallback(
    async (id: string) => {
      const goal = weeklyGoals.find((g) => g.id === id)
      if (!goal) return
      await saveWeeklyGoal({ ...goal, done: !goal.done })
      await refresh()
    },
    [weeklyGoals, refresh],
  )

  const removeWeeklyGoal = useCallback(
    async (id: string) => {
      await deleteWeeklyGoal(id)
      await refresh()
    },
    [refresh],
  )

  const syncMeetingActionItems = useCallback(
    async (meeting: Meeting) => {
      const updatedItems: ActionItem[] = []
      for (const item of meeting.actionItems) {
        if (!item.title.trim()) continue
        if (item.taskId) {
          const existing = tasks.find((t) => t.id === item.taskId)
          if (existing) {
            await saveTask({
              ...existing,
              title: item.title,
              dueDate: item.dueDate,
              project: meeting.title,
              sourceMeetingId: meeting.id,
            })
            updatedItems.push(item)
            continue
          }
        }
        const task = await addTask({
          title: item.title,
          priority: 'medium',
          dueDate: item.dueDate,
          project: meeting.title,
          sourceMeetingId: meeting.id,
          workflowStatus: 'open',
        })
        updatedItems.push({ ...item, taskId: task.id })
      }
      return { ...meeting, actionItems: updatedItems }
    },
    [tasks, addTask],
  )

  const addMeeting = useCallback(
    async (input: Omit<Meeting, 'id' | 'createdAt'>) => {
      let meeting: Meeting = {
        ...input,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }
      meeting = await syncMeetingActionItems(meeting)
      await saveMeeting(meeting)
      await refresh()
      return meeting
    },
    [refresh, syncMeetingActionItems],
  )

  const updateMeeting = useCallback(
    async (meeting: Meeting) => {
      const synced = await syncMeetingActionItems(meeting)
      await saveMeeting(synced)
      await refresh()
    },
    [refresh, syncMeetingActionItems],
  )

  const removeMeeting = useCallback(
    async (id: string) => {
      await deleteMeeting(id)
      await refresh()
    },
    [refresh],
  )

  const getRoutineForToday = useCallback(
    async (type: RoutineType) => {
      const routine = await getOrCreateRoutine(type, todayISO())
      await refresh()
      return routine
    },
    [refresh],
  )

  const updateRoutine = useCallback(
    async (routine: RoutineCheck) => {
      await saveRoutine(routine)
      await refresh()
    },
    [refresh],
  )

  const addNote = useCallback(
    async (input: { title: string; content: string; color?: NoteColor }) => {
      const now = new Date().toISOString()
      const note: Note = {
        id: generateId(),
        title: input.title.trim(),
        content: input.content,
        color: input.color ?? 'slate',
        pinned: false,
        createdAt: now,
        updatedAt: now,
      }
      await saveNote(note)
      await refresh()
      return note
    },
    [refresh],
  )

  const updateNote = useCallback(
    async (note: Note) => {
      await saveNote({ ...note, updatedAt: new Date().toISOString() })
      await refresh()
    },
    [refresh],
  )

  const removeNote = useCallback(
    async (id: string) => {
      await deleteNote(id)
      await refresh()
    },
    [refresh],
  )

  const logFocusSession = useCallback(
    async (input: { minutes: number; taskId?: string; taskTitle?: string }) => {
      const session: FocusSession = {
        id: generateId(),
        date: todayISO(),
        minutes: input.minutes,
        taskId: input.taskId,
        taskTitle: input.taskTitle,
        completedAt: new Date().toISOString(),
      }
      await saveFocusSession(session)
      await refresh()
    },
    [refresh],
  )

  const exportData = useCallback((): AppExport => {
    return {
      version: 3,
      exportedAt: new Date().toISOString(),
      tasks,
      meetings,
      routines,
      routineTemplates,
      weeklyGoals,
      notes,
      focusSessions,
    }
  }, [tasks, meetings, routines, routineTemplates, weeklyGoals, notes, focusSessions])

  const importData = useCallback(
    async (data: AppExport) => {
      await importAllData({
        tasks: data.tasks,
        meetings: data.meetings,
        routines: data.routines,
        routineTemplates: data.routineTemplates,
        weeklyGoals: data.weeklyGoals ?? [],
        notes: data.notes ?? [],
        focusSessions: data.focusSessions ?? [],
      })
      await refresh()
    },
    [refresh],
  )

  const value = useMemo(
    () => ({
      loading,
      tasks,
      meetings,
      routines,
      weeklyGoals,
      notes,
      focusSessions,
      routineTemplates,
      inboxCount,
      refresh,
      quickCapture,
      addTask,
      updateTask,
      removeTask,
      removeCompletedTasks,
      setWorkflow,
      setQuadrant,
      processInboxItem,
      toggleTaskDone,
      setTop3,
      addWeeklyGoal,
      toggleWeeklyGoal,
      removeWeeklyGoal,
      addMeeting,
      updateMeeting,
      removeMeeting,
      getRoutineForToday,
      updateRoutine,
      addNote,
      updateNote,
      removeNote,
      logFocusSession,
      exportData,
      importData,
    }),
    [
      loading,
      tasks,
      meetings,
      routines,
      weeklyGoals,
      notes,
      focusSessions,
      routineTemplates,
      inboxCount,
      refresh,
      quickCapture,
      addTask,
      updateTask,
      removeTask,
      removeCompletedTasks,
      setWorkflow,
      setQuadrant,
      processInboxItem,
      toggleTaskDone,
      setTop3,
      addWeeklyGoal,
      toggleWeeklyGoal,
      removeWeeklyGoal,
      addMeeting,
      updateMeeting,
      removeMeeting,
      getRoutineForToday,
      updateRoutine,
      addNote,
      updateNote,
      removeNote,
      logFocusSession,
      exportData,
      importData,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
