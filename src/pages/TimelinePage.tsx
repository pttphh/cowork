import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { LayoutOutletContext } from '../components/layout/Layout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Meeting, TodoStatus, TodoWithRelations } from '../types'

type MainTab = 'timeline' | 'feed'
type FeedSubTab = 'byPerson' | 'byTodo'
type MeetingFilter = 'all' | 'regular' | 'project' | 'issue'
type StatusFilter = 'all' | 'draft' | 'published'

const MEETING_FILTERS: { key: MeetingFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'regular', label: '정기회의' },
  { key: 'project', label: '프로젝트 미팅' },
  { key: 'issue', label: '개별이슈' },
]

const STATUS_LABELS: Record<TodoStatus, string> = {
  pending: '대기',
  in_progress: '진행 중',
  done: '완료',
}

// 상태를 색상 뱃지로 즉각 인지할 수 있도록 매핑 (대기=회색, 진행중=주황, 완료=초록)
const TODO_STATUS_VARIANT: Record<TodoStatus, 'gray' | 'warning' | 'success'> = {
  pending: 'gray',
  in_progress: 'warning',
  done: 'success',
}

// 카테고리는 작은 색상 점으로만 구분해 시선을 빼앗지 않도록 처리
const MEETING_TYPE_DOT: Record<string, string> = {
  정기회의: 'bg-primary',
  '프로젝트 미팅': 'bg-success',
  개별이슈: 'bg-warning',
}

function formatDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`
}

function formatShortDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

function formatMemoDate(dateStr: string) {
  const date = new Date(dateStr)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${min}`
}

function getMeetingType(meeting: Meeting) {
  if (!meeting.projects) return '개별이슈'
  return meeting.projects.is_regular ? '정기회의' : '프로젝트 미팅'
}

function matchesMeetingFilter(meeting: Meeting, filter: MeetingFilter) {
  if (filter === 'all') return true
  if (filter === 'regular') return meeting.projects?.is_regular === true
  if (filter === 'project') return !!meeting.projects && !meeting.projects.is_regular
  if (filter === 'issue') return !meeting.projects
  return true
}

function matchesStatusFilter(meeting: Meeting, filter: StatusFilter) {
  if (filter === 'all') return true
  return meeting.status === filter
}

