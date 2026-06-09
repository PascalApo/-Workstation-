import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AppProvider } from './context/AppContext'
import { CalendarPage } from './pages/CalendarPage'
import { FocusPage } from './pages/FocusPage'
import { InsightsPage } from './pages/InsightsPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { MeetingsPage } from './pages/MeetingsPage'
import { NotesPage } from './pages/NotesPage'
import { PlanPage } from './pages/PlanPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { QuickAddPage } from './pages/QuickAddPage'
import { RoutinePage } from './pages/RoutinePage'
import { SettingsPage } from './pages/SettingsPage'
import { TasksPage } from './pages/TasksPage'
import { TodayPage } from './pages/TodayPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TodayPage />} />
            <Route path="fokus" element={<FocusPage />} />
            <Route path="planen" element={<PlanPage />} />
            <Route path="kalender" element={<CalendarPage />} />
            <Route path="projekte" element={<ProjectsPage />} />
            <Route path="aufgaben" element={<TasksPage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="routine" element={<RoutinePage />} />
            <Route path="notizen" element={<NotesPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="integrationen" element={<IntegrationsPage />} />
            <Route path="einstellungen" element={<SettingsPage />} />
            <Route path="quickadd" element={<QuickAddPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
