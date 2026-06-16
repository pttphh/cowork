import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { PageType, SidebarGroup, UserRole } from '../../types'

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
  const [groups, setGroups] = useState<SidebarGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    loadSidebarData()
  }, [])

  async function loadSidebarData() {
    setLoading(true)
    setError('')

    try {
      const { data: bizUnits, error: bizError } = await supabase
        .from('business_units')
        .select('*')
        .order('sort_order')

      const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('*, business_units(name)')
        .eq('status', 'active')
        .order('name')

      if (bizError || projError) {
        setError('데이터를 불러올 수 없습니다.')
        return
      }

      if (!bizUnits || !projects) return

      const grouped: SidebarGroup[] = bizUnits
        .map((biz) => ({
          id: biz.id,
          name: biz.name,
          items: [
            ...projects
              .filter((p) => p.business_unit_id === biz.id && p.is_regular)
              .map((p) => ({
                id: p.id,
                name: p.name,
                type: 'regular' as const,
                pageType: (p.page_type as PageType) ?? undefined,
              })),
            ...projects
              .filter((p) => p.business_unit_id === biz.id && !p.is_regular)
              .map((p) => ({
                id: p.id,
                name: p.name,
                type: 'project' as const,
                pageType: (p.page_type as PageType) ?? undefined,
              })),
          ],
        }))
        .filter((g) => g.items.length > 0)

      const personalItems = projects
        .filter((p) => !p.business_unit_id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          type: 'project' as const,
          pageType: (p.page_type as PageType) ?? undefined,
        }))

      if (personalItems.length > 0) {
        grouped.push({ id: 'personal', name: '개인', items: personalItems })
      }

      setGroups(grouped)
      setExpanded(
        grouped.reduce<Record<string, boolean>>((acc, g) => {
          acc[g.id] = true
          return acc
        }, {}),
      )
    } catch {
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

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
      <button onClick={() => navigate('/timeline')} className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors">협업툴</button>
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

        {loading && (
          <div className="space-y-2 px-2 py-1">
            <div className="h-3 animate-pulse rounded bg-gray-200" />
            <div className="h-3 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
            <p className="text-xs text-gray-400">로딩 중...</p>
          </div>
        )}

        {error && !loading && (
          <p className="px-2 py-1 text-xs text-red-500">{error}</p>
        )}

        {!loading && !error && groups.length === 0 && (
          <p className="px-2 py-1 text-xs text-gray-400">등록된 항목이 없습니다.</p>
        )}

        {!loading &&
          !error &&
          groups.map((group) => (
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
