import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
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
          <Layout>
            <TimelinePage />
          </Layout>
        }
      />
      <Route
        path="/meeting/new"
        element={
          <Layout>
            <NewMeetingPage />
          </Layout>
        }
      />
      <Route
        path="/meeting/:id"
        element={
          <Layout>
            <MeetingDetailPage />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <SettingsPage />
          </Layout>
        }
      />
    </Routes>
  )
}
