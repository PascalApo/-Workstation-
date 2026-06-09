import { DraggableTaskCard } from './dnd/DraggableTaskCard'
import { TaskDropZone } from './dnd/TaskDropZone'
import { useApp } from '../context/AppContext'
import type { Task } from '../types'
interface Top3BoardProps {
  top3Tasks: Task[]
  candidateTasks: Task[]
}

export function Top3Board({ top3Tasks, candidateTasks }: Top3BoardProps) {
  const { setTop3, toggleTaskDone } = useApp()

  const assignToSlot = async (taskId: string, slotIndex: number) => {
    const slots: (string | null)[] = [0, 1, 2].map(
      (i) => top3Tasks[i]?.id ?? null,
    )
    for (let i = 0; i < 3; i++) {
      if (slots[i] === taskId) slots[i] = null
    }
    slots[slotIndex] = taskId
    await setTop3(slots.filter((id): id is string => !!id))
  }

  const removeFromTop3 = async (taskId: string) => {
    await setTop3(top3Tasks.filter((t) => t.id !== taskId).map((t) => t.id))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Ziehe Aufgaben in die 3 Prioritäts-Slots
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((slot) => {
          const task = top3Tasks[slot]
          return (
            <TaskDropZone
              key={slot}
              label={`#${slot + 1}`}
              hint="Priorität"
              minHeight="min-h-[88px]"
              className="bg-[var(--bg-elevated)] p-2"
              onDropTask={(id) => assignToSlot(id, slot)}
            >
              {task ? (
                <div className="space-y-1">
                  <DraggableTaskCard task={task} compact />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(task.id)}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Erledigt
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromTop3(task.id)}
                      className="text-[10px] text-slate-500 hover:text-red-400"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              ) : null}
            </TaskDropZone>
          )
        })}
      </div>

      {candidateTasks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">
            Verfügbare Aufgaben
          </p>
          <div className="space-y-1.5">
            {candidateTasks.slice(0, 8).map((task) => (
              <DraggableTaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
