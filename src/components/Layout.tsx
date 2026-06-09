import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { CommandPalette } from './CommandPalette'
import { TaskDragProvider } from './dnd/TaskDragContext'
import { QuickCapture } from './QuickCapture'
import { ReminderScheduler } from './ReminderScheduler'

const navSections = [
  {
    label: 'Start',
    items: [
      { to: '/', label: 'Kommandozentrale', icon: '◉' },
      { to: '/fokus', label: 'Fokus', icon: '◎' },
    ],
  },
  {
    label: 'Planen',
    items: [
      { to: '/planen', label: 'Planungs-Hub', icon: '◈' },
      { to: '/kalender', label: 'Flow-Kalender', icon: '◫' },
      { to: '/projekte', label: 'Projekte', icon: '◧' },
    ],
  },
  {
    label: 'Arbeiten',
    items: [
      { to: '/aufgaben', label: 'Aufgaben', icon: '☑' },
      { to: '/meetings', label: 'Meetings', icon: '◉' },
      { to: '/routine', label: 'Routine', icon: '☰' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/integrationen', label: 'Export & Tools', icon: '⬡' },
      { to: '/einstellungen', label: 'Backup', icon: '◇' },
    ],
  },
]

const mobileNavItems = [
  { to: '/', label: 'Start', icon: '◉' },
  { to: '/kalender', label: 'Kalender', icon: '◫' },
  { to: '/planen', label: 'Planen', icon: '◈' },
  { to: '/aufgaben', label: 'Aufgaben', icon: '☑' },
  { to: '/meetings', label: 'Meetings', icon: '◉' },
]

export function Layout() {
  const { inboxCount } = useApp()
  const navigate = useNavigate()

  return (
    <TaskDragProvider>
    <div className="flex min-h-screen bg-[var(--bg-app)]">
      <aside className="glass fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
            SSP
          </p>
          <h1 className="mt-1 text-lg font-bold text-white">Workstation</h1>
          <p className="mt-0.5 text-xs text-slate-500">Organisation & Planung</p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`
                    }
                  >
                    <span className="w-4 text-center text-xs opacity-70">
                      {item.icon}
                    </span>
                    {item.label}
                    {item.to === '/planen' && inboxCount > 0 && (
                      <span className="ml-auto rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                        {inboxCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => navigate('/planen')}
            className="w-full rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-slate-500 hover:border-indigo-500/40 hover:text-indigo-300"
          >
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
              Strg+K
            </kbd>{' '}
            Schnellbefehl
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-[220px]">
        <header className="glass sticky top-0 z-10 flex items-center justify-between border-b border-white/10 px-4 py-3 lg:px-6">
          <p className="text-sm font-bold text-white lg:hidden">
            SSP <span className="font-normal text-slate-400">Workstation</span>
          </p>
          <p className="hidden text-sm text-slate-500 lg:block">
            Alles lokal · Deine Daten bleiben auf dem Rechner
          </p>
          {inboxCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/planen?tab=kanban')}
              className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30"
            >
              {inboxCount} im Eingang verarbeiten →
            </button>
          )}
        </header>

        <main className="flex-1 p-4 pb-28 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="glass fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-300' : 'text-slate-500'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
            {item.to === '/planen' && inboxCount > 0 && (
              <span className="absolute right-[22%] top-1 h-2 w-2 rounded-full bg-amber-400" />
            )}
          </NavLink>
        ))}
      </nav>

      <QuickCapture />
      <CommandPalette />
      <ReminderScheduler />
    </div>
    </TaskDragProvider>
  )
}
