import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import TimelinePage from './pages/TimelinePage'
import NewMeetingPage from './pages/NewMeetingPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/meeting/new" element={<NewMeetingPage />} />
        <Route path="/meeting/:id" element={<MeetingDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
