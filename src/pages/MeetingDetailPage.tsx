import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Meeting, TodoStatus } from '../types'

interface EditAgenda {
  order: number
  subject: string
  content: string
  todos: { title: string; personId: string; detail: string }[]
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

const STATUS_CYCLE: TodoStatus[] = ['pending', 'in_progress', 'done']

function formatDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`
}

function formatMemoDate(dateStr: string) {
  const date = new Date(dateStr)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${min}`
}

export default function MeetingDetailPage() {
  const { id: meetingId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotice, setEditNotice] = useState('')
  const [editAgendas, setEditAgendas] = useState<EditAgenda[]>([])
  const [memoInputs, setMemoInputs] = useState<Record<string, string>>({})
  const [memoSaving, setMemoSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (meetingId) loadMeeting()
  }, [meetingId])

  async function loadMeeting() {
    if (!meetingId) return
    setLoading(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('meetings')
        .select(`
          *,
          projects(name, is_regular, page_type, business_units(name), categories(name)),
          meeting_attendees(people(name)),
          meeting_agendas(id, subject, content, sort_order),
          todos(id, title, detail, status, sort_order, agenda_id, people(name), todo_memos(id, content, created_at))
        `)
        .eq('id', meetingId)
        .single()

      if (fetchError || !data) {
        console.error(fetchError)
        setError('데이터를 불러올 수 없습니다.')
        return
      }

      setMeeting(data as Meeting)
    } catch (err) {
      console.error(err)
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  function startEditing() {
    if (!meeting) return
    setEditTitle(meeting.title)
    setEditDate(meeting.meeting_date)
    setEditNotice(meeting.notice ?? '')
    const agendas = [...(meeting.meeting_agendas ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
    setEditAgendas(
      agendas.map((a) => ({
        order: a.sort_order,
        subject: a.subject,
        content: a.content ?? '',
        todos: (meeting.todos ?? [])
          .filter((t) => t.agenda_id === a.id)
          .sort((x, y) => x.sort_order - y.sort_order)
          .map((t) => ({
            title: t.title,
            personId: '',
            detail: t.detail ?? '',
          })),
      })),
    )
    setIsEditing(true)
  }

  async function handleSave() {
    if (!meetingId || !meeting) return
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('meetings')
        .update({
          title: editTitle.trim(),
          meeting_date: editDate,
          notice: editNotice.trim() || null,
        })
        .eq('id', meetingId)

      if (updateError) {
        console.error(updateError)
        alert('저장에 실패했습니다.')
        return
      }

      await supabase.from('todos').delete().eq('meeting_id', meetingId)
      await supabase.from('meeting_agendas').delete().eq('meeting_id', meetingId)

      for (const agenda of editAgendas) {
        const { data: agendaData, error: agendaError } = await supabase
          .from('meeting_agendas')
          .insert({
            meeting_id: meetingId,
            subject: agenda.subject,
            content: agenda.content.trim() || null,
            sort_order: agenda.order,
          })
          .select()
          .single()

        if (agendaError || !agendaData) {
          console.error(agendaError)
          continue
        }

        if (agenda.todos.length > 0) {
          await supabase.from('todos').insert(
            agenda.todos.map((todo, idx) => ({
              meeting_id: meetingId,
              agenda_id: agendaData.id,
              title: todo.title,
              detail: todo.detail || null,
              person_id: todo.personId || null,
              status: 'pending',
              sort_order: idx,
            })),
          )
        }
      }

      await loadMeeting()
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusToggle() {
    if (!meeting) return
    const newStatus = meeting.status === 'draft' ? 'published' : 'draft'
    const { error: updateError } = await supabase
      .from('meetings')
      .update({ status: newStatus })
      .eq('id', meeting.id)

    if (updateError) {
      console.error(updateError)
      alert('상태 변경에 실패했습니다.')
      return
    }
    await loadMeeting()
  }

  async function handleDelete() {
    if (!meetingId) return
    if (!confirm('이 회의를 삭제하시겠습니까?')) return

    setDeleting(true)
    try {
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (deleteError) {
        console.error(deleteError)
        alert('삭제에 실패했습니다.')
        return
      }
      navigate('/timeline')
    } catch (err) {
      console.error(err)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleTodoStatusChange(todoId: string, newStatus: TodoStatus) {
    const { error: updateError } = await supabase
      .from('todos')
      .update({ status: newStatus })
      .eq('id', todoId)

    if (updateError) {
      console.error(updateError)
      alert('상태 변경에 실패했습니다.')
      return
    }
    await loadMeeting()
  }

  function cycleTodoStatus(current: TodoStatus): TodoStatus {
    const idx = STATUS_CYCLE.indexOf(current)
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
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
      await loadMeeting()
    } catch (err) {
      console.error(err)
      alert('메모 저장에 실패했습니다.')
    } finally {
      setMemoSaving((prev) => ({ ...prev, [todoId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="text-sm text-gray-400">로딩 중...</div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="text-sm text-red-500">{error || '회의를 찾을 수 없습니다.'}</div>
      </div>
    )
  }

  const attendees =
    meeting.meeting_attendees
      ?.map((a) => a.people?.name)
      .filter((n): n is string => !!n) ?? []

  const sortedAgendas = [...(meeting.meeting_agendas ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  const sortedTodos = [...(meeting.todos ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  const meetingType = meeting.projects
    ? meeting.projects.is_regular
      ? '정기회의'
      : '프로젝트 미팅'
    : '개별이슈'

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
              <button type="button" onClick={handleStatusToggle}>
                <Badge variant={meeting.status === 'published' ? 'primary' : 'gray'}>
                  {meeting.status === 'published' ? '배포' : '미배포'}
                </Badge>
              </button>
              <Button variant="secondary" size="sm" onClick={startEditing}>
                ✏ 편집
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '🗑 삭제'}
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                취소
              </Button>
            </>
          )}
        </div>
      </div>

      {(meeting.notice || isEditing) && (
        <div className="mb-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-warning">
          {isEditing ? (
            <textarea
              value={editNotice}
              onChange={(e) => setEditNotice(e.target.value)}
              rows={2}
              placeholder="공지사항"
              className="w-full rounded border border-yellow-300 bg-white px-2 py-1 text-sm focus:outline-none"
            />
          ) : (
            <>📢 공지사항: {meeting.notice}</>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-xl font-semibold focus:border-primary focus:outline-none"
          />
        </div>
      ) : (
        <h1 className="mb-3 text-xl font-semibold text-gray-900">{meeting.title}</h1>
      )}

      <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-500">
        <span>📅 {formatDateLabel(meeting.meeting_date)}</span>
        {meeting.projects && <span>📁 {meeting.projects.name}</span>}
        <span>
          🏢 {meeting.projects?.business_units?.name ?? '—'} ·{' '}
          {meeting.projects?.categories?.name ?? meetingType}
        </span>
        {attendees.length > 0 && <span>👥 {attendees.join(', ')}</span>}
      </div>

      <section className="mb-6">
        <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
          핵심 요약
        </h2>
        {isEditing ? (
          <div className="space-y-3">
            {editAgendas.map((agenda, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 bg-white p-4">
                <input
                  type="text"
                  value={agenda.subject}
                  onChange={(e) => {
                    const next = [...editAgendas]
                    next[idx] = { ...next[idx], subject: e.target.value }
                    setEditAgendas(next)
                  }}
                  className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm font-medium focus:border-primary focus:outline-none"
                />
                <textarea
                  rows={3}
                  value={agenda.content}
                  onChange={(e) => {
                    const next = [...editAgendas]
                    next[idx] = { ...next[idx], content: e.target.value }
                    setEditAgendas(next)
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
        ) : sortedAgendas.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 안건이 없습니다.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-1/4 px-4 py-2 text-left font-medium text-gray-600">주제</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">내용</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgendas.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 align-top font-medium text-gray-800">{row.subject}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.content ? (
                        <ul className="list-disc pl-4">
                          {row.content.split('\n').filter(Boolean).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
          실행 항목
        </h2>
        {sortedTodos.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 실행 항목이 없습니다.</p>
        ) : (
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
                {sortedTodos.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2 text-gray-700">{item.people?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-800">{item.title}</td>
                    <td className="px-3 py-2 text-gray-600">{item.detail ?? '—'}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleTodoStatusChange(item.id, cycleTodoStatus(item.status))}
                      >
                        <Badge variant={STATUS_VARIANTS[item.status]}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
          진행사항 피드
        </h2>
        {sortedTodos.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 Todo가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {sortedTodos.map((feed) => {
              const memos = [...(feed.todo_memos ?? [])].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
              )

              return (
                <div key={feed.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {STATUS_DOTS[feed.status]} {feed.title} — {feed.people?.name ?? '미지정'}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleTodoStatusChange(feed.id, cycleTodoStatus(feed.status))
                      }
                    >
                      <Badge variant={STATUS_VARIANTS[feed.status]}>
                        {STATUS_LABELS[feed.status]}
                      </Badge>
                    </button>
                  </div>
                  <div className="mb-3 space-y-2">
                    {memos.map((entry) => (
                      <div key={entry.id} className="text-xs">
                        <span className="text-gray-400">{formatMemoDate(entry.created_at)}</span>
                        <span className="ml-2 text-gray-700">{entry.content}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="진행사항 입력..."
                      value={memoInputs[feed.id] ?? ''}
                      onChange={(e) =>
                        setMemoInputs((prev) => ({ ...prev, [feed.id]: e.target.value }))
                      }
                      className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddMemo(feed.id)}
                      disabled={memoSaving[feed.id]}
                    >
                      {memoSaving[feed.id] ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
