import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { TodoStatus } from '../types'

interface SummaryRow {
  topic: string
  content: string[]
}

interface ActionItem {
  id: number
  assignee: string
  action: string
  detail: string
  status: TodoStatus
}

interface FeedEntry {
  time: string
  memo: string
}

interface TodoFeed {
  id: number
  name: string
  assignee: string
  status: TodoStatus
  entries: FeedEntry[]
}

const MEETING_DATA = {
  id: '1',
  title: '주간 점검 회의',
  date: '2026년 6월 16일 (월)',
  project: '주간 경영 점검',
  division: '비즈니스 일반',
  category: 'Bz 정기회의',
  attendees: ['홍길동', '김철수', '이영희'],
  status: 'published' as const,
  notice: '다음 주 회의는 수요일 오전 10시로 변경됩니다.',
  summary: [
    { topic: '가맹사업 현황', content: ['신규 가맹 문의 3건 접수', '계약서 양식 개정 필요'] },
    { topic: '물류센터 운영', content: ['출고율 98% 달성', '재고 관리 시스템 개선 논의'] },
  ] as SummaryRow[],
  actionItems: [
    { id: 1, assignee: '홍길동', action: '가맹 계약서 양식 수정', detail: '법무팀 검토 후 배포', status: 'in_progress' as TodoStatus },
    { id: 2, assignee: '김철수', action: '물류센터 KPI 리뷰', detail: '월간 리포트 작성', status: 'pending' as TodoStatus },
    { id: 3, assignee: '이영희', action: 'TFT 멤버 확정', detail: '차주까지 후보자 명단 제출', status: 'done' as TodoStatus },
  ] as ActionItem[],
  feeds: [
    {
      id: 1,
      name: '가맹 계약서 양식 수정',
      assignee: '홍길동',
      status: 'in_progress' as TodoStatus,
      entries: [
        { time: '06/14 14:30', memo: 'Works에 등록함' },
        { time: '06/15 10:00', memo: '법무팀에 검토 요청' },
      ],
    },
    {
      id: 2,
      name: '물류센터 KPI 리뷰',
      assignee: '김철수',
      status: 'pending' as TodoStatus,
      entries: [{ time: '06/16 09:00', memo: '데이터 수집 중' }],
    },
  ] as TodoFeed[],
}

const STATUS_LABELS: Record<TodoStatus, string> = {
  pending: '대기',
  in_progress: '진행 중',
  done: '완료',
}

const STATUS_VARIANTS: Record<TodoStatus, 'gray' | 'warning' | 'success'> = {
  pending: 'gray',
  in_progress: 'warning',
  done: 'success',
}

const STATUS_DOTS: Record<TodoStatus, string> = {
  pending: '⚪',
  in_progress: '🟡',
  done: '🟢',
}

export default function MeetingDetailPage() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(MEETING_DATA.title)
  const [notice, setNotice] = useState(MEETING_DATA.notice)

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/timeline')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 타임라인으로
        </button>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Badge variant={MEETING_DATA.status === 'published' ? 'primary' : 'gray'}>
                {MEETING_DATA.status === 'published' ? '배포' : '미배포'}
              </Badge>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                ✏ 편집
              </Button>
              <Button variant="ghost" size="sm" className="text-danger">
                🗑 삭제
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button size="sm" onClick={() => setIsEditing(false)}>
                저장
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                취소
              </Button>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-warning">
          {isEditing ? (
            <textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              rows={2}
              className="w-full rounded border border-yellow-300 bg-white px-2 py-1 text-sm focus:outline-none"
            />
          ) : (
            <>📢 공지사항: {notice}</>
          )}
        </div>
      )}

      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-xl font-semibold focus:border-primary focus:outline-none"
        />
      ) : (
        <h1 className="mb-3 text-xl font-semibold text-gray-900">{title}</h1>
      )}

      <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-500">
        <span>📅 {MEETING_DATA.date}</span>
        <span>📁 {MEETING_DATA.project}</span>
        <span>
          🏢 {MEETING_DATA.division} · {MEETING_DATA.category}
        </span>
        <span>👥 {MEETING_DATA.attendees.join(', ')}</span>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
          핵심 요약
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-1/4 px-4 py-2 text-left font-medium text-gray-600">주제</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">내용</th>
              </tr>
            </thead>
            <tbody>
              {MEETING_DATA.summary.map((row) => (
                <tr key={row.topic} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 align-top font-medium text-gray-800">{row.topic}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <ul className="list-disc pl-4">
                      {row.content.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
          실행 항목
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-8 px-3 py-2 text-left font-medium text-gray-600">#</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">담당자</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">실행사항</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">내용</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">상태</th>
              </tr>
            </thead>
            <tbody>
              {MEETING_DATA.actionItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2 text-gray-400">{item.id}</td>
                  <td className="px-3 py-2 text-gray-700">{item.assignee}</td>
                  <td className="px-3 py-2 text-gray-800">{item.action}</td>
                  <td className="px-3 py-2 text-gray-600">{item.detail}</td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_VARIANTS[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
          진행사항 피드
        </h2>
        <div className="space-y-4">
          {MEETING_DATA.feeds.map((feed) => (
            <div key={feed.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">
                  {STATUS_DOTS[feed.status]} {feed.name} — {feed.assignee}
                </div>
                <Badge variant={STATUS_VARIANTS[feed.status]}>
                  {STATUS_LABELS[feed.status]}
                </Badge>
              </div>
              <div className="mb-3 space-y-2">
                {feed.entries.map((entry) => (
                  <div key={entry.time} className="text-xs">
                    <span className="text-gray-400">{entry.time}</span>
                    <span className="ml-2 text-gray-700">{entry.memo}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="진행사항 입력..."
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                />
                <Button size="sm">저장</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
