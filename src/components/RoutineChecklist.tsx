import type { RoutineCheck } from '../types'
import { input, label } from './ui/classes'

interface RoutineChecklistProps {
  routine: RoutineCheck
  onUpdate: (routine: RoutineCheck) => void
  showNotes?: boolean
}

export function RoutineChecklist({
  routine,
  onUpdate,
  showNotes = false,
}: RoutineChecklistProps) {
  const doneCount = routine.items.filter((i) => i.done).length
  const total = routine.items.length
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const toggleItem = (itemId: string) => {
    onUpdate({
      ...routine,
      items: routine.items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex justify-between text-sm text-slate-400">
          <span>
            {doneCount} von {total} erledigt
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {routine.items.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-indigo-500/30">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item.id)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-indigo-500"
              />
              <span
                className={
                  item.done ? 'text-slate-500 line-through' : 'text-slate-200'
                }
              >
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {showNotes && (
        <div>
          <label className={label}>Notizen / Tagesrückblick</label>
          <textarea
            value={routine.notes ?? ''}
            onChange={(e) => onUpdate({ ...routine, notes: e.target.value })}
            rows={4}
            placeholder="Was war heute wichtig? Was nimmst du mit?"
            className={input}
          />
        </div>
      )}
    </div>
  )
}
