import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { todayISO } from '../utils/date'

const POMODORO_WORK = 25 * 60
const POMODORO_BREAK = 5 * 60

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FocusPage() {
  const { tasks, toggleTaskDone, setWorkflow } = useApp()
  const today = todayISO()
  const [seconds, setSeconds] = useState(POMODORO_WORK)
  const [running, setRunning] = useState(false)
  const [onBreak, setOnBreak] = useState(false)

  const focusTask = useMemo(() => {
    const top3 = tasks.find(
      (t) =>
        t.isTop3 &&
        t.top3Date === today &&
        t.status === 'open' &&
        t.workflowStatus !== 'done',
    )
    if (top3) return top3
    return (
      tasks.find(
        (t) => t.workflowStatus === 'in_progress' && t.status === 'open',
      ) ??
      tasks.find(
        (t) =>
          t.workflowStatus === 'open' &&
          t.status === 'open' &&
          t.priority === 'high',
      ) ??
      tasks.find((t) => t.workflowStatus === 'open' && t.status === 'open')
    )
  }, [tasks, today])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false)
          if (!onBreak) {
            setOnBreak(true)
            return POMODORO_BREAK
          }
          setOnBreak(false)
          return POMODORO_WORK
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, onBreak])

  const resetTimer = () => {
    setRunning(false)
    setOnBreak(false)
    setSeconds(POMODORO_WORK)
  }

  if (!focusTask) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-6xl opacity-30">◎</p>
        <h1 className="mt-4 text-2xl font-bold text-white">Alles erledigt!</h1>
        <p className="mt-2 text-slate-400">
          Keine offene Aufgabe für den Fokus-Modus.
        </p>
        <Link
          to="/planen"
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
        >
          Planungs-Hub öffnen
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400">
        Fokus-Modus
      </p>

      <div
        className={`mt-8 rounded-3xl border px-10 py-6 ${
          onBreak
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-indigo-500/30 bg-indigo-500/10'
        }`}
      >
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {onBreak ? 'Pause' : 'Pomodoro'}
        </p>
        <p className="mt-2 font-mono text-5xl font-bold text-white">
          {formatTimer(seconds)}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-500"
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-slate-400"
          >
            Reset
          </button>
        </div>
      </div>

      <h1 className="mt-8 text-3xl font-bold leading-tight text-white lg:text-4xl">
        {focusTask.title}
      </h1>
      {focusTask.project && (
        <p className="mt-3 text-slate-400">{focusTask.project}</p>
      )}
      {focusTask.description && (
        <p className="mt-4 max-w-md text-sm text-slate-500">
          {focusTask.description}
        </p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setWorkflow(focusTask.id, 'in_progress')}
          className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-5 py-2.5 text-sm font-medium text-violet-200"
        >
          In Arbeit
        </button>
        <button
          type="button"
          onClick={() => toggleTaskDone(focusTask.id)}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Erledigt
        </button>
      </div>

      <Link
        to="/"
        className="mt-8 text-sm text-slate-600 hover:text-slate-400"
      >
        ← Zurück zur Kommandozentrale
      </Link>
    </div>
  )
}
