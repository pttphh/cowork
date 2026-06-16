import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
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

const STATUS_EMOJI: Record<TodoStatus, string> = {
  pending: '⚪',
  in_progress: '🟡',
  done: '🟢',
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

  useEffect(() => {
    loadMeetings()
    loadFeedData()
  }, [])

  async function loadMeetings() {
    setLoading(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('meetings')
        .select(`
          *,
          projects(name, is_regular, page_type),
          meeting_agendas(id, subject, content, sort_order),
          todos(id, title, detail, status, sort_order, people(name))
        `)
        .order('meeting_date', { ascending: false })

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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMainTab('timeline')}
            className={`rounded-t px-4 py-2 text-sm font-medium ${
              mainTab === 'timeline'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            타임라인
          </button>
          <button
            type="button"
            onClick={() => setMainTab('feed')}
            className={`rounded-t px-4 py-2 text-sm font-medium ${
              mainTab === 'feed'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            피드 관리
          </button>
        </div>
        <Link to="/meeting/new">
          <Button>+ 새 회의·이슈 추가</Button>
        </Link>
      </div>

      {mainTab === 'timeline' && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">회의:</span>
              {MEETING_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setMeetingFilter(f.key)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    meetingFilter === f.key
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">상태:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-primary focus:outline-none"
              >
                <option value="all">전체</option>
                <option value="draft">미배포</option>
                <option value="published">배포</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="py-12 text-center text-sm text-gray-400">로딩 중...</div>
          )}

          {error && !loading && (
            <div className="py-12 text-center text-sm text-red-500">{error}</div>
          )}

          {!loading && !error && sortedDates.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">등록된 항목이 없습니다.</div>
          )}

          {!loading && !error && (
            <div>
              {sortedDates.map((date) => (
                <div key={date}>
                  <div className="mb-3 mt-4 flex items-center gap-3 first:mt-0">
                    <span className="shrink-0 text-xs text-gray-400">{formatDateLabel(date)}</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  {groupedMeetings[date].map((meeting) => {
                    const todos = meeting.todos ?? []
                    const sortedTodos = [...todos].sort((a, b) => a.sort_order - b.sort_order)

                    return (
                      <div key={meeting.id} className="mb-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <button
                          type="button"
                          onClick={() => toggleCard(meeting.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <div>
                            <div className="text-xs text-gray-400">{getMeetingType(meeting)}</div>
                            <div className="mt-0.5 text-sm font-medium text-gray-900">{meeting.title}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={meeting.status === 'published' ? 'primary' : 'gray'}>
                              {meeting.status === 'published' ? '배포' : '미배포'}
                            </Badge>
                            <span className="text-xs text-gray-500">Todo {todos.length}건</span>
                            <span className="text-gray-400">{expandedCards[meeting.id] ? '▼' : '▶'}</span>
                          </div>
                        </button>
                        {expandedCards[meeting.id] && (
                          <div className="border-t border-gray-100 px-4 py-3">
                            {sortedTodos.length > 0 ? (
                              <table className="mb-3 w-full text-sm">
                                <tbody>
                                  {sortedTodos.map((todo, idx) => (
                                    <tr key={todo.id} className="border-b border-gray-50 last:border-0">
                                      <td className="w-8 py-1.5 text-gray-400">{idx + 1}</td>
                                      <td className="py-1.5 text-gray-800">{todo.title}</td>
                                      <td className="py-1.5 text-right text-gray-500">
                                        {todo.people?.name ?? '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="mb-3 text-xs text-gray-400">등록된 Todo가 없습니다.</p>
                            )}
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                              <Link
                                to={`/meeting/${meeting.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                상세
                              </Link>
                              <div className="flex gap-2">
                                <Button variant="secondary" size="sm">
                                  수정
                                </Button>
                                <Button variant="ghost" size="sm" className="text-danger">
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
              ))}
            </div>
          )}
        </>
      )}

      {mainTab === 'feed' && (
        <>
          <div className="mb-4 flex gap-1 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setFeedSubTab('byPerson')}
              className={`px-4 py-2 text-sm ${
                feedSubTab === 'byPerson'
                  ? 'border-b-2 border-primary font-medium text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              사람별
            </button>
            <button
              type="button"
              onClick={() => setFeedSubTab('byTodo')}
              className={`px-4 py-2 text-sm ${
                feedSubTab === 'byTodo'
                  ? 'border-b-2 border-primary font-medium text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Todo별
            </button>
          </div>

          {feedLoading && (
            <div className="py-12 text-center text-sm text-gray-400">로딩 중...</div>
          )}

          {feedError && !feedLoading && (
            <div className="py-12 text-center text-sm text-red-500">{feedError}</div>
          )}

          {!feedLoading && !feedError && feedSubTab === 'byPerson' && (
            <>
              {Object.keys(todosByPerson).length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">등록된 항목이 없습니다.</div>
              )}
              <div className="space-y-4">
                {Object.entries(todosByPerson).map(([personName, todos]) => (
                  <div key={personName} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{personName}</span>
                      <span className="text-xs text-gray-500">Todo {todos.length}건</span>
                    </div>
                    <div className="divide-y divide-gray-100 px-4 py-3">
                      {todos.map((todo) => (
                        <div key={todo.id} className="py-3 first:pt-0 last:pb-0">
                          {todo.meetings && (
                            <div className="mb-3 text-xs text-gray-500">
                              📅 {todo.meetings.title} · {formatShortDate(todo.meetings.meeting_date)}
                            </div>
                          )}
                          <div className="rounded-lg border border-gray-200 p-3">
                            <div className="mb-2 text-sm text-gray-800">
                              {STATUS_EMOJI[todo.status]} {todo.title}{' '}
                              {todo.status === 'in_progress' && '진행중'}
                            </div>
                            {todo.todo_memos && todo.todo_memos.length > 0 && (
                              <div className="mb-3 text-xs text-gray-400">
                                {formatMemoDate(todo.todo_memos[0].created_at)} &nbsp;{' '}
                                {todo.todo_memos[0].content}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="진행사항 입력..."
                                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-primary focus:outline-none"
                              />
                              <Button size="sm">저장</Button>
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
                <div className="py-12 text-center text-sm text-gray-400">등록된 항목이 없습니다.</div>
              )}
              <div className="space-y-4">
                {todosWithPeople.map((todo) => {
                  const memos = [...(todo.todo_memos ?? [])].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                  )

                  return (
                    <div key={todo.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
                      <div className="mb-1 text-sm font-medium text-gray-900">{todo.title}</div>
                      <div className="mb-4 text-xs text-gray-500">
                        {todo.people?.name ?? '미지정'} · {STATUS_EMOJI[todo.status]}{' '}
                        {STATUS_LABELS[todo.status]}
                      </div>
                      {memos.length > 0 ? (
                        <div className="mb-3 space-y-2">
                          {memos.map((memo, idx) => (
                            <div key={memo.id} className="flex gap-2 text-xs">
                              <span className={idx === 0 ? 'text-primary' : 'text-gray-300'}>
                                {idx === 0 ? '●' : '○'}
                              </span>
                              <div>
                                <div className="text-gray-700">{formatMemoDate(memo.created_at)}</div>
                                <div className="text-gray-400">{memo.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mb-3 text-xs text-gray-400">등록된 진행사항이 없습니다.</p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="진행사항 입력..."
                          className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-primary focus:outline-none"
                        />
                        <Button size="sm">저장</Button>
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
