import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'

const CATEGORIES = [
  { value: 'bz-regular', label: 'Bz 정기회의' },
  { value: 'bz-performance', label: 'Bz 성과 관리' },
  { value: 'bz-org', label: 'Bz 조직 운영' },
  { value: 'bz-strategy', label: 'Bz 전략 기획' },
  { value: 'personal-leisure', label: '사적인 삶 (여유)' },
  { value: 'personal-growth', label: '사적인 삶 (성장)' },
  { value: 'personal-relation', label: '사적인 삶 (관계)' },
]

const DIVISIONS = [
  { value: 'biz-general', label: '비즈니스 일반' },
  { value: 'retail', label: '리테일' },
]

const MEETING_TYPES = ['주간 경영 점검', '점검회의 (상품)']

const PROJECTS = ['가맹사업 TFT', '물류센터 개선', '리테일 브랜드 리뉴얼']

const ATTENDEES = ['홍길동', '김철수', '이영희', '박민수']

const ASSIGNEES = ['홍길동', '김철수', '이영희', '박민수', '미지정']

interface AgendaTodo {
  id: number
  content: string
  assignee: string
}

interface Agenda {
  id: number
  todos: AgendaTodo[]
}

const BZ_CATEGORIES = ['bz-regular', 'bz-performance', 'bz-org', 'bz-strategy']
const PERSONAL_CATEGORIES = ['personal-leisure', 'personal-growth', 'personal-relation']

export default function NewMeetingPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [division, setDivision] = useState('')
  const [selectedChip, setSelectedChip] = useState('')
  const [attendees, setAttendees] = useState<string[]>(['홍길동'])
  const [agendas, setAgendas] = useState<Agenda[]>([{ id: 1, todos: [] }])
  const [todoInput, setTodoInput] = useState({ content: '', assignee: '' })
  const [activeAgendaId, setActiveAgendaId] = useState(1)

  const isBz = BZ_CATEGORIES.includes(category)
  const isPersonal = PERSONAL_CATEGORIES.includes(category)
  const isBzRegular = category === 'bz-regular'
  const showDivision = isBz
  const showMeetingTypes = isBzRegular

  const addAttendee = () => {
    const available = ATTENDEES.find((a) => !attendees.includes(a))
    if (available) setAttendees([...attendees, available])
  }

  const removeAttendee = (name: string) => {
    setAttendees(attendees.filter((a) => a !== name))
  }

  const addTodo = (agendaId: number) => {
    if (!todoInput.content.trim()) return
    setAgendas(
      agendas.map((a) =>
        a.id === agendaId
          ? {
              ...a,
              todos: [
                ...a.todos,
                {
                  id: a.todos.length + 1,
                  content: todoInput.content,
                  assignee: todoInput.assignee || '미지정',
                },
              ],
            }
          : a,
      ),
    )
    setTodoInput({ content: '', assignee: '' })
  }

  const removeTodo = (agendaId: number, todoId: number) => {
    setAgendas(
      agendas.map((a) =>
        a.id === agendaId ? { ...a, todos: a.todos.filter((t) => t.id !== todoId) } : a,
      ),
    )
  }

  const addAgenda = () => {
    const newId = agendas.length + 1
    setAgendas([...agendas, { id: newId, todos: [] }])
    setActiveAgendaId(newId)
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

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">분류</h2>
        <div className="mb-4 flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">카테고리</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setSelectedChip('')
              }}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">선택</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {showDivision && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">사업부문</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">선택</option>
                {DIVISIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {category && !isPersonal && (
          <div>
            <label className="mb-2 block text-xs text-gray-500">
              {showMeetingTypes ? '회의종류' : '프로젝트'}
            </label>
            <div className="flex flex-wrap gap-2">
              {(showMeetingTypes ? MEETING_TYPES : PROJECTS).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedChip(item)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedChip === item
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {item}
                </button>
              ))}
              {!showMeetingTypes && (
                <button
                  type="button"
                  className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-gray-400"
                >
                  + 새 프로젝트
                </button>
              )}
            </div>
          </div>
        )}

        {isPersonal && (
          <div>
            <label className="mb-2 block text-xs text-gray-500">프로젝트</label>
            <div className="flex flex-wrap gap-2">
              {['골프 집계'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedChip(item)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedChip === item
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
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
              defaultValue="2026-06-16"
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">회의명</label>
            <input
              type="text"
              placeholder="회의명을 입력하세요"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs text-gray-500">참석자</label>
          <div className="flex flex-wrap items-center gap-2">
            {attendees.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeAttendee(name)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={addAttendee}
              className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:border-gray-400"
            >
              + 추가
            </button>
          </div>
        </div>
      </div>

      {agendas.map((agenda) => (
        <div key={agenda.id} className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">안건 {agenda.id}</h2>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">주요 내용 (선택)</label>
            <textarea
              rows={3}
              placeholder="안건 주요 내용을 입력하세요"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-gray-500">Todo</label>
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                placeholder="내용"
                value={activeAgendaId === agenda.id ? todoInput.content : ''}
                onChange={(e) => {
                  setActiveAgendaId(agenda.id)
                  setTodoInput({ ...todoInput, content: e.target.value })
                }}
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <select
                value={activeAgendaId === agenda.id ? todoInput.assignee : ''}
                onChange={(e) => {
                  setActiveAgendaId(agenda.id)
                  setTodoInput({ ...todoInput, assignee: e.target.value })
                }}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">담당자</option>
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>
                    {a}
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
                      {idx + 1}. {todo.content} — {todo.assignee}
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
          <Button variant="secondary" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button>저장</Button>
        </div>
      </div>
    </div>
  )
}
