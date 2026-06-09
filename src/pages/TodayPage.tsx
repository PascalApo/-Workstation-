import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NextMeetingWidget } from '../components/NextMeetingWidget'
import { PageHeader } from '../components/PageHeader'
import { RoutineChecklist } from '../components/RoutineChecklist'
import { Top3Board } from '../components/Top3Board'
import { TaskItem } from '../components/TaskItem'
import { useApp } from '../context/AppContext'
import type { RoutineCheck } from '../types'
import {
  formatDayPlan,
  copyToClipboard,
} from '../integrations/clipboard'
import {
  formatDateLongDE,
  isOverdue,
  isThisWeek,
  todayISO,
} from '../utils/date'
import {
  activityByDay,
  calcStreak,
  productivityScore,
} from '../utils/insights'

export function TodayPage() {
  const {
    loading,
    tasks,
    meetings,
    routines,
    focusSessions,
    inboxCount,
    toggleTaskDone,
    getRoutineForToday,
    updateRoutine,
  } = useApp()
  const [morningRoutine, setMorningRoutine] = useState<RoutineCheck | null>(null)
  const [copyMsg, setCopyMsg] = useState('')
  const today = todayISO()

  const handleCopyPlan = async () => {
    const ok = await copyToClipboard(formatDayPlan(tasks, meetings, today))
    setCopyMsg(ok ? 'Kopiert!' : 'Fehler')
    setTimeout(() => setCopyMsg(''), 2000)
  }

  useEffect(() => {
    getRoutineForToday('daily_morning').then(setMorningRoutine)
  }, [getRoutineForToday])

  if (loading) {
    return <p className="text-slate-500">Lade...</p>
  }

  const openTasks = tasks.filter((t) => t.status === 'open')
  const top3Tasks = tasks.filter(
    (t) => t.isTop3 && t.top3Date === today && t.status === 'open',
  )
  const todayMeetings = meetings.filter((m) => m.date === today)
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueDate, t.status))
  const inProgress = openTasks.filter((t) => t.workflowStatus === 'in_progress')
  const weekCount = openTasks.filter(
    (t) => t.dueDate && isThisWeek(t.dueDate),
  ).length
  const score = productivityScore(tasks, focusSessions, routines)
  const streak = calcStreak(activityByDay(tasks, focusSessions, 60))

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Kommandozentrale"
        subtitle={formatDateLongDE(today)}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyPlan}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              {copyMsg || 'Tagesplan kopieren'}
            </button>
            <Link
              to="/fokus"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              ◎ Fokus starten
            </Link>
          </div>
        }
      />

      <NextMeetingWidget />

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5 text-xs text-indigo-200">
        Ziehe Aufgaben in die Top-3-Slots · Kalender & Planungs-Hub unterstützen
        Drag & Drop
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link
          to="/insights"
          className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 transition-colors hover:border-indigo-400/50 sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-indigo-300">
                {score.total}
                <span className="text-sm font-normal text-slate-500"> / 100</span>
              </p>
              <p className="text-xs text-slate-500">Produktivitäts-Score</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-300">
                {streak > 0 ? streak : '–'}
              </p>
              <p className="text-xs text-slate-500">
                Tage-Streak
              </p>
            </div>
          </div>
        </Link>
        {[
          { label: 'Eingang', value: inboxCount, color: 'text-amber-400', to: '/planen?tab=kanban' },
          { label: 'In Arbeit', value: inProgress.length, color: 'text-violet-400', to: '/planen' },
          { label: 'Diese Woche', value: weekCount, color: 'text-blue-400', to: '/planen?tab=week' },
          { label: 'Meetings heute', value: todayMeetings.length, color: 'text-emerald-400', to: '/kalender' },
        ].map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-4 transition-colors hover:border-indigo-500/30"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {inboxCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {inboxCount} Gedanke{inboxCount !== 1 ? 'n' : ''} im Eingang –{' '}
          <Link to="/planen" className="font-medium underline">
            jetzt verarbeiten
          </Link>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Top 3 heute</h2>
            <Link to="/planen?tab=matrix" className="text-xs text-indigo-400">
              Priorisieren →
            </Link>
          </div>
          <Top3Board
            top3Tasks={top3Tasks}
            candidateTasks={openTasks.filter(
              (t) => !top3Tasks.some((top) => top.id === t.id),
            )}
          />
        </section>

        {morningRoutine && (
          <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-5">
            <div className="mb-4 flex justify-between">
              <h2 className="font-semibold text-white">Morgen-Routine</h2>
              <Link to="/routine" className="text-xs text-indigo-400">
                Alle →
              </Link>
            </div>
            <RoutineChecklist
              routine={morningRoutine}
              onUpdate={async (r) => {
                await updateRoutine(r)
                setMorningRoutine(r)
              }}
            />
          </section>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-5">
          <h2 className="mb-4 font-semibold text-white">
            Überfällig ({overdueTasks.length})
          </h2>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-slate-500">Nichts überfällig.</p>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTaskDone} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-5">
          <h2 className="mb-4 font-semibold text-white">Meetings heute</h2>
          {todayMeetings.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Meetings.</p>
          ) : (
            <div className="space-y-2">
              {todayMeetings.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <p className="text-sm font-medium text-white">{m.title}</p>
                  {m.startTime && (
                    <p className="text-xs text-slate-500">{m.startTime}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link
            to="/kalender"
            className="mt-3 inline-block text-xs text-indigo-400"
          >
            Flow-Kalender →
          </Link>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { to: '/planen', label: 'Planungs-Hub', desc: 'Kanban · Matrix · Woche' },
          { to: '/kalender', label: 'Flow-Kalender', desc: 'Drag & Drop Planung' },
          { to: '/projekte', label: 'Projekte', desc: 'Nach Kunde gruppiert' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-4 hover:border-indigo-500/30"
          >
            <p className="font-medium text-white">{item.label}</p>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
