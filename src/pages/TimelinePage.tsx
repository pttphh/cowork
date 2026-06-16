import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

type MainTab = 'timeline' | 'feed'
type FeedSubTab = 'byPerson' | 'byTodo'
type MeetingFilter = 'all' | 'regular' | 'project' | 'issue'
type StatusFilter = 'all' | 'draft' | 'published'

interface TimelineTodo {
  id: number
  content: string
  assignee: string
}

interface TimelineCard {
  id: string
  date: string
  dateLabel: string
  type: string
  title: string
  status: 'draft' | 'published'
  todos: TimelineTodo[]
}

const TIMELINE_CARDS: TimelineCard[] = [
  {
    id: '1',
    date: '2026-06-16',
    dateLabel: '2026년 6월 16일 (월)',
    type: '정기회의',
    title: '주간 점검 회의',
    status: 'published',
    todos: [
      { id: 1, content: '가맹 계약서 양식 수정', assignee: '홍길동' },
      { id: 2, content: '물류센터 KPI 리뷰', assignee: '김철수' },
    ],
  },
  {
    id: '2',
    date: '2026-06-16',
    dateLabel: '',
    type: '프로젝트 미팅',
    title: '가맹사업 TFT 킥오프',
    status: 'draft',
    todos: [
      { id: 1, content: 'TFT 멤버 확정', assignee: '이영희' },
    ],
  },
  {
    id: '3',
    date: '2026-06-14',
    dateLabel: '2026년 6월 14일 (토)',
    type: '개별이슈',
    title: '리테일 브랜드 리뉴얼 검토',
    status: 'published',
    todos: [
      { id: 1, content: '브랜드 가이드 초안 작성', assignee: '박민수' },
      { id: 2, content: '경쟁사 벤치마킹', assignee: '홍길동' },
      { id: 3, content: '예산안 검토', assignee: '김철수' },
    ],
  },
]

const MEETING_FILTERS: { key: MeetingFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'regular', label: '정기회의' },
  { key: 'project', label: '프로젝트 미팅' },
  { key: 'issue', label: '개별이슈' },
]

export default function TimelinePage() {
  const [mainTab, setMainTab] = useState<MainTab>('timeline')
  const [feedSubTab, setFeedSubTab] = useState<FeedSubTab>('byPerson')
  const [meetingFilter, setMeetingFilter] = useState<MeetingFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({ '1': true })

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  let lastDate = ''

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

          <div>
            {TIMELINE_CARDS.map((card) => {
              const showDateDivider = card.dateLabel && card.dateLabel !== lastDate
              if (showDateDivider) lastDate = card.dateLabel

              return (
                <div key={card.id}>
                  {showDateDivider && (
                    <div className="mb-3 mt-4 flex items-center gap-3 first:mt-0">
                      <span className="shrink-0 text-xs text-gray-400">{card.dateLabel}</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                  <div className="mb-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <button
                      type="button"
                      onClick={() => toggleCard(card.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div>
                        <div className="text-xs text-gray-400">{card.type}</div>
                        <div className="mt-0.5 text-sm font-medium text-gray-900">{card.title}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={card.status === 'published' ? 'primary' : 'gray'}>
                          {card.status === 'published' ? '배포' : '미배포'}
                        </Badge>
                        <span className="text-xs text-gray-500">Todo {card.todos.length}건</span>
                        <span className="text-gray-400">{expandedCards[card.id] ? '▼' : '▶'}</span>
                      </div>
                    </button>
                    {expandedCards[card.id] && (
                      <div className="border-t border-gray-100 px-4 py-3">
                        <table className="mb-3 w-full text-sm">
                          <tbody>
                            {card.todos.map((todo) => (
                              <tr key={todo.id} className="border-b border-gray-50 last:border-0">
                                <td className="w-8 py-1.5 text-gray-400">{todo.id}</td>
                                <td className="py-1.5 text-gray-800">{todo.content}</td>
                                <td className="py-1.5 text-right text-gray-500">{todo.assignee}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <Link
                            to={`/meeting/${card.id}`}
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
                </div>
              )
            })}
          </div>
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

          {feedSubTab === 'byPerson' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">홍길동</span>
                <span className="text-xs text-gray-500">Todo 2건</span>
              </div>
              <div className="px-4 py-3">
                <div className="mb-3 text-xs text-gray-500">📅 주간 점검 회의 · 06/16</div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 text-sm text-gray-800">🟡 가맹 계약서 수정 진행중</div>
                  <div className="mb-3 text-xs text-gray-400">06/14 &nbsp; Works에 등록함</div>
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
            </div>
          )}

          {feedSubTab === 'byTodo' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 text-sm font-medium text-gray-900">가맹 계약서 양식 수정</div>
              <div className="mb-4 text-xs text-gray-500">홍길동 · 🟡 진행 중</div>
              <div className="mb-3 space-y-2">
                <div className="flex gap-2 text-xs">
                  <span className="text-primary">●</span>
                  <div>
                    <div className="text-gray-700">06/13 TFT 킥오프에서 부여</div>
                    <div className="text-gray-400">Works에 등록함</div>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-gray-300">○</span>
                  <div className="text-gray-500">06/23 주간 점검 예정</div>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="진행사항 입력..."
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-primary focus:outline-none"
                />
                <Button size="sm">저장</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
