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
        path="/timeline"
        element={
          <ProtectedRoute>
            <Layout>
              <TimelinePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/meeting/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewMeetingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/meeting/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <MeetingDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
