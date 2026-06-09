import { useMemo, useState } from 'react'
import { btnPrimary, card, emptyState, input, label } from '../components/ui/classes'
import { useApp } from '../context/AppContext'
import type { Note, NoteColor } from '../types'

const COLOR_STYLES: Record<NoteColor, { card: string; dot: string }> = {
  slate: { card: 'border-white/10 bg-white/5', dot: 'bg-slate-400' },
  indigo: { card: 'border-indigo-500/30 bg-indigo-500/10', dot: 'bg-indigo-400' },
  emerald: { card: 'border-emerald-500/30 bg-emerald-500/10', dot: 'bg-emerald-400' },
  amber: { card: 'border-amber-500/30 bg-amber-500/10', dot: 'bg-amber-400' },
  rose: { card: 'border-rose-500/30 bg-rose-500/10', dot: 'bg-rose-400' },
}

const COLORS = Object.keys(COLOR_STYLES) as NoteColor[]

function ColorPicker({
  value,
  onChange,
}: {
  value: NoteColor
  onChange: (c: NoteColor) => void
}) {
  return (
    <div className="flex gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-5 w-5 rounded-full ${COLOR_STYLES[c].dot} ${
            value === c ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-slate-900' : 'opacity-50 hover:opacity-100'
          }`}
          title={c}
        />
      ))}
    </div>
  )
}

function NoteCard({
  note,
  onConvert,
}: {
  note: Note
  onConvert: (note: Note) => void
}) {
  const { updateNote, removeNote } = useApp()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)

  const save = async () => {
    await updateNote({ ...note, title: title.trim() || 'Ohne Titel', content })
    setEditing(false)
  }

  const style = COLOR_STYLES[note.color]

  return (
    <div
      className={`mb-4 break-inside-avoid rounded-2xl border p-4 ${style.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${input} font-semibold`}
            autoFocus
          />
        ) : (
          <h3 className="font-semibold text-white">{note.title}</h3>
        )}
        <button
          type="button"
          onClick={() => updateNote({ ...note, pinned: !note.pinned })}
          className={`shrink-0 text-sm ${note.pinned ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}
          title={note.pinned ? 'Loslösen' : 'Anpinnen'}
        >
          ●
        </button>
      </div>

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className={`${input} mt-2`}
        />
      ) : (
        note.content && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {note.content}
          </p>
        )
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        {editing ? (
          <>
            <ColorPicker
              value={note.color}
              onChange={(color) => updateNote({ ...note, color })}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => removeNote(note.id)}
                className="text-xs text-slate-500 hover:text-red-400"
              >
                Löschen
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Speichern
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[10px] text-slate-600">
              {new Date(note.updatedAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onConvert(note)}
                className="text-xs text-slate-500 hover:text-emerald-300"
                title="Als Aufgabe in den Eingang legen"
              >
                → Aufgabe
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-slate-500 hover:text-indigo-300"
              >
                Bearbeiten
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function NotesPage() {
  const { notes, addNote, addTask } = useApp()
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('slate')
  const [converted, setConverted] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...notes]
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.updatedAt.localeCompare(a.updatedAt)
      })
  }, [notes, query])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !content.trim()) return
    await addNote({ title: title.trim() || 'Ohne Titel', content, color })
    setTitle('')
    setContent('')
    setColor('slate')
    setShowForm(false)
  }

  const convertToTask = async (note: Note) => {
    await addTask({
      title: note.title,
      description: note.content || undefined,
      priority: 'medium',
      workflowStatus: 'inbox',
    })
    setConverted(note.id)
    setTimeout(() => setConverted(null), 2500)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Notizen</h1>
          <p className="mt-1 text-slate-400">
            Dein Zettelkasten – Ideen festhalten, später verarbeiten
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={btnPrimary}>
          {showForm ? 'Abbrechen' : '+ Neue Notiz'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className={`space-y-4 p-6 ${card}`}>
          <div>
            <label className={label}>Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={input}
              placeholder="Worum geht es?"
              autoFocus
            />
          </div>
          <div>
            <label className={label}>Inhalt</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className={input}
              placeholder="Gedanken, Links, Stichpunkte ..."
            />
          </div>
          <div className="flex items-center justify-between">
            <ColorPicker value={color} onChange={setColor} />
            <button type="submit" className={btnPrimary}>
              Notiz speichern
            </button>
          </div>
        </form>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={input}
        placeholder="Notizen durchsuchen ..."
      />

      {converted && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Notiz als Aufgabe in den Eingang gelegt – im Planungs-Hub verarbeiten.
        </p>
      )}

      {sorted.length === 0 ? (
        <p className={emptyState}>
          {query
            ? 'Keine Notizen gefunden.'
            : 'Noch keine Notizen. Halte deine erste Idee fest!'}
        </p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {sorted.map((note) => (
            <NoteCard key={note.id} note={note} onConvert={convertToTask} />
          ))}
        </div>
      )}
    </div>
  )
}
