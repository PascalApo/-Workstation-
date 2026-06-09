import { useState } from 'react'
import { useApp } from '../context/AppContext'

export function QuickCapture() {
  const { quickCapture } = useApp()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await quickCapture(text)
    setText('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glow-accent fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-xl transition-transform hover:scale-105 hover:bg-indigo-500 lg:bottom-6 lg:right-6 lg:h-14 lg:w-14"
        title="Schnell erfassen (Gedanke, Aufgabe, Idee)"
      >
        +
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in w-full max-w-lg rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-5 shadow-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Quick Capture
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Schnell notieren – später im Eingang verarbeiten
        </p>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was ist dir gerade eingefallen?"
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Erfassen
          </button>
        </div>
      </form>
    </div>
  )
}
