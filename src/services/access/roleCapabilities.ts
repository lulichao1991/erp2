import type { TaskAssigneeRole } from '@/types/task'

export type RoleField =
  | 'customer_profile'
  | 'customer_contact'
  | 'purchase_finance'
  | 'order_line_requirements'
  | 'production_files'
  | 'factory_return'
  | 'finance_cost'
  | 'management_metrics'

export type RoleAction =
  | 'purchase_edit'
  | 'order_line_customer_confirm'
  | 'production_dispatch'
  | 'design_modeling_update'
  | 'factory_return_submit'
  | 'finance_confirm'
  | 'management_view'

export type RoleCapability = {
  label: string
  visibleRoutes: string[]
  visibleFields: RoleField[]
  editableFields: RoleField[]
  allowedActions: RoleAction[]
}

const allRoutes = [
  '/',
  '/order-lines',
  '/customers',
  '/tasks',
  '/production-follow-up',
  '/design-modeling',
  '/factory',
  '/finance',
  '/management',
  '/products',
  '/production-plan'
]

const allFields: RoleField[] = [
  'customer_profile',
  'customer_contact',
  'purchase_finance',
  'order_line_requirements',
  'production_files',
  'factory_return',
  'finance_cost',
  'management_metrics'
]

const allActions: RoleAction[] = [
  'purchase_edit',
  'order_line_customer_confirm',
  'production_dispatch',
  'design_modeling_update',
  'factory_return_submit',
  'finance_confirm',
  'management_view'
]

export const roleOptions: TaskAssigneeRole[] = ['customer_service', 'merchandiser', 'designer', 'modeler', 'factory', 'finance', 'manager', 'admin']

export const roleCapabilities: Record<TaskAssigneeRole, RoleCapability> = {
  customer_service: {
    label: '客服',
    visibleRoutes: ['/', '/order-lines', '/customers', '/tasks', '/products'],
    visibleFields: ['customer_profile', 'customer_contact', 'order_line_requirements', 'production_files'],
    editableFields: ['customer_profile', 'customer_contact', 'order_line_requirements'],
    allowedActions: ['purchase_edit', 'order_line_customer_confirm']
  },
  merchandiser: {
    label: '跟单',
    visibleRoutes: ['/', '/order-lines', '/tasks', '/production-follow-up', '/production-plan', '/products'],
    visibleFields: ['customer_profile', 'order_line_requirements', 'production_files', 'factory_return'],
    editableFields: ['order_line_requirements', 'production_files'],
    allowedActions: ['production_dispatch']
  },
  designer: {
    label: '设计',
    visibleRoutes: ['/', '/order-lines', '/tasks', '/design-modeling', '/products'],
    visibleFields: ['order_line_requirements', 'production_files'],
    editableFields: ['production_files'],
    allowedActions: ['design_modeling_update']
  },
  modeler: {
    label: '建模',
    visibleRoutes: ['/', '/order-lines', '/tasks', '/design-modeling', '/products'],
    visibleFields: ['order_line_requirements', 'production_files'],
    editableFields: ['production_files'],
    allowedActions: ['design_modeling_update']
  },
  factory: {
    label: '工厂',
    visibleRoutes: ['/', '/factory', '/production-plan'],
    visibleFields: ['order_line_requirements', 'production_files', 'factory_return'],
    editableFields: ['factory_return'],
    allowedActions: ['factory_return_submit']
  },
  finance: {
    label: '财务',
    visibleRoutes: ['/', '/finance', '/order-lines'],
    visibleFields: ['customer_profile', 'purchase_finance', 'order_line_requirements', 'factory_return', 'finance_cost'],
    editableFields: ['purchase_finance', 'finance_cost'],
    allowedActions: ['finance_confirm']
  },
  manager: {
    label: '管理',
    visibleRoutes: allRoutes,
    visibleFields: allFields,
    editableFields: [],
    allowedActions: ['management_view']
  },
  admin: {
    label: '管理员',
    visibleRoutes: allRoutes,
    visibleFields: allFields,
    editableFields: allFields,
    allowedActions: allActions
  }
}

export const isKnownRole = (role?: string): role is TaskAssigneeRole => Boolean(role && role in roleCapabilities)

export const normalizeRole = (role?: string): TaskAssigneeRole => {
  if (isKnownRole(role)) {
    return role
  }

  if (role === 'operations') {
    return 'merchandiser'
  }

  if (role === 'management') {
    return 'manager'
  }

  return 'admin'
}

export const canViewRoute = (role: TaskAssigneeRole, routePath: string) => {
  const visibleRoutes = roleCapabilities[role].visibleRoutes
  return visibleRoutes.some((item) => item === routePath || (item !== '/' && routePath.startsWith(`${item}/`)))
}

export const canViewField = (role: TaskAssigneeRole, field: RoleField) => roleCapabilities[role].visibleFields.includes(field)

export const canEditField = (role: TaskAssigneeRole, field: RoleField) => roleCapabilities[role].editableFields.includes(field)

export const canPerformAction = (role: TaskAssigneeRole, action: RoleAction) => roleCapabilities[role].allowedActions.includes(action)
