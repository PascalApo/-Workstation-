import { useState, type ReactNode } from 'react'

interface FileDropZoneProps {
  accept?: string
  label: string
  onFile: (file: File) => void
  children?: ReactNode
}

export function FileDropZone({
  accept,
  label,
  onFile,
  children,
}: FileDropZoneProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (accept && !file.name.toLowerCase().endsWith(accept.replace('.', ''))) {
      return
    }
    onFile(file)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={`rounded-xl border border-dashed p-4 transition-all ${
        isOver
          ? 'border-indigo-500/60 bg-indigo-500/15 ring-2 ring-indigo-500/30'
          : 'border-white/15 bg-white/[0.02]'
      }`}
    >
      <p className="text-center text-xs text-slate-500">
        {isOver ? 'Datei loslassen' : label}
      </p>
      {children}
    </div>
  )
}
