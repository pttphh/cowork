import { useEffect, useState } from 'react'
import Button from './Button'
import PersonTagInput from './PersonTagInput'
import { supabase } from '../../lib/supabase'
import { BusinessUnit, Category, Person } from '../../types'

interface CreateMeetingTypeModalProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  bizUnits: BusinessUnit[]
  defaultBizUnitId: string
  onSuccess: (projectId: string, attendees: Person[]) => void
}

function findBzRegularCategory(categories: Category[]) {
  return (
    categories.find((c) => c.name === 'Bz 정기회의') ??
    categories.find((c) => c.name.includes('정기회의'))
  )
}

export default function CreateMeetingTypeModal({
  open,
  onClose,
  categories,
  bizUnits,
  defaultBizUnitId,
  onSuccess,
}: CreateMeetingTypeModalProps) {
  const [name, setName] = useState('')
  const [bizUnitId, setBizUnitId] = useState(defaultBizUnitId)
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([])
  const [submitting, setSubmitting] = useState(false)

  const bzRegularCategory = findBzRegularCategory(categories)

  useEffect(() => {
    if (open) {
      setName('')
      setBizUnitId(defaultBizUnitId)
      setSelectedPeople([])
    }
  }, [open, defaultBizUnitId])

  if (!open) return null

  async function handleSubmit() {
    if (!name.trim()) {
      alert('회의명을 입력해주세요.')
      return
    }
    if (!bizUnitId) {
      alert('사업 부문을 선택해주세요.')
      return
    }
    if (!bzRegularCategory) {
      alert('Bz 정기회의 카테고리를 찾을 수 없습니다.')
      return
    }

    setSubmitting(true)
    try {
      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          is_regular: true,
          category_id: bzRegularCategory.id,
          business_unit_id: bizUnitId,
          status: 'active',
          page_type: 'default',
        })
        .select()
        .single()

      if (insertError || !project) {
        console.error(insertError)
        alert('정기회의 등록에 실패했습니다.')
        return
      }

      if (selectedPeople.length > 0) {
        const { error: attendeeError } = await supabase.from('project_attendees').insert(
          selectedPeople.map((person) => ({
            project_id: project.id,
            person_id: person.id,
          })),
        )
        if (attendeeError) console.error(attendeeError)
      }

      onSuccess(project.id, selectedPeople)
      onClose()
    } catch (err) {
      console.error(err)
      alert('정기회의 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">신규 정기회의 등록</h2>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">
            회의명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="회의명을 입력하세요"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">카테고리</label>
          <input
            type="text"
            value={bzRegularCategory?.name ?? 'Bz 정기회의'}
            disabled
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">사업 부문</label>
          <select
            value={bizUnitId}
            onChange={(e) => setBizUnitId(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">선택</option>
            {bizUnits.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-xs text-gray-500">디폴트 참여자</label>
          <PersonTagInput value={selectedPeople} onChange={setSelectedPeople} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '등록 중...' : '등록'}
          </Button>
        </div>
      </div>
    </div>
  )
}
