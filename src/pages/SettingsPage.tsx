import { useEffect, useState } from 'react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  BusinessUnitWithProjects,
  Category,
  DbProject,
  Person,
  Profile,
  UserRole,
} from '../types'

type SettingsTab = 'category' | 'division' | 'meeting' | 'people' | 'account'
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

const ALL_ROLES: UserRole[] = ['ceo', 'secretary', 'sales_manager', 'sales_staff']

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'category', label: '카테고리' },
  { key: 'division', label: '사업 부문' },
  { key: 'meeting', label: '회의·프로젝트' },
  { key: 'people', label: '담당자' },
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
  const { profile, signOut } = useAuth()
  const isCeo = profile?.role === 'ceo'

  const [activeTab, setActiveTab] = useState<SettingsTab>('category')
  const [meetingSubTab, setMeetingSubTab] = useState<MeetingSubTab>('regular')

  const [categories, setCategories] = useState<Category[]>([])
  const [bizUnits, setBizUnits] = useState<BusinessUnitWithProjects[]>([])
  const [regularMeetings, setRegularMeetings] = useState<DbProject[]>([])
  const [activeProjects, setActiveProjects] = useState<DbProject[]>([])
  const [doneProjects, setDoneProjects] = useState<DbProject[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [newPersonName, setNewPersonName] = useState('')

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
        peopleRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase
          .from('business_units')
          .select('*, projects(id, is_regular)')
          .order('sort_order'),
        supabase
          .from('projects')
          .select(`*, business_units(name), project_attendees(people(name))`)
          .eq('is_regular', true)
          .order('name'),
        supabase
          .from('projects')
          .select(`*, business_units(name), categories(name), project_attendees(people(name))`)
          .eq('is_regular', false)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('projects')
          .select(`*, business_units(name), categories(name)`)
          .eq('is_regular', false)
          .eq('status', 'done')
          .order('completed_at', { ascending: false }),
        supabase.from('people').select('*').order('name'),
        supabase.from('profiles').select('*').order('created_at'),
      ])

      const hasError =
        categoriesRes.error ||
        bizUnitsRes.error ||
        regularRes.error ||
        activeRes.error ||
        doneRes.error ||
        peopleRes.error ||
        profilesRes.error

      if (hasError) {
        console.error(
          categoriesRes.error,
          bizUnitsRes.error,
          regularRes.error,
          activeRes.error,
          doneRes.error,
          peopleRes.error,
          profilesRes.error,
        )
        setError('데이터를 불러올 수 없습니다.')
        return
      }

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (bizUnitsRes.data) setBizUnits(bizUnitsRes.data as BusinessUnitWithProjects[])
      if (regularRes.data) setRegularMeetings(regularRes.data as DbProject[])
      if (activeRes.data) setActiveProjects(activeRes.data as DbProject[])
      if (doneRes.data) setDoneProjects(doneRes.data as DbProject[])
      if (peopleRes.data) setPeople(peopleRes.data)
      if (profilesRes.data) setProfiles(profilesRes.data)
    } catch (err) {
      console.error(err)
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function runAction(action: () => Promise<void>) {
    setActionLoading(true)
    try {
      await action()
      await loadAllData()
    } catch (err) {
      console.error(err)
      alert('작업에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  // --- 카테고리 CRUD ---
  async function handleAddCategory() {
    const name = prompt('카테고리 이름을 입력하세요')
    if (!name?.trim()) return
    await runAction(async () => {
      const { error: insertError } = await supabase.from('categories').insert({
        name: name.trim(),
        type: 'bz',
        sort_order: categories.length,
      })
      if (insertError) throw insertError
    })
  }

  async function handleEditCategory(id: string, currentName: string) {
    const name = prompt('카테고리 이름', currentName)
    if (!name?.trim()) return
    await runAction(async () => {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ name: name.trim() })
        .eq('id', id)
      if (updateError) throw updateError
    })
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return
    await runAction(async () => {
      const { error: deleteError } = await supabase.from('categories').delete().eq('id', id)
      if (deleteError) throw deleteError
    })
  }

  // --- 사업 부문 CRUD ---
  async function handleAddBizUnit() {
    const name = prompt('사업 부문 이름을 입력하세요')
    if (!name?.trim()) return
    await runAction(async () => {
      const { error: insertError } = await supabase.from('business_units').insert({
        name: name.trim(),
        sort_order: bizUnits.length,
      })
      if (insertError) throw insertError
    })
  }

  async function handleEditBizUnit(id: string, currentName: string) {
    const name = prompt('사업 부문 이름', currentName)
    if (!name?.trim()) return
    await runAction(async () => {
      const { error: updateError } = await supabase
        .from('business_units')
        .update({ name: name.trim() })
        .eq('id', id)
      if (updateError) throw updateError
    })
  }

  async function handleDeleteBizUnit(id: string, name: string) {
    if (!confirm(`"${name}" 사업 부문을 삭제하시겠습니까?`)) return
    await runAction(async () => {
      const { error: deleteError } = await supabase.from('business_units').delete().eq('id', id)
      if (deleteError) throw deleteError
    })
  }

  // --- 프로젝트/정기회의 CRUD ---
  async function handleAddProject(isRegular: boolean) {
    const name = prompt(isRegular ? '정기회의 이름' : '프로젝트 이름')
    if (!name?.trim()) return

    const bizUnitName = prompt('사업 부문 이름 (개인 프로젝트는 비워두세요)', '')
    let businessUnitId: string | null = null
    if (bizUnitName?.trim()) {
      const unit = bizUnits.find((b) => b.name === bizUnitName.trim())
      if (!unit) {
        alert('사업 부문을 찾을 수 없습니다.')
        return
      }
      businessUnitId = unit.id
    }

    const categoryName = prompt('카테고리 이름')
    if (!categoryName?.trim()) return
    const cat = categories.find((c) => c.name === categoryName.trim())
    if (!cat) {
      alert('카테고리를 찾을 수 없습니다.')
      return
    }

    await runAction(async () => {
      const { error: insertError } = await supabase.from('projects').insert({
        name: name.trim(),
        is_regular: isRegular,
        category_id: cat.id,
        business_unit_id: businessUnitId,
        status: 'active',
        page_type: 'default',
      })
      if (insertError) throw insertError
    })
  }

  async function handleEditProject(id: string, currentName: string) {
    const name = prompt('이름', currentName)
    if (!name?.trim()) return
    await runAction(async () => {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ name: name.trim() })
        .eq('id', id)
      if (updateError) throw updateError
    })
  }

  async function handleCompleteProject(id: string, name: string) {
    if (!confirm(`"${name}" 프로젝트를 완료 처리하시겠습니까?`)) return
    await runAction(async () => {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', id)
      if (updateError) throw updateError
    })
  }

  async function handleReactivateProject(id: string, name: string) {
    if (!confirm(`"${name}" 프로젝트를 재활성화하시겠습니까?`)) return
    await runAction(async () => {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: 'active', completed_at: null })
        .eq('id', id)
      if (updateError) throw updateError
    })
  }

  async function handleDeleteProject(id: string, name: string) {
    if (!confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return
    await runAction(async () => {
      const { error: deleteError } = await supabase.from('projects').delete().eq('id', id)
      if (deleteError) throw deleteError
    })
  }

  // --- 담당자 CRUD ---
  async function handleAddPerson() {
    if (!newPersonName.trim()) return
    await runAction(async () => {
      const { error: insertError } = await supabase
        .from('people')
        .insert({ name: newPersonName.trim() })
      if (insertError) throw insertError
      setNewPersonName('')
    })
  }

  async function handleDeletePerson(id: string, name: string) {
    if (!confirm(`"${name}" 담당자를 삭제하시겠습니까?`)) return
    await runAction(async () => {
      const { error: deleteError } = await supabase.from('people').delete().eq('id', id)
      if (deleteError) throw deleteError
    })
  }

  // --- 계정 CRUD ---
  async function handleEditRole(id: string, currentRole: UserRole) {
    const roleInput = prompt(
      `역할 (ceo, secretary, sales_manager, sales_staff)\n현재: ${currentRole}`,
      currentRole,
    )
    if (!roleInput || !ALL_ROLES.includes(roleInput as UserRole)) {
      alert('올바른 역할을 입력해주세요.')
      return
    }
    await runAction(async () => {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: roleInput as UserRole })
        .eq('id', id)
      if (updateError) throw updateError
    })
  }

  async function handleDeleteProfile(id: string, name: string) {
    if (!confirm(`"${name}" 계정(profiles)을 삭제하시겠습니까?\nauth.users는 대시보드에서 별도 삭제 필요`))
      return
    await runAction(async () => {
      const { error: deleteError } = await supabase.from('profiles').delete().eq('id', id)
      if (deleteError) throw deleteError
    })
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

      <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
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
                  {isCeo && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleEditCategory(cat.id, cat.name)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        disabled={actionLoading}
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      >
                        삭제
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isCeo && (
            <Button variant="secondary" size="sm" disabled={actionLoading} onClick={handleAddCategory}>
              + 추가
            </Button>
          )}
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
                    {isCeo && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleEditBizUnit(d.id, d.name)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger"
                          disabled={actionLoading}
                          onClick={() => handleDeleteBizUnit(d.id, d.name)}
                        >
                          삭제
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {isCeo && (
            <Button variant="secondary" size="sm" disabled={actionLoading} onClick={handleAddBizUnit}>
              + 추가
            </Button>
          )}
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
                        <span className="text-xs text-gray-500">{m.business_units?.name ?? '—'}</span>
                        <span className="text-xs text-gray-400">디폴트: {formatAttendees(m)}</span>
                      </div>
                      {isCeo && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleEditProject(m.id, m.name)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            disabled={actionLoading}
                            onClick={() => handleDeleteProject(m.id, m.name)}
                          >
                            삭제
                          </Button>
                        </div>
                      )}
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
                        <span className="text-xs text-gray-500">{p.business_units?.name ?? '—'}</span>
                        <span className="text-xs text-gray-400">{p.categories?.name ?? '—'}</span>
                      </div>
                      {isCeo && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleEditProject(p.id, p.name)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleCompleteProject(p.id, p.name)}
                          >
                            완료
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            disabled={actionLoading}
                            onClick={() => handleDeleteProject(p.id, p.name)}
                          >
                            삭제
                          </Button>
                        </div>
                      )}
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
                          완료일: {p.completed_at ? p.completed_at.slice(0, 10) : '—'}
                        </span>
                      </div>
                      {isCeo && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleReactivateProject(p.id, p.name)}
                          >
                            재활성화
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            disabled={actionLoading}
                            onClick={() => handleDeleteProject(p.id, p.name)}
                          >
                            삭제
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {isCeo && (
            <Button
              variant="secondary"
              size="sm"
              disabled={actionLoading}
              onClick={() =>
                handleAddProject(meetingSubTab === 'regular')
              }
            >
              + 추가
            </Button>
          )}
        </div>
      )}

      {activeTab === 'people' && (
        <div>
          {people.length === 0 ? (
            <p className="mb-4 text-sm text-gray-400">등록된 항목이 없습니다.</p>
          ) : (
            <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {people.map((person) => (
                <li key={person.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-800">{person.name}</span>
                  {isCeo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      disabled={actionLoading}
                      onClick={() => handleDeletePerson(person.id, person.name)}
                    >
                      삭제
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isCeo && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="담당자 이름"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={actionLoading || !newPersonName.trim()}
                onClick={handleAddPerson}
              >
                + 추가
              </Button>
            </div>
          )}
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
                  {isCeo && user.id !== profile?.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleEditRole(user.id, user.role)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        disabled={actionLoading}
                        onClick={() => handleDeleteProfile(user.id, user.name)}
                      >
                        삭제
                      </Button>
                    </div>
                  )}
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
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                로그아웃
              </Button>
            </div>
            {isCeo && (
              <p className="mt-3 text-xs text-gray-400">
                새 계정 생성은 Supabase 대시보드에서 진행해주세요.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
