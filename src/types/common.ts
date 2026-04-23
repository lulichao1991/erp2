import type { TaskAssigneeRole } from '@/types/task'

export type NavItem = {
  label: string
  path: string
  icon: string
  visibleRoles?: TaskAssigneeRole[]
}

export type CompareResultStatus = 'matched' | 'adjusted' | 'conflict'
