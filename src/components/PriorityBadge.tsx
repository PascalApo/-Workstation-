import { PRIORITY_LABELS } from '../constants/defaults'
import type { Priority } from '../types'

const styles: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30',
  medium: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
