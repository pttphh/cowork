import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const MIN_SIDEBAR_WIDTH = 160
const MAX_SIDEBAR_WIDTH = 320
const DEFAULT_SIDEBAR_WIDTH = 192
const SIDEBAR_WIDTH_KEY = 'sidebar-width'

function getInitialWidth(): number {
  const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
  if (saved) {
    const parsed = parseInt(saved, 10)
    if (!isNaN(parsed)) {
      return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsed))
    }
  }
  return DEFAULT_SIDEBAR_WIDTH
}

export interface LayoutOutletContext {
  selectedProjectId: string | null
  selectedProjectName: string | null
}

export default function Layout() {
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null)

  function handleResize(width: number) {
    const clamped = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width))
    setSidebarWidth(clamped)
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clamped))
  }

  function handleSelectProject(id: string | null, name: string | null = null) {
    setSelectedProjectId(id)
    setSelectedProjectName(name)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        width={sidebarWidth}
        onResize={handleResize}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
      />
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet context={{ selectedProjectId, selectedProjectName } satisfies LayoutOutletContext} />
      </main>
    </div>
  )
}
