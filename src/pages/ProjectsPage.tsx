import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { groupByProject } from '../utils/tasks'

export function ProjectsPage() {
  const { tasks, meetings } = useApp()

  const projects = useMemo(() => {
    const map = groupByProject(tasks.filter((t) => t.status !== 'done'))
    const meetingProjects = new Set(
      meetings.map((m) => m.title).filter(Boolean),
    )
    for (const p of meetingProjects) {
      if (!map.has(p)) map.set(p, [])
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [tasks, meetings])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projekte & Kunden"
        subtitle="Alle Aufgaben und Meetings nach Projekt gruppiert"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 ? (
          <p className="col-span-full py-12 text-center text-slate-500">
            Noch keine Projekte – vergebe beim Anlegen von Aufgaben ein Projekt.
          </p>
        ) : (
          projects.map(([name, projectTasks]) => {
            const projectMeetings = meetings.filter((m) => m.title === name)
            const open = projectTasks.length
            const done = tasks.filter(
              (t) => t.project === name && t.status === 'done',
            ).length
            return (
              <div
                key={name}
                className="rounded-2xl border border-white/10 bg-[var(--bg-surface)] p-5"
              >
                <h3 className="font-semibold text-white">{name}</h3>
                <div className="mt-2 flex gap-3 text-xs text-slate-500">
                  <span>{open} offen</span>
                  <span>{done} erledigt</span>
                  <span>{projectMeetings.length} Meetings</span>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {projectTasks.slice(0, 5).map((t) => (
                    <li
                      key={t.id}
                      className="truncate rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-300"
                    >
                      {t.title}
                      {t.dueDate && (
                        <span className="ml-2 text-slate-600">
                          {t.dueDate}
                        </span>
                      )}
                    </li>
                  ))}
                  {projectTasks.length > 5 && (
                    <li className="text-xs text-slate-600">
                      +{projectTasks.length - 5} weitere
                    </li>
                  )}
                </ul>
              </div>
            )
          })
        )}
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link to="/aufgaben" className="text-indigo-400 hover:underline">
          Alle Aufgaben verwalten →
        </Link>
      </p>
    </div>
  )
}
