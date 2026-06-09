import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Meeting, Task } from '../../types'

interface TaskDragContextValue {
  draggingTask: Task | null
  draggingMeeting: Meeting | null
  setDraggingTask: (task: Task | null) => void
  setDraggingMeeting: (meeting: Meeting | null) => void
}

const TaskDragContext = createContext<TaskDragContextValue | null>(null)

export function TaskDragProvider({ children }: { children: ReactNode }) {
  const [draggingTask, setDraggingTask] = useState<Task | null>(null)
  const [draggingMeeting, setDraggingMeeting] = useState<Meeting | null>(null)

  return (
    <TaskDragContext.Provider
      value={{
        draggingTask,
        draggingMeeting,
        setDraggingTask,
        setDraggingMeeting,
      }}
    >
      {children}
      <TaskDragGhost />
    </TaskDragContext.Provider>
  )
}

function TaskDragGhost() {
  const ctx = useContext(TaskDragContext)
  if (!ctx?.draggingTask && !ctx?.draggingMeeting) return null

  const label = ctx.draggingTask?.title ?? ctx.draggingMeeting?.title ?? ''

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-indigo-500/50 bg-indigo-600/90 px-4 py-2 text-sm font-medium text-white shadow-2xl shadow-indigo-500/30">
      <span className="mr-2 opacity-70">⋮⋮</span>
      {label}
    </div>
  )
}

export function useTaskDrag() {
  const ctx = useContext(TaskDragContext)
  if (!ctx) throw new Error('useTaskDrag must be used within TaskDragProvider')
  return ctx
}

export function useTaskDragOptional() {
  return useContext(TaskDragContext)
}
