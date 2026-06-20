import { useEffect, useState } from 'react'
import Button from './Button'
import PersonTagInput from './PersonTagInput'
import { supabase } from '../../lib/supabase'
import { BusinessUnit, Category, Person } from '../../types'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  bizUnits: BusinessUnit[]
  defaultCategoryId: string
  defaultBizUnitId: string
  isPersonal: boolean
  onSuccess: (projectId: string, attendees: Person[]) => void
}

function isBzCategory(cat: Category) {
  return cat.type === 'bz' || cat.name.startsWith('Bz')
}

export default function CreateProjectModal({
  open,
  onClose,
  categories,
  bizUnits,
  defaultCategoryId,
  defaultBizUnitId,
  isPersonal,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [bizUnitId, setBizUnitId] = useState(defaultBizUnitId)
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([])
  const [submitting, setSubmitting] = useState(false)

  const availableCategories = isPersonal
    ? categories.filter((c) => c.type === 'personal' || c.name.startsWith('사적인'))
    : categories.filter(isBzCategory)

  useEffect(() => {
    if (open) {
      setName('')
      setCategoryId(defaultCategoryId)
      setBizUnitId(defaultBizUnitId)
      setSelectedPeople([])
    }
  }, [open, defaultCategoryId, defaultBizUnitId])

  if (!open) return null

  async function handleSubmit() {
    if (!name.trim()) {
      alert('프로젝트명을 입력해주세요.')
      return
    }
    if (!categoryId) {
      alert('카테고리를 선택해주세요.')
      return
    }
    if (!isPersonal && !bizUnitId) {
      alert('사업 부문을 선택해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          is_regular: false,
          category_id: categoryId,
          business_unit_id: isPersonal ? null : bizUnitId,
          status: 'active',
          page_type: 'default',
        })
        .select()
        .single()

      if (insertError || !project) {
        console.error(insertError)
        alert('프로젝트 등록에 실패했습니다.')
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
      alert('프로젝트 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">신규 프로젝트 등록</h2>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">
            프로젝트명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="프로젝트명을 입력하세요"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-500">카테고리</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">선택</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {!isPersonal && (
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
        )}

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
