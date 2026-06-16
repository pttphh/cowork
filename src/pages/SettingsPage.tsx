import { useState } from 'react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { UserRole } from '../types'

type SettingsTab = 'category' | 'division' | 'meeting' | 'account'
type MeetingSubTab = 'regular' | 'active' | 'done'

const CATEGORIES = [
  'Bz 정기회의',
  'Bz 성과 관리',
  'Bz 조직 운영',
  'Bz 전략 기획',
  '사적인 삶 (여유)',
  '사적인 삶 (성장)',
  '사적인 삶 (관계)',
]

const DIVISIONS = [
  { name: '비즈니스 일반', projects: 2, regulars: 1 },
  { name: '리테일', projects: 1, regulars: 1 },
]

const REGULAR_MEETINGS = [
  { name: '주간 경영 점검', division: '비즈니스 일반', attendees: '홍길동, 김철수' },
  { name: '점검회의 (상품)', division: '리테일', attendees: '이영희, 박민수' },
]

const ACTIVE_PROJECTS = [
  { name: '가맹사업 TFT', division: '비즈니스 일반', category: 'Bz 전략 기획' },
  { name: '물류센터 개선', division: '비즈니스 일반', category: 'Bz 조직 운영' },
  { name: '리테일 브랜드 리뉴얼', division: '리테일', category: 'Bz 성과 관리' },
]

const DONE_PROJECTS = [
  { name: 'ERP 시스템 전환', completedAt: '2026-03-15' },
  { name: '매장 리뉴얼 1차', completedAt: '2026-01-20' },
]

const USERS: { name: string; role: UserRole; email: string }[] = [
  { name: '홍길동', role: 'ceo', email: 'ceo@example.com' },
  { name: '김비서', role: 'secretary', email: 'secretary@example.com' },
  { name: '이매니저', role: 'sales_manager', email: 'sales.mgr@example.com' },
  { name: '박직원', role: 'sales_staff', email: 'sales@example.com' },
]

const ROLE_LABELS: Record<UserRole, string> = {
  ceo: '대표이사',
  secretary: '비서',
  sales_manager: '영업 매니저',
  sales_staff: '영업 직원',
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('category')
  const [meetingSubTab, setMeetingSubTab] = useState<MeetingSubTab>('regular')

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
          <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {CATEGORIES.map((name) => (
              <li key={name} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-800">{name}</span>
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
          <Button variant="secondary" size="sm">
            + 추가
          </Button>
        </div>
      )}

      {activeTab === 'division' && (
        <div>
          <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {DIVISIONS.map((d) => (
              <li key={d.name} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-6">
                  <span className="text-sm font-medium text-gray-800">{d.name}</span>
                  <span className="text-xs text-gray-500">프로젝트 {d.projects}개</span>
                  <span className="text-xs text-gray-500">정기회의 {d.regulars}개</span>
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
            <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {REGULAR_MEETINGS.map((m) => (
                <li key={m.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                    <span className="text-xs text-gray-500">{m.division}</span>
                    <span className="text-xs text-gray-400">디폴트: {m.attendees}</span>
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

          {meetingSubTab === 'active' && (
            <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {ACTIVE_PROJECTS.map((p) => (
                <li key={p.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.division}</span>
                    <span className="text-xs text-gray-400">{p.category}</span>
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

          {meetingSubTab === 'done' && (
            <ul className="mb-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {DONE_PROJECTS.map((p) => (
                <li key={p.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{p.name}</span>
                    <span className="text-xs text-gray-400">완료일: {p.completedAt}</span>
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

          <Button variant="secondary" size="sm">
            + 추가
          </Button>
        </div>
      )}

      {activeTab === 'account' && (
        <div>
          <ul className="mb-6 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {USERS.map((user) => (
              <li key={user.email} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">{user.name}</span>
                  <Badge variant={ROLE_VARIANTS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                  <span className="text-xs text-gray-500">{user.email}</span>
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

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 text-sm font-medium text-gray-800">내 계정 — 홍길동</div>
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
