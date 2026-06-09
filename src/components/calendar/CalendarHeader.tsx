import type { CalendarView } from '../../types'
import { getViewTitle } from '../../utils/calendar'
import { IcsImportButton } from './IcsImportButton'
import {
  btnNav,
  btnTab,
  btnTabActive,
  card,
  statBlue,
  statGreen,
  statRed,
} from '../ui/classes'

interface CalendarHeaderProps {
  view: CalendarView
  focusDate: string
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  stats: { meetings: number; tasks: number; overdue: number }
}

const views: { key: CalendarView; label: string }[] = [
  { key: 'flow', label: 'Flow' },
  { key: 'month', label: 'Monat' },
  { key: 'day', label: 'Tag' },
]

export function CalendarHeader({
  view,
  focusDate,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  stats,
}: CalendarHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kalender</h1>
          <p className="text-sm text-slate-400">
            Ziehe Termine frei – magnetisches Planungs-Canvas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={statBlue}>{stats.meetings} Meetings</span>
          <span className={statGreen}>{stats.tasks} Aufgaben</span>
          {stats.overdue > 0 && (
            <span className={statRed}>{stats.overdue} überfällig</span>
          )}
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 ${card}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onPrev} className={btnNav} title="Zurück">
            ←
          </button>
          <button type="button" onClick={onToday} className={btnNav}>
            Heute
          </button>
          <button type="button" onClick={onNext} className={btnNav} title="Weiter">
            →
          </button>
          <h2 className="ml-1 text-lg font-semibold text-white">
            {getViewTitle(view, focusDate)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <IcsImportButton
            label="⤓ ICS importieren"
            className={btnNav}
          />
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => onViewChange(v.key)}
                className={view === v.key ? btnTabActive : btnTab}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
