import { useEffect, useRef, useState } from 'react'
import { FileDropZone } from '../components/dnd/FileDropZone'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import {
  allDataToCsv,
  downloadCsv,
  isDuplicateMeeting,
  isDuplicateTask,
  parseCsvMeetings,
  parseCsvTasks,
  parseCsvWeeklyGoals,
} from '../integrations/csv'
import { formatDayPlan, copyToClipboard, shareText } from '../integrations/clipboard'
import {
  parseIcsFile,
  icsEventsToMeetings,
  generateIcs,
  downloadIcs,
} from '../integrations/ics'
import {
  formatDayPlanMarkdown,
  formatWeeklyReviewMarkdown,
  downloadMarkdown,
} from '../integrations/markdown'
import {
  getReminderSettings,
  requestNotificationPermission,
  saveReminderSettings,
} from '../integrations/reminders'
import { formatWeeklyReview, printWeeklyReview } from '../integrations/weeklyReview'
import { isStandalone, onInstallAvailable, promptInstall } from '../pwa'
import { todayISO } from '../utils/date'

export function IntegrationsPage() {
  const { tasks, meetings, weeklyGoals, addMeeting, addTask, addWeeklyGoal, exportData } =
    useApp()
  const [message, setMessage] = useState('')
  const [reminders, setReminders] = useState(getReminderSettings)
  const [installAvailable, setInstallAvailable] = useState(false)
  const [installed, setInstalled] = useState(isStandalone)
  const icsImportRef = useRef<HTMLInputElement>(null)
  const csvImportRef = useRef<HTMLInputElement>(null)

  useEffect(() => onInstallAvailable(setInstallAvailable), [])

  const handleInstall = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      setInstalled(true)
      notify('App installiert – ab jetzt im eigenen Fenster nutzbar.')
    } else if (outcome === 'dismissed') {
      notify('Installation abgebrochen.')
    } else {
      notify(
        'Installation aktuell nicht verfügbar – über das ⊕-Symbol in der Adressleiste installieren.',
      )
    }
  }

  const notify = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  const saveReminders = () => {
    saveReminderSettings(reminders)
    notify('Erinnerungs-Einstellungen gespeichert.')
  }

  const handleEnableNotifications = async () => {
    const ok = await requestNotificationPermission()
    notify(
      ok
        ? 'Benachrichtigungen aktiviert.'
        : 'Berechtigung verweigert – in Browser-Einstellungen erlauben.',
    )
  }

  const handleIcsExport = () => {
    downloadIcs(generateIcs(meetings, tasks), `ssp-kalender-${todayISO()}.ics`)
    notify('Kalender-Datei (.ics) heruntergeladen.')
  }

  const importIcsFile = async (file: File) => {
    try {
      const events = parseIcsFile(await file.text())
      const payloads = icsEventsToMeetings(events)
      let count = 0
      for (const p of payloads) {
        if (isDuplicateMeeting(meetings, p)) continue
        await addMeeting(p)
        count++
      }
      notify(`${count} Termine importiert.`)
    } catch {
      notify('ICS-Import fehlgeschlagen.')
    }
  }

  const handleIcsImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await importIcsFile(file)
    if (icsImportRef.current) icsImportRef.current.value = ''
  }

  const handleCsvExport = () => {
    downloadCsv(
      allDataToCsv(tasks, meetings, weeklyGoals),
      `ssp-export-${todayISO()}.csv`,
    )
    notify('CSV-Export heruntergeladen.')
  }

  const importCsvFile = async (file: File) => {
    try {
      const text = await file.text()
      const taskRows = parseCsvTasks(text)
      const meetingRows = parseCsvMeetings(text)
      const goalRows = parseCsvWeeklyGoals(text)
      let t = 0
      let m = 0
      let g = 0
      for (const row of taskRows) {
        if (isDuplicateTask(tasks, row)) continue
        await addTask(row)
        t++
      }
      for (const row of meetingRows) {
        if (isDuplicateMeeting(meetings, row)) continue
        await addMeeting({ ...row, actionItems: [] })
        m++
      }
      for (const row of goalRows) {
        await addWeeklyGoal(row.title, row.weekStart)
        g++
      }
      notify(`Import: ${t} Aufgaben, ${m} Meetings, ${g} Wochenziele.`)
    } catch {
      notify('CSV-Import fehlgeschlagen.')
    }
  }

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await importCsvFile(file)
    if (csvImportRef.current) csvImportRef.current.value = ''
  }

  const handleJsonExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ssp-workstation-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
    notify('JSON-Backup heruntergeladen.')
  }

  const cards = [
    {
      id: 'pwa',
      name: 'Als App installieren',
      icon: '🖥️',
      color: 'border-indigo-500/30 bg-indigo-500/5',
      desc: installed
        ? 'Läuft bereits als installierte App – eigenes Fenster, Taskleisten-Icon, Badge für überfällige Aufgaben.'
        : 'Eigenes Fenster, Taskleisten-Icon, Offline-Start und Badge für überfällige Aufgaben – ohne Browser-Tabs.',
      actions: installed ? (
        <p className="text-xs font-medium text-emerald-400">✓ Installiert</p>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            Jetzt installieren
          </button>
          {!installAvailable && (
            <p className="text-[11px] text-slate-500">
              Alternativ: ⊕-Symbol rechts in der Chrome-Adressleiste →
              „Installieren“.
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'calendar',
      name: 'Kalender (.ics)',
      icon: '📅',
      color: 'border-blue-500/30 bg-blue-500/5',
      desc: 'Standardformat – funktioniert mit Google Kalender, Thunderbird, Apple Kalender.',
      actions: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleIcsExport}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            Exportieren
          </button>
          <label className="cursor-pointer rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            Importieren
            <input
              ref={icsImportRef}
              type="file"
              accept=".ics"
              className="hidden"
              onChange={handleIcsImport}
            />
          </label>
        </div>
      ),
    },
    {
      id: 'csv',
      name: 'Tabellen (CSV)',
      icon: '📊',
      color: 'border-emerald-500/30 bg-emerald-500/5',
      desc: 'LibreOffice Calc, Google Sheets – Aufgaben, Meetings, Wochenziele.',
      actions: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCsvExport}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Exportieren
          </button>
          <label className="cursor-pointer rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            Importieren
            <input
              ref={csvImportRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvImport}
            />
          </label>
        </div>
      ),
    },
    {
      id: 'clipboard',
      name: 'Tagesplan teilen',
      icon: '📋',
      color: 'border-violet-500/30 bg-violet-500/5',
      desc: 'Kopieren oder über System-Dialog teilen (Handy, E-Mail-App).',
      actions: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              const ok = await copyToClipboard(formatDayPlan(tasks, meetings))
              notify(ok ? 'Tagesplan kopiert!' : 'Fehler')
            }}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            Kopieren
          </button>
          <button
            type="button"
            onClick={async () => {
              const ok = await shareText(
                formatDayPlan(tasks, meetings),
                'Tagesplan',
              )
              notify(ok ? 'Geteilt!' : 'Teilen nicht verfügbar')
            }}
            className="rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/10"
          >
            System-Teilen
          </button>
        </div>
      ),
    },
    {
      id: 'markdown',
      name: 'Markdown',
      icon: '📝',
      color: 'border-cyan-500/30 bg-cyan-500/5',
      desc: 'Für Notizen-Apps, Obsidian, GitHub – strukturierte Exporte.',
      actions: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              downloadMarkdown(
                formatDayPlanMarkdown(tasks, meetings),
                `tagesplan-${todayISO()}.md`,
              )
              notify('Tagesplan als Markdown gespeichert.')
            }}
            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500"
          >
            Tagesplan
          </button>
          <button
            type="button"
            onClick={() => {
              downloadMarkdown(
                formatWeeklyReviewMarkdown(tasks, meetings, weeklyGoals),
                `wochen-review-${todayISO()}.md`,
              )
              notify('Wochen-Review als Markdown gespeichert.')
            }}
            className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs text-cyan-300"
          >
            Wochen-Review
          </button>
        </div>
      ),
    },
    {
      id: 'weekly',
      name: 'Wochen-Review',
      icon: '📈',
      color: 'border-amber-500/30 bg-amber-500/5',
      desc: 'Wochenziele, Aufgaben und Follow-ups zusammenfassen.',
      actions: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              const ok = await copyToClipboard(
                formatWeeklyReview(tasks, meetings, weeklyGoals),
              )
              notify(ok ? 'Kopiert!' : 'Fehler')
            }}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
          >
            Kopieren
          </button>
          <button
            type="button"
            onClick={() => printWeeklyReview(tasks, meetings, weeklyGoals)}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            Drucken / PDF
          </button>
        </div>
      ),
    },
    {
      id: 'backup',
      name: 'JSON-Backup',
      icon: '💾',
      color: 'border-slate-500/30 bg-slate-500/5',
      desc: 'Vollständiges Backup aller Daten – auch unter Einstellungen.',
      actions: (
        <button
          type="button"
          onClick={handleJsonExport}
          className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-500"
        >
          Backup herunterladen
        </button>
      ),
    },
    {
      id: 'reminders',
      name: 'Erinnerungen',
      icon: '🔔',
      color: 'border-rose-500/30 bg-rose-500/5',
      desc: 'Browser-Benachrichtigungen – kostenlos, keine Cloud nötig.',
      actions: (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={reminders.enabled}
              onChange={(e) =>
                setReminders({ ...reminders, enabled: e.target.checked })
              }
              className="rounded border-white/20"
            />
            Erinnerungen aktiv
          </label>
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
          >
            Browser-Berechtigung
          </button>
          <button
            type="button"
            onClick={saveReminders}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300"
          >
            Speichern
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Export & Tools"
        subtitle="Kostenfreie Formate – alles lokal, keine Cloud-Accounts nötig"
      />

      {message && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <h3 className="font-semibold text-indigo-200">100 % kostenfrei</h3>
        <p className="mt-2 text-sm text-indigo-200/80">
          Alle Funktionen laufen im Browser. Kein Microsoft-, Google- oder
          Teams-Account erforderlich. Daten bleiben auf deinem Rechner.
        </p>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <FileDropZone
          accept=".ics"
          label=".ics-Datei hierher ziehen (Kalender-Import)"
          onFile={importIcsFile}
        />
        <FileDropZone
          accept=".csv"
          label=".csv-Datei hierher ziehen (Tabellen-Import)"
          onFile={importCsvFile}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <div key={card.id} className={`rounded-2xl border p-5 ${card.color}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{card.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{card.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{card.desc}</p>
                <div className="mt-4">{card.actions}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
