import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { isDuplicateMeeting } from '../../integrations/csv'
import { icsEventsToMeetings, parseIcsFile } from '../../integrations/ics'

interface IcsImportButtonProps {
  className?: string
  label?: string
}

/** Importiert Termine aus einer .ics-Datei (z. B. Apple Kalender) als Meetings. */
export function IcsImportButton({
  className = '',
  label = 'Termine importieren',
}: IcsImportButtonProps) {
  const { meetings, addMeeting } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    try {
      const events = parseIcsFile(await file.text())
      const payloads = icsEventsToMeetings(events)
      let count = 0
      for (const p of payloads) {
        if (isDuplicateMeeting(meetings, p)) continue
        await addMeeting(p)
        count++
      }
      setMessage(
        count > 0
          ? `${count} Termine importiert ✓`
          : 'Keine neuen Termine gefunden',
      )
    } catch {
      setMessage('Import fehlgeschlagen – ist es eine .ics-Datei?')
    }
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".ics,text/calendar"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={className}
      >
        {message ?? label}
      </button>
    </>
  )
}
