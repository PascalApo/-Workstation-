import { useMemo } from 'react'
import { card, emptyState } from '../components/ui/classes'
import { useApp } from '../context/AppContext'
import {
  activityByDay,
  calcStreak,
  openByProject,
  productivityScore,
} from '../utils/insights'
import { todayISO } from '../utils/date'

const HEATMAP_WEEKS = 17
const WEEKDAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So']

function heatLevel(completed: number, focusMinutes: number): number {
  const score = completed + focusMinutes / 25
  if (score <= 0) return 0
  if (score < 1.5) return 1
  if (score < 3) return 2
  if (score < 5) return 3
  return 4
}

const HEAT_COLORS = [
  'bg-white/[0.04]',
  'bg-indigo-500/25',
  'bg-indigo-500/45',
  'bg-indigo-400/70',
  'bg-indigo-300',
]

export function InsightsPage() {
  const { tasks, focusSessions, routines, meetings } = useApp()
  const today = todayISO()

  const score = useMemo(
    () => productivityScore(tasks, focusSessions, routines),
    [tasks, focusSessions, routines],
  )

  const last14 = useMemo(
    () => activityByDay(tasks, focusSessions, 14),
    [tasks, focusSessions],
  )

  // Heatmap: bis zum heutigen Wochentag auffüllen, damit Spalten = Wochen (Mo–So)
  const heatmapDays = useMemo(() => {
    const todayDate = new Date(today + 'T12:00:00')
    const weekday = (todayDate.getDay() + 6) % 7 // 0 = Montag
    const total = (HEATMAP_WEEKS - 1) * 7 + weekday + 1
    return activityByDay(tasks, focusSessions, total)
  }, [tasks, focusSessions, today])

  const streak = useMemo(() => calcStreak(heatmapDays), [heatmapDays])

  const projects = useMemo(() => openByProject(tasks).slice(0, 6), [tasks])
  const maxProject = projects[0]?.count ?? 1

  const stats = useMemo(() => {
    const doneToday = tasks.filter(
      (t) => t.completedAt?.slice(0, 10) === today,
    ).length
    const doneWeek = last14
      .slice(-7)
      .reduce((sum, d) => sum + d.completed, 0)
    const focusWeek = last14
      .slice(-7)
      .reduce((sum, d) => sum + d.focusMinutes, 0)
    const open = tasks.filter((t) => t.status === 'open').length
    const overdue = tasks.filter(
      (t) => t.status === 'open' && t.dueDate && t.dueDate < today,
    ).length
    const meetingsWeek = meetings.filter((m) => {
      const diff =
        (new Date(today + 'T12:00:00').getTime() -
          new Date(m.date + 'T12:00:00').getTime()) /
        86400000
      return diff >= 0 && diff < 7
    }).length
    return { doneToday, doneWeek, focusWeek, open, overdue, meetingsWeek }
  }, [tasks, meetings, last14, today])

  const maxBar = Math.max(1, ...last14.map((d) => d.completed))
  const hasAnyData =
    tasks.length > 0 || focusSessions.length > 0 || meetings.length > 0

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Insights</h1>
        <p className="mt-1 text-slate-400">
          Deine Produktivität auf einen Blick – alles lokal berechnet
        </p>
      </div>

      {!hasAnyData ? (
        <p className={emptyState}>
          Noch keine Daten. Erledige Aufgaben, starte Pomodoros – hier entsteht
          dein Dashboard.
        </p>
      ) : (
        <>
          {/* Score + KPIs */}
          <div className="grid gap-4 lg:grid-cols-3">
            <section className={`p-6 ${card}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Produktivitäts-Score heute
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-5xl font-bold text-white">{score.total}</p>
                <p className="pb-1.5 text-sm text-slate-500">/ 100</p>
              </div>
              <div className="mt-4 space-y-2">
                {score.parts.map((part) => (
                  <div key={part.label}>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{part.label}</span>
                      <span>
                        {part.points}/{part.max}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-white/5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${(part.points / part.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              {[
                { label: 'Erledigt heute', value: stats.doneToday, accent: 'text-emerald-300' },
                { label: 'Erledigt (7 Tage)', value: stats.doneWeek, accent: 'text-emerald-300' },
                { label: 'Streak', value: `${streak} Tag${streak !== 1 ? 'e' : ''}`, accent: 'text-amber-300' },
                { label: 'Fokus (7 Tage)', value: `${stats.focusWeek} Min.`, accent: 'text-indigo-300' },
                { label: 'Offen gesamt', value: stats.open, accent: 'text-slate-200' },
                {
                  label: 'Überfällig',
                  value: stats.overdue,
                  accent: stats.overdue > 0 ? 'text-red-400' : 'text-emerald-300',
                },
              ].map((kpi) => (
                <section key={kpi.label} className={`px-5 py-4 ${card}`}>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${kpi.accent}`}>
                    {kpi.value}
                  </p>
                </section>
              ))}
            </div>
          </div>

          {/* 14-Tage-Trend */}
          <section className={`p-6 ${card}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Letzte 14 Tage</h2>
              <div className="flex gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Erledigt
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-indigo-400" /> Fokus-Min.
                </span>
              </div>
            </div>
            <div className="mt-4 flex h-36 items-end gap-1.5">
              {last14.map((day) => {
                const maxFocus = Math.max(25, ...last14.map((d) => d.focusMinutes))
                const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString(
                  'de-DE',
                  { day: 'numeric' },
                )
                return (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col items-center gap-1"
                    title={`${day.date}: ${day.completed} erledigt, ${day.focusMinutes} Fokus-Min.`}
                  >
                    <div className="flex h-28 w-full items-end justify-center gap-0.5">
                      <div
                        className={`w-1/3 rounded-t ${day.completed > 0 ? 'bg-emerald-400/80' : 'bg-white/5'}`}
                        style={{
                          height: `${Math.max(4, (day.completed / maxBar) * 100)}%`,
                        }}
                      />
                      <div
                        className={`w-1/3 rounded-t ${day.focusMinutes > 0 ? 'bg-indigo-400/80' : 'bg-white/5'}`}
                        style={{
                          height: `${Math.max(4, (day.focusMinutes / maxFocus) * 100)}%`,
                        }}
                      />
                    </div>
                    <p
                      className={`text-[10px] ${day.date === today ? 'font-bold text-indigo-300' : 'text-slate-600'}`}
                    >
                      {dayLabel}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Heatmap + Projekte */}
          <div className="grid gap-4 lg:grid-cols-5">
            <section className={`overflow-x-auto p-6 lg:col-span-3 ${card}`}>
              <h2 className="font-semibold text-white">Aktivitäts-Heatmap</h2>
              <p className="mt-1 text-xs text-slate-500">
                Letzte {HEATMAP_WEEKS} Wochen · Aufgaben + Fokus-Sessions
              </p>
              <div className="mt-4 flex gap-1.5">
                <div className="mr-1 grid grid-rows-7 gap-1 text-right">
                  {WEEKDAY_LABELS.map((lbl, i) => (
                    <span key={i} className="h-3 text-[9px] leading-3 text-slate-600">
                      {lbl}
                    </span>
                  ))}
                </div>
                {Array.from(
                  { length: Math.ceil(heatmapDays.length / 7) },
                  (_, week) => (
                    <div key={week} className="grid grid-rows-7 gap-1">
                      {Array.from({ length: 7 }, (_, dow) => {
                        const day = heatmapDays[week * 7 + dow]
                        if (!day) return <span key={dow} className="h-3 w-3" />
                        const level = heatLevel(day.completed, day.focusMinutes)
                        return (
                          <span
                            key={dow}
                            title={`${day.date}: ${day.completed} erledigt, ${day.focusMinutes} Fokus-Min.`}
                            className={`h-3 w-3 rounded-[3px] ${HEAT_COLORS[level]} ${day.date === today ? 'ring-1 ring-indigo-300' : ''}`}
                          />
                        )
                      })}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
                Weniger
                {HEAT_COLORS.map((c, i) => (
                  <span key={i} className={`h-3 w-3 rounded-[3px] ${c}`} />
                ))}
                Mehr
              </div>
            </section>

            <section className={`p-6 lg:col-span-2 ${card}`}>
              <h2 className="font-semibold text-white">Offene Aufgaben je Projekt</h2>
              {projects.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Keine offenen Aufgaben – stark!
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {projects.map((p) => (
                    <div key={p.project}>
                      <div className="flex justify-between text-xs">
                        <span className="truncate text-slate-300">{p.project}</span>
                        <span className="ml-2 shrink-0 text-slate-500">{p.count}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                          style={{ width: `${(p.count / maxProject) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">
                {stats.meetingsWeek} Meeting{stats.meetingsWeek !== 1 ? 's' : ''} in
                den letzten 7 Tagen
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
