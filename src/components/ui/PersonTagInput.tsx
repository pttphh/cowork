import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Person } from '../../types'

interface PersonTagInputProps {
  value: Person[]
  onChange: (people: Person[]) => void
}

export default function PersonTagInput({ value, onChange }: PersonTagInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchText, setSearchText] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Person[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const trimmed = searchText.trim()
    if (!trimmed) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('people')
        .select('*')
        .ilike('name', `%${trimmed}%`)
        .limit(5)
      setSearchResults(data ?? [])
    }, 200)

    return () => clearTimeout(timer)
  }, [searchText])

  const trimmedSearch = searchText.trim()
  const availableResults = searchResults.filter(
    (p) => !value.some((selected) => selected.id === p.id),
  )
  const exactMatchExists =
    trimmedSearch.length > 0 &&
    (searchResults.some((p) => p.name.toLowerCase() === trimmedSearch.toLowerCase()) ||
      value.some((p) => p.name.toLowerCase() === trimmedSearch.toLowerCase()))

  function addPerson(person: Person) {
    if (value.some((p) => p.id === person.id)) return
    onChange([...value, person])
    setSearchText('')
    setDropdownOpen(false)
  }

  function removePerson(personId: string) {
    onChange(value.filter((p) => p.id !== personId))
  }

  async function createAndAdd() {
    const name = searchText.trim()
    if (!name) return

    setCreating(true)
    try {
      const { data: newPerson, error } = await supabase
        .from('people')
        .insert({ name })
        .select()
        .single()

      if (error || !newPerson) {
        console.error(error)
        alert('담당자 등록에 실패했습니다.')
        return
      }

      addPerson(newPerson)
    } catch (err) {
      console.error(err)
      alert('담당자 등록에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const showDropdown = dropdownOpen && trimmedSearch.length > 0

  return (
    <div ref={containerRef} className="relative">
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((person) => (
            <span
              key={person.id}
              className="flex items-center gap-1 rounded-full bg-primary-light px-2 py-1 text-xs text-primary"
            >
              {person.name}
              <button
                type="button"
                onClick={() => removePerson(person.id)}
                className="text-primary/60 hover:text-primary"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value)
          setDropdownOpen(true)
        }}
        onFocus={() => setDropdownOpen(true)}
        placeholder="이름을 입력하세요"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      {showDropdown && (
        <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-md">
          {availableResults.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => addPerson(person)}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              {person.name}
            </button>
          ))}
          {trimmedSearch && !exactMatchExists && (
            <button
              type="button"
              onClick={createAndAdd}
              disabled={creating}
              className="block w-full border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-gray-50 disabled:opacity-50"
            >
              {creating ? '등록 중...' : `"${trimmedSearch}" 새로 등록`}
            </button>
          )}
          {availableResults.length === 0 && exactMatchExists && (
            <p className="px-3 py-2 text-xs text-gray-400">이미 선택된 담당자입니다.</p>
          )}
          {availableResults.length === 0 && !exactMatchExists && !trimmedSearch && (
            <p className="px-3 py-2 text-xs text-gray-400">검색 결과가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  )
}
