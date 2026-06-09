import { useEffect, useState } from 'react'
import { RoutineChecklist } from '../components/RoutineChecklist'
import { ROUTINE_LABELS } from '../constants/defaults'
import { btnTab, btnTabActive, card } from '../components/ui/classes'
import { useApp } from '../context/AppContext'
import { copyToClipboard } from '../integrations/clipboard'
import { formatWeeklyReviewMarkdown, downloadMarkdown } from '../integrations/markdown'
import { formatWeeklyReview, printWeeklyReview } from '../integrations/weeklyReview'
import type { RoutineCheck, RoutineType } from '../types'
import { todayISO } from '../utils/date'

const tabs: RoutineType[] = ['daily_morning', 'daily_evening', 'weekly_review']

export function RoutinePage() {
  const { getRoutineForToday, updateRoutine, tasks, meetings, weeklyGoals } =
    useApp()
  const [activeTab, setActiveTab] = useState<RoutineType>('daily_morning')
  const [routine, setRoutine] = useState<RoutineCheck | null>(null)
  const [reviewMsg, setReviewMsg] = useState('')

  useEffect(() => {
    getRoutineForToday(activeTab).then(setRoutine)
  }, [activeTab, getRoutineForToday])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Routine</h1>
        <p className="mt-1 text-slate-400">
          Strukturiere deinen Tag mit festen Checklisten
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? btnTabActive : btnTab}
          >
            {ROUTINE_LABELS[tab]}
          </button>
        ))}
      </div>

      {routine ? (
        <section className={`p-6 ${card}`}>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {ROUTINE_LABELS[activeTab]}
          </h2>
          <RoutineChecklist
            routine={routine}
            onUpdate={async (updated) => {
              await updateRoutine(updated)
              setRoutine(updated)
            }}
            showNotes={activeTab === 'daily_evening' || activeTab === 'weekly_review'}
          />
        </section>
      ) : (
        <p className="text-slate-500">Lade Routine...</p>
      )}

      {activeTab === 'weekly_review' && (
        <section className={`p-5 ${card}`}>
          <h2 className="mb-3 font-semibold text-white">Wochen-Review exportieren</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await copyToClipboard(
                  formatWeeklyReview(tasks, meetings, weeklyGoals),
                )
                setReviewMsg(ok ? 'Kopiert!' : 'Fehler')
                setTimeout(() => setReviewMsg(''), 2000)
              }}
              className={btnTabActive}
            >
              Kopieren
            </button>
            <button
              type="button"
              onClick={() => {
                downloadMarkdown(
                  formatWeeklyReviewMarkdown(tasks, meetings, weeklyGoals),
                  `wochen-review-${todayISO()}.md`,
                )
                setReviewMsg('Markdown gespeichert')
                setTimeout(() => setReviewMsg(''), 2000)
              }}
              className={btnTab}
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => printWeeklyReview(tasks, meetings, weeklyGoals)}
              className={btnTab}
            >
              Drucken / PDF
            </button>
          </div>
          {reviewMsg && (
            <p className="mt-2 text-sm text-emerald-400">{reviewMsg}</p>
          )}
        </section>
      )}

      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5 text-sm text-indigo-200">
        <p className="font-medium text-indigo-100">Tipp für deinen Consultant-Alltag</p>
        <p className="mt-1 text-indigo-200/80">
          Nutze die Morgen-Routine bevor du in Meetings gehst, und den
          Abend-Rückblick um Follow-ups nicht zu vergessen. Freitags das
          Wochen-Review für die Planung der nächsten Woche.
        </p>
      </div>
    </div>
  )
}