export default function TimelinePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { selectedProjectId, selectedProjectName } =
    useOutletContext<LayoutOutletContext>()
  const [mainTab, setMainTab] = useState<MainTab>('timeline')
  const [feedSubTab, setFeedSubTab] = useState<FeedSubTab>('byPerson')
  const [meetingFilter, setMeetingFilter] = useState<MeetingFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [todosWithPeople, setTodosWithPeople] = useState<TodoWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedError, setFeedError] = useState('')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [memoInputs, setMemoInputs] = useState<Record<string, string>>({})
  const [memoSaving, setMemoSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadMeetings()
  }, [selectedProjectId])

  useEffect(() => {
    loadFeedData()
  }, [])

  async function loadMeetings() {
    setLoading(true)
    setError('')

    try {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          projects(name, is_regular, page_type),
          meeting_agendas(id, subject, content, sort_order),
          todos(id, title, detail, status, sort_order, people(name))
        `)

      if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data, error: fetchError } = await query.order('meeting_date', {
        ascending: false,
      })

      if (fetchError) {
        setError('데이터를 불러올 수 없습니다.')
        return
      }

      if (data) {
        setMeetings(data as Meeting[])
        if (data.length > 0) {
          setExpandedCards({ [data[0].id]: true })
        }
      }
    } catch {
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function loadFeedData() {
    setFeedLoading(true)
    setFeedError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('todos')
        .select(`
          *,
          people(id, name),
          meetings(id, title, meeting_date),
          todo_memos(id, content, created_at)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setFeedError('데이터를 불러올 수 없습니다.')
        return
      }

      if (data) setTodosWithPeople(data as TodoWithRelations[])
    } catch {
      setFeedError('데이터를 불러올 수 없습니다.')
    } finally {
      setFeedLoading(false)
    }
  }

  const filteredMeetings = useMemo(
    () =>
      meetings.filter(
        (m) => matchesMeetingFilter(m, meetingFilter) && matchesStatusFilter(m, statusFilter),
      ),
    [meetings, meetingFilter, statusFilter],
  )

  const groupedMeetings = useMemo(() => {
    return filteredMeetings.reduce<Record<string, Meeting[]>>((acc, meeting) => {
      const date = meeting.meeting_date
      if (!acc[date]) acc[date] = []
      acc[date].push(meeting)
      return acc
    }, {})
  }, [filteredMeetings])

  const sortedDates = useMemo(
    () => Object.keys(groupedMeetings).sort((a, b) => b.localeCompare(a)),
    [groupedMeetings],
  )

  const todosByPerson = useMemo(() => {
    return todosWithPeople.reduce<Record<string, TodoWithRelations[]>>((acc, todo) => {
      const personName = todo.people?.name ?? '미지정'
      if (!acc[personName]) acc[personName] = []
      acc[personName].push(todo)
      return acc
    }, {})
  }, [todosWithPeople])

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleDeleteMeeting(meetingId: string) {
    if (!confirm('이 회의를 삭제하시겠습니까?')) return

    const { error: deleteError } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId)

    if (deleteError) {
      console.error(deleteError)
      alert('삭제에 실패했습니다.')
      return
    }

    loadMeetings()
  }

  async function handleAddMemo(todoId: string) {
    const content = memoInputs[todoId]?.trim()
    if (!content || !profile) return

    setMemoSaving((prev) => ({ ...prev, [todoId]: true }))
    try {
      const { error: insertError } = await supabase.from('todo_memos').insert({
        todo_id: todoId,
        content,
        created_by: profile.id,
      })

      if (insertError) {
        console.error(insertError)
        alert('메모 저장에 실패했습니다.')
        return
      }

      setMemoInputs((prev) => ({ ...prev, [todoId]: '' }))
      await loadFeedData()
    } catch (err) {
      console.error(err)
      alert('메모 저장에 실패했습니다.')
    } finally {
      setMemoSaving((prev) => ({ ...prev, [todoId]: false }))
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        {selectedProjectName ?? '전체 타임라인'}
      </h1>

      {/* 상단 탭 + 액션 */}
      <div className="mb-8 flex items-end justify-between border-b border-gray-200">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setMainTab('timeline')}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
              mainTab === 'timeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            타임라인
          </button>
          <button
            type="button"
            onClick={() => setMainTab('feed')}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
              mainTab === 'feed'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            피드 관리
          </button>
        </div>
        <div className="pb-2">
          <Link to="/meeting/new">
            <Button>+ 새 회의·이슈 추가</Button>
          </Link>
        </div>
      </div>

      {mainTab === 'timeline' && (
        <>
          {/* 필터바 */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-gray-400">회의</span>
              {MEETING_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setMeetingFilter(f.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    meetingFilter === f.key
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">상태</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 focus:border-primary focus:outline-none"
              >
                <option value="all">전체</option>
                <option value="draft">미배포</option>
                <option value="published">배포</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="py-16 text-center text-sm text-gray-400">로딩 중...</div>
          )}

          {error && !loading && (
            <div className="py-16 text-center text-sm text-danger">{error}</div>
          )}

          {!loading && !error && sortedDates.length === 0 && (
            <div className="py-16 text-center text-sm text-gray-400">등록된 항목이 없습니다.</div>
          )}

          {!loading && !error && (
            <div className="space-y-8">
              {sortedDates.map((date) => (
                <div key={date}>
                  {/* 날짜 구분선 (부가 정보 — 가장 연하게) */}
                  <div className="mb-4 flex items-center gap-3">
                    <span className="shrink-0 text-xs font-medium text-gray-400">
                      {formatDateLabel(date)}
                    </span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  <div className="space-y-3">
                    {groupedMeetings[date].map((meeting) => {
                      const todos = meeting.todos ?? []
                      const sortedTodos = [...todos].sort((a, b) => a.sort_order - b.sort_order)
                      const meetingType = getMeetingType(meeting)
                      const isExpanded = expandedCards[meeting.id]

                      return (
                        <div
                          key={meeting.id}
                          className={`overflow-hidden rounded-xl border bg-white transition-colors ${
                            isExpanded ? 'border-gray-300' : 'border-gray-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCard(meeting.id)}
                            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50"
                          >
                            <div className="min-w-0">
                              {/* 카테고리 — 작은 점 + 연한 라벨 */}
                              <div className="mb-1.5 flex items-center gap-1.5">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    MEETING_TYPE_DOT[meetingType] ?? 'bg-gray-300'
                                  }`}
                                />
                                <span className="text-xs font-medium text-gray-400">
                                  {meetingType}
                                </span>
                              </div>
                              {/* 제목 — 가장 눈에 띄게 */}
                              <h3 className="truncate text-base font-semibold text-gray-900">
                                {meeting.title}
                              </h3>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              {/* 상태 — 색상 뱃지 */}
                              <Badge variant={meeting.status === 'published' ? 'success' : 'warning'}>
                                {meeting.status === 'published' ? '배포' : '미배포'}
                              </Badge>
                              <span className="text-xs text-gray-400">Todo {todos.length}</span>
                              <span className="text-gray-300">{isExpanded ? '▼' : '▶'}</span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-100 px-5 py-4">
                              {sortedTodos.length > 0 ? (
                                <ul className="mb-4 space-y-1">
                                  {sortedTodos.map((todo, idx) => (
                                    <li
                                      key={todo.id}
                                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
                                    >
                                      <span className="w-5 shrink-0 text-xs font-medium text-gray-300">
                                        {idx + 1}
                                      </span>
                                      <span className="flex-1 text-sm leading-relaxed text-gray-800">
                                        {todo.title}
                                      </span>
                                      <span className="shrink-0 text-xs text-gray-400">
                                        {todo.people?.name ?? '—'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mb-4 px-2 text-xs text-gray-400">
                                  등록된 Todo가 없습니다.
                                </p>
                              )}
                              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                                  className="text-xs font-medium text-primary hover:underline"
                                >
                                  상세 보기
                                </button>
                                <div className="flex gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                                  >
                                    수정
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-danger"
                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                  >
                                    삭제
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mainTab === 'feed' && (
        <>
          <div className="mb-6 flex gap-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setFeedSubTab('byPerson')}
              className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
                feedSubTab === 'byPerson'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              사람별
            </button>
            <button
              type="button"
              onClick={() => setFeedSubTab('byTodo')}
              className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
                feedSubTab === 'byTodo'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Todo별
            </button>
          </div>

          {feedLoading && (
            <div className="py-16 text-center text-sm text-gray-400">로딩 중...</div>
          )}

          {feedError && !feedLoading && (
            <div className="py-16 text-center text-sm text-danger">{feedError}</div>
          )}

          {!feedLoading && !feedError && feedSubTab === 'byPerson' && (
            <>
              {Object.keys(todosByPerson).length === 0 && (
                <div className="py-16 text-center text-sm text-gray-400">등록된 항목이 없습니다.</div>
              )}
              <div className="space-y-4">
                {Object.entries(todosByPerson).map(([personName, todos]) => (
                  <div
                    key={personName}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                      <span className="text-sm font-semibold text-gray-900">{personName}</span>
                      <span className="text-xs text-gray-400">Todo {todos.length}건</span>
                    </div>
                    <div className="divide-y divide-gray-100 px-5 py-1">
                      {todos.map((todo) => (
                        <div key={todo.id} className="py-4">
                          {todo.meetings && (
                            <div className="mb-2 text-xs text-gray-400">
                              {todo.meetings.title} · {formatShortDate(todo.meetings.meeting_date)}
                            </div>
                          )}
                          <div className="rounded-lg border border-gray-200 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <Badge variant={TODO_STATUS_VARIANT[todo.status]}>
                                {STATUS_LABELS[todo.status]}
                              </Badge>
                              <span className="text-sm font-medium text-gray-800">
                                {todo.title}
                              </span>
                            </div>
                            {todo.todo_memos && todo.todo_memos.length > 0 && (
                              <div className="mb-3 flex gap-2 text-xs leading-relaxed text-gray-500">
                                <span className="shrink-0 text-gray-400">
                                  {formatMemoDate(todo.todo_memos[0].created_at)}
                                </span>
                                <span>{todo.todo_memos[0].content}</span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="진행사항 입력..."
                                value={memoInputs[todo.id] ?? ''}
                                onChange={(e) =>
                                  setMemoInputs((prev) => ({ ...prev, [todo.id]: e.target.value }))
                                }
                                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddMemo(todo.id)}
                                disabled={memoSaving[todo.id]}
                              >
                                {memoSaving[todo.id] ? '저장 중...' : '저장'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!feedLoading && !feedError && feedSubTab === 'byTodo' && (
            <>
              {todosWithPeople.length === 0 && (
                <div className="py-16 text-center text-sm text-gray-400">등록된 항목이 없습니다.</div>
              )}
              <div className="space-y-4">
                {todosWithPeople.map((todo) => {
                  const memos = [...(todo.todo_memos ?? [])].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                  )

                  return (
                    <div
                      key={todo.id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5"
                    >
                      {/* 제목 — 가장 눈에 띄게 */}
                      <h3 className="mb-2 text-base font-semibold text-gray-900">{todo.title}</h3>
                      {/* 담당자 + 상태 */}
                      <div className="mb-4 flex items-center gap-2">
                        <Badge variant={TODO_STATUS_VARIANT[todo.status]}>
                          {STATUS_LABELS[todo.status]}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {todo.people?.name ?? '미지정'}
                        </span>
                      </div>
                      {memos.length > 0 ? (
                        <div className="mb-4 space-y-3">
                          {memos.map((memo, idx) => (
                            <div key={memo.id} className="flex gap-2.5 text-xs">
                              <span
                                className={`mt-1 shrink-0 ${
                                  idx === 0 ? 'text-primary' : 'text-gray-300'
                                }`}
                              >
                                {idx === 0 ? '●' : '○'}
                              </span>
                              <div className="leading-relaxed">
                                <div className="font-medium text-gray-500">
                                  {formatMemoDate(memo.created_at)}
                                </div>
                                <div className="text-gray-700">{memo.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mb-4 text-xs text-gray-400">등록된 진행사항이 없습니다.</p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="진행사항 입력..."
                          value={memoInputs[todo.id] ?? ''}
                          onChange={(e) =>
                            setMemoInputs((prev) => ({ ...prev, [todo.id]: e.target.value }))
                          }
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddMemo(todo.id)}
                          disabled={memoSaving[todo.id]}
                        >
                          {memoSaving[todo.id] ? '저장 중...' : '저장'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
