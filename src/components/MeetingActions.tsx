import { useState } from 'react'
import { copyToClipboard, shareText } from '../integrations/clipboard'
import {
  formatMeetingFollowUp,
  formatMeetingForOneNote,
} from '../integrations/meetingExport'
import { formatMeetingMarkdown, downloadMarkdown } from '../integrations/markdown'
import type { Meeting } from '../types'

interface MeetingActionsProps {
  meeting: Meeting
  compact?: boolean
}

export function MeetingActions({ meeting, compact = false }: MeetingActionsProps) {
  const [msg, setMsg] = useState('')

  const notify = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 2500)
  }

  const followUpText = formatMeetingFollowUp(meeting)

  const handleCopy = async () => {
    const ok = await copyToClipboard(followUpText)
    notify(ok ? 'Follow-up kopiert!' : 'Kopieren fehlgeschlagen')
  }

  const handleShare = async () => {
    const ok = await shareText(followUpText, `Follow-up: ${meeting.title}`)
    notify(ok ? 'Geteilt!' : 'Teilen nicht verfügbar – Text kopiert.')
    if (!ok) await copyToClipboard(followUpText)
  }

  const handleCopyRich = async () => {
    const html = formatMeetingForOneNote(meeting)
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([followUpText], { type: 'text/plain' }),
        }),
      ])
      notify('Notizen kopiert (Rich-Text)!')
    } catch {
      const ok = await copyToClipboard(followUpText)
      notify(ok ? 'Als Text kopiert' : 'Kopieren fehlgeschlagen')
    }
  }

  const handleMarkdown = () => {
    downloadMarkdown(
      formatMeetingMarkdown(meeting),
      `follow-up-${meeting.date}-${meeting.title.slice(0, 20)}.md`,
    )
    notify('Markdown heruntergeladen')
  }

  const btnClass = compact
    ? 'rounded-lg border border-white/15 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/10'
    : 'rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className={btnClass}>
          Kopieren
        </button>
        <button type="button" onClick={handleShare} className={btnClass}>
          Teilen
        </button>
        <button type="button" onClick={handleCopyRich} className={btnClass}>
          Notizen kopieren
        </button>
        <button type="button" onClick={handleMarkdown} className={btnClass}>
          Als Markdown
        </button>
      </div>
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}
    </div>
  )
}
