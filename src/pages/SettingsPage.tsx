import { useRef, useState } from 'react'
import { clearAllData } from '../db/database'
import { useApp } from '../context/AppContext'
import type { AppExport } from '../types'
import { btnPrimary, card } from '../components/ui/classes'

export function SettingsPage() {
  const { exportData, importData, refresh, removeCompletedTasks, tasks } =
    useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ssp-alltag-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Backup wurde heruntergeladen.')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as AppExport
      if (!data.tasks || !data.meetings || !data.routines || data.version < 1) {
        throw new Error('Ungültiges Backup-Format')
      }
      await importData(data)
      setMessage('Backup erfolgreich importiert.')
    } catch {
      setMessage('Fehler beim Import. Bitte gültige JSON-Datei wählen.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleReset = async () => {
    if (
      !confirm(
        'Wirklich alle Daten löschen? Erstelle vorher ein Backup!',
      )
    ) {
      return
    }
    await clearAllData()
    await refresh()
    setMessage('Alle Daten wurden zurückgesetzt.')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Backup & Daten</h1>
        <p className="mt-1 text-slate-400">
          Sichere deine Daten regelmäßig als JSON-Datei
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <section className={`space-y-4 p-6 ${card}`}>
        <h2 className="text-lg font-semibold text-white">Export</h2>
        <p className="text-sm text-slate-400">
          Lade alle Aufgaben, Meetings und Routinen als JSON-Datei herunter.
        </p>
        <button onClick={handleExport} className={btnPrimary}>
          Backup herunterladen
        </button>
      </section>

      <section className={`space-y-4 p-6 ${card}`}>
        <h2 className="text-lg font-semibold text-white">Import</h2>
        <p className="text-sm text-slate-400">
          Stelle ein zuvor exportiertes Backup wieder her. Bestehende Daten
          werden überschrieben.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="block text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
        />
      </section>

      <section className={`space-y-4 p-6 ${card}`}>
        <h2 className="text-lg font-semibold text-white">Aufräumen</h2>
        <p className="text-sm text-slate-400">
          Erledigte Aufgaben endgültig entfernen (
          {tasks.filter((t) => t.status === 'done' || t.workflowStatus === 'done').length}{' '}
          vorhanden).
        </p>
        <button
          onClick={async () => {
            const count = tasks.filter(
              (t) => t.status === 'done' || t.workflowStatus === 'done',
            ).length
            if (count === 0) {
              setMessage('Keine erledigten Aufgaben.')
              return
            }
            if (!confirm(`${count} erledigte Aufgaben löschen?`)) return
            const n = await removeCompletedTasks()
            setMessage(`${n} erledigte Aufgaben gelöscht.`)
          }}
          className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10"
        >
          Erledigte Aufgaben löschen
        </button>
      </section>

      <section className="space-y-4 rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <h2 className="text-lg font-semibold text-red-300">Zurücksetzen</h2>
        <p className="text-sm text-red-400/80">
          Löscht alle lokalen Daten unwiderruflich.
        </p>
        <button
          onClick={handleReset}
          className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
        >
          Alle Daten löschen
        </button>
      </section>
    </div>
  )
}
