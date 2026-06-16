import { useEffect, useState } from 'react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  BusinessUnitWithProjects,
  Category,
  DbProject,
  Profile,
  UserRole,
} from '../types'

type SettingsTab = 'category' | 'division' | 'meeting' | 'account'
type MeetingSubTab = 'regular' | 'active' | 'done'

const ROLE_LABELS: Record<UserRole, string> = {
  ceo: '경영자',
  secretary: '비서',
  sales_manager: '영업(관리)',
  sales_staff: '영업(실무)',
}

const ROLE_VARIANTS: Record<UserRole, 'primary' | 'success' | 'warning'> = {
  ceo: 'primary',
  secretary: 'success',
  sales_manager: 'warning',
  sales_staff: 'warning',
}

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'category', label: '카테고리' },
  { key: 'division', label: '사업 부문' },
  { key: 'meeting', label: '회의·프로젝트' },
  { key: 'account', label: '계정' },
]

function formatAttendees(project: DbProject) {
  const names =
    project.project_attendees
      ?.map((a) => a.people?.name)
      .filter((n): n is string => !!n) ?? []
  return names.length > 0 ? names.join(', ') : '—'
}

export default function SettingsPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('category')
  const [meetingSubTab, setMeetingSubTab] = useState<MeetingSubTab>('regular')

  const [categories, setCategories] = useState<Category[]>([])
  const [bizUnits, setBizUnits] = useState<BusinessUnitWithProjects[]>([])
  const [regularMeetings, setRegularMeetings] = useState<DbProject[]>([])
  const [activeProjects, setActiveProjects] = useState<DbProject[]>([])
  const [doneProjects, setDoneProjects] = useState<DbProject[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    setError('')

    try {
      const [
        categoriesRes,
        bizUnitsRes,
        regularRes,
        activeRes,
        doneRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase
          .from('business_units')
          .select('*, projects(id, is_regular)')
          .order('sort_order'),
        supabase
          .from('projects')
          .select(`
            *,
            business_units(name),
            project_attendees(people(name))
          `)
          .eq('is_regular', true)
          .order('name'),
        supabase
          .from('projects')
          .select(`
            *,
            business_units(name),
            categories(name),
            project_attendees(people(name))
          `)
          .eq('is_regular', false)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('projects')
          .select(`
            *,
            business_units(name),
            categories(name)
          `)
          .eq('is_regular', false)
          .eq('status', 'done')
          .order('completed_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at'),
      ])

      const hasError =
        categoriesRes.error ||
        bizUnitsRes.error ||
        regularRes.error ||
        activeRes.error ||
        doneRes.error ||
        profilesRes.error

      if (hasError) {
        setError('데이터를 불러올 수 없습니다.')
        return
      }

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (bizUnitsRes.data) setBizUnits(bizUnitsRes.data as BusinessUnitWithProjects[])
      if (regularRes.data) setRegularMeetings(regularRes.data as DbProject[])
      if (activeRes.data) setActiveProjects(activeRes.data as DbProject[])
      if (doneRes.data) setDoneProjects(doneRes.data as DbProject[])
      if (profilesRes.data) setProfiles(profilesRes.data)
    } catch {
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-lg font-semibold text-gray-900">설정</h1>

      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm ${
              activeTab === tab.key
                ? 'border-b-2 border-primary font-medium text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'category' && (
        <div>
          {categories.length === 0 ? (
            <p className="mb-4 text-sm text-gray-400">등록된 항목이 없습니다.</p>
          ) : (
            <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {categories.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-800">{cat.name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      수정
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger">
                      삭제
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button variant="secondary" size="sm">
            + 추가
          </Button>
        </div>
      )}

      {activeTab === 'division' && (
        <div>
          {bizUnits.length === 0 ? (
            <p className="mb-4 text-sm text-gray-400">등록된 항목이 없습니다.</p>
          ) : (
            <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {bizUnits.map((d) => {
                const projectCount = d.projects?.filter((p) => !p.is_regular).length ?? 0
                const regularCount = d.projects?.filter((p) => p.is_regular).length ?? 0

                return (
                  <li key={d.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-medium text-gray-800">{d.name}</span>
                      <span className="text-xs text-gray-500">프로젝트 {projectCount}개</span>
                      <span className="text-xs text-gray-500">정기회의 {regularCount}개</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        수정
                      </Button>
                      <Button variant="ghost" size="sm" className="text-danger">
                        삭제
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <Button variant="secondary" size="sm">
            + 추가
          </Button>
        </div>
      )}

      {activeTab === 'meeting' && (
        <div>
          <div className="mb-4 flex gap-1 border-b border-gray-200">
            {(
              [
                { key: 'regular', label: '정기회의' },
                { key: 'active', label: '진행 중 프로젝트' },
                { key: 'done', label: '완료된 프로젝트' },
              ] as { key: MeetingSubTab; label: string }[]
            ).map((sub) => (
              <button
                key={sub.key}
                type="button"
                onClick={() => setMeetingSubTab(sub.key)}
                className={`px-4 py-2 text-sm ${
                  meetingSubTab === sub.key
                    ? 'border-b-2 border-primary font-medium text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {meetingSubTab === 'regular' && (
            <>
              {regularMeetings.length === 0 ? (
                <p className="mb-4 text-sm text-gray-400">등록된 항목이 없습니다.</p>
              ) : (
                <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                  {regularMeetings.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium text-gray-800">{m.name}</span>
                        <span className="text-xs text-gray-500">
                          {m.business_units?.name ?? '—'}
                        </span>
                        <span className="text-xs text-gray-400">
                          디폴트: {formatAttendees(m)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          수정
                        </Button>
                        <Button variant="ghost" size="sm" className="text-danger">
                          삭제
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {meetingSubTab === 'active' && (
            <>
              {activeProjects.length === 0 ? (
                <p className="mb-4 text-sm text-gray-400">등록된 항목이 없습니다.</p>
              ) : (
                <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                  {activeProjects.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium text-gray-800">{p.name}</span>
                        <span className="text-xs text-gray-500">
                          {p.business_units?.name ?? '—'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {p.categories?.name ?? '—'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          수정
                        </Button>
                        <Button variant="ghost" size="sm">
                          완료
                        </Button>
                        <Button variant="ghost" size="sm" className="text-danger">
                          삭제
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {meetingSubTab === 'done' && (
            <>
              {doneProjects.length === 0 ? (
                <p className="mb-4 text-sm text-gray-400">등록된 항목이 없습니다.</p>
              ) : (
                <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                  {doneProjects.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">{p.name}</span>
                        <span className="text-xs text-gray-400">
                          완료일: {p.completed_at ?? '—'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          재활성화
                        </Button>
                        <Button variant="ghost" size="sm" className="text-danger">
                          삭제
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <Button variant="secondary" size="sm">
            + 추가
          </Button>
        </div>
      )}

      {activeTab === 'account' && (
        <div>
          {profiles.length === 0 ? (
            <p className="mb-6 text-sm text-gray-400">등록된 항목이 없습니다.</p>
          ) : (
            <ul className="mb-6 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {profiles.map((user) => (
                <li key={user.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">{user.name}</span>
                    <Badge variant={ROLE_VARIANTS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                    <span className="text-xs text-gray-500">{user.email ?? user.id}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      수정
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger">
                      삭제
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 text-sm font-medium text-gray-800">
              내 계정 — {profile?.name ?? '—'}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                비밀번호 변경
              </Button>
              <Button variant="ghost" size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
