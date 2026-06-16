export type UserRole = 'ceo' | 'secretary' | 'sales_manager' | 'sales_staff'

export type MeetingStatus = 'draft' | 'published'
export type TodoStatus = 'pending' | 'in_progress' | 'done'
export type ProjectStatus = 'active' | 'done'
export type PageType = 'default' | 'sales' | 'golf'

export interface SidebarItem {
  id: string
  name: string
  type: 'regular' | 'project'
  pageType?: PageType
}

export interface SidebarGroup {
  id: string
  name: string
  items: SidebarItem[]
}

export interface Profile {
  id: string
  name: string
  role: UserRole
  created_at: string
  email?: string
}

export interface BusinessUnit {
  id: string
  name: string
  sort_order: number
}

export interface Category {
  id: string
  name: string
  sort_order: number
}

export interface DbProject {
  id: string
  name: string
  is_regular: boolean
  status: ProjectStatus
  page_type?: PageType | null
  business_unit_id?: string | null
  category_id?: string | null
  completed_at?: string | null
  business_units?: { name: string } | null
  categories?: { name: string } | null
  project_attendees?: { people: { name: string } | null }[]
}

export interface MeetingAgenda {
  id: string
  subject: string
  content: string | null
  sort_order: number
}

export interface MeetingTodo {
  id: string
  title: string
  detail: string | null
  status: TodoStatus
  sort_order: number
  people?: { name: string } | null
}

export interface Meeting {
  id: string
  title: string
  meeting_date: string
  status: MeetingStatus
  project_id?: string | null
  projects?: {
    name: string
    is_regular: boolean
    page_type?: PageType | null
  } | null
  meeting_agendas?: MeetingAgenda[]
  todos?: MeetingTodo[]
}

export interface TodoWithRelations {
  id: string
  title: string
  status: TodoStatus
  created_at: string
  person_id?: string | null
  people?: { id: string; name: string } | null
  meetings?: { id: string; title: string; meeting_date: string } | null
  todo_memos?: { id: string; content: string; created_at: string }[]
}

export interface BusinessUnitWithProjects extends BusinessUnit {
  projects?: { id: string; is_regular: boolean }[]
}
