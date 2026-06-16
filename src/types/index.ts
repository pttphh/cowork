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
}
