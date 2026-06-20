import { ReactNode, useState } from 'react'
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

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(getInitialWidth)

  function handleResize(width: number) {
    const clamped = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width))
    setSidebarWidth(clamped)
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clamped))
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar width={sidebarWidth} onResize={handleResize} />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}
