import { PRIORITY_LABELS } from '../../constants/defaults'
import { useCalendarDrag } from '../../context/CalendarDragContext'
import type { CalendarEvent, Task } from '../../types'
import { card } from '../ui/classes'

interface UnscheduledPanelProps {
  tasks: Task[]
}

function taskToEvent(task: Task): CalendarEvent {
  return {
    id: `task-${task.id}`,
    sourceId: task.id,
    type: 'task',
    title: task.title,
    date: '',
    priority: task.priority,
    status: task.status,
    project: task.project,
  }
}

export function UnscheduledPanel({ tasks }: UnscheduledPanelProps) {
  const { startDrag, isDragging } = useCalendarDrag()

  return (
    <div className={`border-dashed ${card}`}>
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-white">Inbox – Ungeplant</h3>
        <p className="text-xs text-slate-500">
          Ziehe Aufgaben auf den Kalender zum Einplanen
        </p>
      </div>
      <div
        className={`max-h-[280px] space-y-2 overflow-y-auto p-3 transition-all ${
          isDragging ? 'bg-violet-500/10' : ''
        }`}
      >
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Alle Aufgaben sind eingeplant.
          </p>
        ) : (
          tasks.map((task) => {
            const event = taskToEvent(task)
            return (
              <div
                key={task.id}
                onPointerDown={(e) => startDrag(event, e)}
                className="cursor-grab touch-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-all hover:border-violet-500/40 hover:bg-white/10 active:cursor-grabbing active:scale-95 active:border-violet-500/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">⋮⋮</span>
                  <p className="text-sm font-medium text-slate-200">
                    {task.title}
                  </p>
                </div>
                <p className="mt-0.5 pl-6 text-xs text-slate-500">
                  {PRIORITY_LABELS[task.priority]}
                  {task.project && ` · ${task.project}`}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
