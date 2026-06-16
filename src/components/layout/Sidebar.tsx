import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SidebarGroup, UserRole } from '../../types'

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    id: 'biz-general',
    name: '비즈니스 일반',
    items: [
      { id: 'r1', name: '주간 경영 점검', type: 'regular' },
      { id: 'p1', name: '가맹사업 TFT', type: 'project' },
      { id: 'p2', name: '물류센터 개선', type: 'project' },
    ],
  },
  {
    id: 'retail',
    name: '리테일',
    items: [
      { id: 'r2', name: '점검회의 (상품)', type: 'regular' },
      { id: 'p3', name: '리테일 브랜드 리뉴얼', type: 'project' },
    ],
  },
  {
    id: 'personal',
    name: '개인',
    items: [
      { id: 'p4', name: '골프 집계', type: 'project', pageType: 'golf' },
    ],
  },
]

const ROLE_LABELS: Record<UserRole, string> = {
  ceo: '대표이사',
  secretary: '비서',
  sales_manager: '영업 매니저',
  sales_staff: '영업 직원',
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'biz-general': true,
    retail: true,
    personal: true,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const toggleGroup = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isTimelineActive = location.pathname === '/timeline'

  async function handleSignOut() {
    setDropdownOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-gray-200 bg-sidebar-bg">
      <div className="border-b border-gray-200 p-3">
        <div className="text-sm font-semibold text-gray-900">협업툴</div>
      </div>

      <div className="border-b border-gray-200 p-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full text-left text-sm font-medium text-gray-900 hover:text-primary"
          >
            {profile?.name ?? '—'}
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-md">
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => setDropdownOpen(false)}
              >
                비밀번호 변경
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                onClick={handleSignOut}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
        <div className="mt-0.5 text-xs text-gray-500">
          {profile?.role ? ROLE_LABELS[profile.role] : '—'}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <Link
          to="/timeline"
          className={`mb-2 block rounded px-3 py-2 text-sm ${
            isTimelineActive
              ? 'border-r-2 border-primary bg-primary-light font-medium text-primary'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          전체 타임라인
        </Link>

        <div className="my-2 border-t border-gray-200" />

        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.id} className="mb-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              <span>{group.name}</span>
              <span className="text-gray-400">{expanded[group.id] ? '▾' : '▸'}</span>
            </button>
            {expanded[group.id] && (
              <ul className="ml-1 mt-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`flex w-full items-center gap-1.5 rounded px-3 py-1.5 text-left text-sm ${
                        selectedId === item.id
                          ? 'border-r-2 border-primary bg-primary-light font-medium text-primary'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={item.type === 'regular' ? 'text-success' : 'text-primary'}>
                        {item.type === 'regular' ? '🔄' : '📁'}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-2">
        <Link
          to="/settings"
          className={`flex items-center gap-1.5 rounded px-3 py-2 text-sm ${
            location.pathname === '/settings'
              ? 'border-r-2 border-primary bg-primary-light font-medium text-primary'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span>⚙</span>
          <span>설정</span>
        </Link>
      </div>
    </aside>
  )
}
