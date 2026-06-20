import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import CreateMeetingTypeModal from '../components/ui/CreateMeetingTypeModal'
import CreateProjectModal from '../components/ui/CreateProjectModal'
import PersonTagInput from '../components/ui/PersonTagInput'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { BusinessUnit, Category, DbProject, Person } from '../types'

interface AgendaTodo {
  id: number
  title: string
  personId: string
}

interface FormAgenda {
  id: number
  order: number
  subject: string
  content: string
  todos: AgendaTodo[]
}

function isBzCategory(cat: Category) {
  return cat.type === 'bz' || cat.name.startsWith('Bz')
}

function isPersonalCategory(cat: Category) {
  return cat.type === 'personal' || cat.name.startsWith('사적인')
}

function isBzRegularCategory(cat: Category) {
  return cat.name.includes('정기회의')
}

export default function NewMeetingPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [bizUnits, setBizUnits] = useState<BusinessUnit[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [projects, setProjects] = useState<DbProject[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedBizUnitId, setSelectedBizUnitId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [notice, setNotice] = useState('')
  const [selectedAttendees, setSelectedAttendees] = useState<Person[]>([])
  const [agendas, setAgendas] = useState<FormAgenda[]>([
    { id: 1, order: 1, subject: '안건 1', content: '', todos: [] },
  ])
  const [todoInput, setTodoInput] = useState({ title: '', personId: '' })
  const [activeAgendaId, setActiveAgendaId] = useState(1)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showMeetingTypeModal, setShowMeetingTypeModal] = useState(false)

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const isBz = selectedCategory ? isBzCategory(selectedCategory) : false
  const isPersonal = selectedCategory ? isPersonalCategory(selectedCategory) : false
  const isBzRegular = selectedCategory ? isBzRegularCategory(selectedCategory) : false
  const showDivision = isBz
  const showMeetingTypes = isBzRegular

  const filteredProjects = useMemo(() => {
    if (!selectedCategoryId) return []
    return projects.filter((p) => {
      if (isPersonal) {
        return !p.business_unit_id && p.category_id === selectedCategoryId
      }
      if (!selectedBizUnitId) return false
      if (p.business_unit_id !== selectedBizUnitId) return false
      if (p.category_id && p.category_id !== selectedCategoryId) return false
      return isBzRegular ? p.is_regular : !p.is_regular
    })
  }, [projects, selectedCategoryId, selectedBizUnitId, isPersonal, isBzRegular])

  useEffect(() => {
    loadFormData()
  }, [])

  useEffect(() => {
    loadProjects()
  }, [selectedCategoryId, selectedBizUnitId, isPersonal])

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedAttendees([])
      return
    }

    async function loadProjectAttendees() {
      const { data, error } = await supabase
        .from('project_attendees')
        .select('people(id, name)')
        .eq('project_id', selectedProjectId)

      if (error) {
        console.error(error)
        return
      }

      const people =
        data
          ?.map((row) => row.people)
          .filter((p): p is { id: string; name: string } => !!p) ?? []

      setSelectedAttendees(people)
    }

    loadProjectAttendees()
  }, [selectedProjectId])

  async function loadFormData() {
    setDataLoading(true)
    try {
      const [peopleRes, categoriesRes, bizUnitsRes] = await Promise.all([
        supabase.from('people').select('*').order('name'),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('business_units').select('*').order('sort_order'),
      ])

      if (peopleRes.error || categoriesRes.error || bizUnitsRes.error) {
        setError('데이터를 불러올 수 없습니다.')
        return
      }

      if (peopleRes.data) setPeople(peopleRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (bizUnitsRes.data) setBizUnits(bizUnitsRes.data)
    } catch (err) {
      console.error(err)
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setDataLoading(false)
    }
  }

  async function loadProjects(selectId?: string) {
    if (!selectedCategoryId) {
      setProjects([])
      return
    }

    let query = supabase.from('projects').select('*').eq('status', 'active')

    if (isPersonal) {
      query = query.is('business_unit_id', null).eq('category_id', selectedCategoryId)
    } else if (selectedBizUnitId) {
      query = query.eq('business_unit_id', selectedBizUnitId)
    } else {
      setProjects([])
      return
    }

    const { data, error: fetchError } = await query.order('name')
    if (fetchError) {
      console.error(fetchError)
      return
    }
    if (data) {
      setProjects(data)
      if (selectId) setSelectedProjectId(selectId)
    }
  }

  function handleProjectCreated(projectId: string, attendees: Person[]) {
    setSelectedProjectId(projectId)
    setSelectedAttendees(attendees)
    loadProjects(projectId)
  }

  function handleMeetingTypeCreated(projectId: string, attendees: Person[]) {
    setSelectedProjectId(projectId)
    setSelectedAttendees(attendees)
    loadProjects(projectId)
  }

  function addTodo(agendaId: number) {
    if (!todoInput.title.trim()) return
    setAgendas(
      agendas.map((a) =>
        a.id === agendaId
          ? {
              ...a,
              todos: [
                ...a.todos,
                {
                  id: Date.now(),
                  title: todoInput.title.trim(),
                  personId: todoInput.personId,
                },
              ],
            }
          : a,
      ),
    )
    setTodoInput({ title: '', personId: '' })
  }

  function removeTodo(agendaId: number, todoId: number) {
    setAgendas(
      agendas.map((a) =>
        a.id === agendaId ? { ...a, todos: a.todos.filter((t) => t.id !== todoId) } : a,
      ),
    )
  }

  function updateAgendaContent(agendaId: number, content: string) {
    setAgendas(agendas.map((a) => (a.id === agendaId ? { ...a, content } : a)))
  }

  function addAgenda() {
    const newId = Date.now()
    const order = agendas.length + 1
    setAgendas([
      ...agendas,
      { id: newId, order, subject: `안건 ${order}`, content: '', todos: [] },
    ])
    setActiveAgendaId(newId)
  }

  async function handleSubmit() {
    if (!profile) {
      alert('로그인이 필요합니다.')
      return
    }
    if (!meetingTitle.trim()) {
      alert('회의명을 입력해주세요.')
      return
    }
    if (!selectedProjectId && filteredProjects.length > 0) {
      alert('프로젝트 또는 회의종류를 선택해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          project_id: selectedProjectId || null,
          title: meetingTitle.trim(),
          meeting_date: meetingDate,
          notice: notice.trim() || null,
          status: 'draft',
          created_by: profile.id,
        })
        .select()
        .single()

      if (meetingError || !meeting) {
        console.error(meetingError)
        alert('회의 저장에 실패했습니다.')
        return
      }

      if (selectedAttendees.length > 0) {
        const { error: attendeeError } = await supabase.from('meeting_attendees').insert(
          selectedAttendees.map((person) => ({
            meeting_id: meeting.id,
            person_id: person.id,
          })),
        )
        if (attendeeError) console.error(attendeeError)
      }

      for (const agenda of agendas) {
        const { data: agendaData, error: agendaError } = await supabase
          .from('meeting_agendas')
          .insert({
            meeting_id: meeting.id,
            subject: agenda.subject,
            content: agenda.content.trim() || null,
            sort_order: agenda.order,
          })
          .select()
          .single()

        if (agendaError) {
          console.error(agendaError)
          continue
        }

        if (agendaData && agenda.todos.length > 0) {
          const { error: todoError } = await supabase.from('todos').insert(
            agenda.todos.map((todo, idx) => ({
              meeting_id: meeting.id,
              agenda_id: agendaData.id,
              title: todo.title,
              person_id: todo.personId || null,
              status: 'pending',
              sort_order: idx,
            })),
          )
          if (todoError) console.error(todoError)
        }
      }

      navigate('/timeline')
    } catch (err) {
      console.error(err)
      alert('회의 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const getPersonName = (id: string) => people.find((p) => p.id === id)?.name ?? id

  if (dataLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 돌아가기
        </button>
        <h1 className="text-lg font-semibold text-gray-900">새 회의·이슈 추가</h1>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">분류</h2>
        <div className="mb-4 flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">카테고리</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value)
                setSelectedBizUnitId('')
                setSelectedProjectId('')
              }}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">선택</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {showDivision && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">사업부문</label>
              <select
                value={selectedBizUnitId}
                onChange={(e) => {
                  setSelectedBizUnitId(e.target.value)
                  setSelectedProjectId('')
                }}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">선택</option>
                {bizUnits.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedCategoryId && (isPersonal || selectedBizUnitId) && (
          <div>
            <label className="mb-2 block text-xs text-gray-500">
              {showMeetingTypes ? '회의종류' : '프로젝트'}
            </label>
            {filteredProjects.length === 0 ? (
              <p className="mb-2 text-xs text-gray-400">선택 가능한 항목이 없습니다.</p>
            ) : (
              <div className="mb-2 flex flex-wrap gap-2">
                {filteredProjects.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProjectId(item.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      selectedProjectId === item.id
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
            {showMeetingTypes ? (
              <button
                type="button"
                onClick={() => setShowMeetingTypeModal(true)}
                className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-primary hover:text-primary"
              >
                + 새 정기회의 등록
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowProjectModal(true)}
                className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-primary hover:text-primary"
              >
                + 새 프로젝트 등록
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">기본 정보</h2>
        <div className="mb-4 flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">날짜</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">회의명</label>
            <input
              type="text"
              placeholder="회의명을 입력하세요"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">공지사항 (선택)</label>
          <textarea
            rows={2}
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="공지사항을 입력하세요"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs text-gray-500">참석자</label>
          <PersonTagInput value={selectedAttendees} onChange={setSelectedAttendees} />
        </div>
      </div>

      {agendas.map((agenda) => (
        <div key={agenda.id} className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">안건 {agenda.order}</h2>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">주요 내용 (선택)</label>
            <textarea
              rows={3}
              placeholder="안건 주요 내용을 입력하세요"
              value={agenda.content}
              onChange={(e) => updateAgendaContent(agenda.id, e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-gray-500">Todo</label>
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                placeholder="내용"
                value={activeAgendaId === agenda.id ? todoInput.title : ''}
                onChange={(e) => {
                  setActiveAgendaId(agenda.id)
                  setTodoInput({ ...todoInput, title: e.target.value })
                }}
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <select
                value={activeAgendaId === agenda.id ? todoInput.personId : ''}
                onChange={(e) => {
                  setActiveAgendaId(agenda.id)
                  setTodoInput({ ...todoInput, personId: e.target.value })
                }}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">담당자</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => {
                  setActiveAgendaId(agenda.id)
                  addTodo(agenda.id)
                }}
              >
                +
              </Button>
            </div>
            {agenda.todos.length > 0 && (
              <ul className="space-y-1">
                {agenda.todos.map((todo, idx) => (
                  <li
                    key={todo.id}
                    className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm"
                  >
                    <span>
                      {idx + 1}. {todo.title} —{' '}
                      {todo.personId ? getPersonName(todo.personId) : '미지정'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTodo(agenda.id, todo.id)}
                      className="text-gray-400 hover:text-danger"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addAgenda}
          className="text-sm text-primary hover:underline"
        >
          + 안건 추가
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <CreateProjectModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        categories={categories}
        bizUnits={bizUnits}
        defaultCategoryId={selectedCategoryId}
        defaultBizUnitId={selectedBizUnitId}
        isPersonal={isPersonal}
        onSuccess={handleProjectCreated}
      />

      <CreateMeetingTypeModal
        open={showMeetingTypeModal}
        onClose={() => setShowMeetingTypeModal(false)}
        categories={categories}
        bizUnits={bizUnits}
        defaultBizUnitId={selectedBizUnitId}
        onSuccess={handleMeetingTypeCreated}
      />
    </div>
  )
}
