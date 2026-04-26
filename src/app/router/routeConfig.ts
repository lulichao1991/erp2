import type { NavItem } from '@/types/common'

export const sidebarItems: NavItem[] = [
  { label: '工作台', path: '/', icon: '◌' },
  { label: '商品行中心', path: '/order-lines', icon: '▤' },
  { label: '客户中心', path: '/customers', icon: '◉' },
  { label: '任务中心', path: '/tasks', icon: '◎' },
  { label: '生产跟进', path: '/production-follow-up', icon: '◒' },
  { label: '产品管理', path: '/products', icon: '◇' },
  { label: '生产计划', path: '/production-plan', icon: '◍', visibleRoles: ['factory'] }
]

export const getModuleLabel = (pathname: string) => {
  if (pathname.startsWith('/order-lines')) {
    return '商品行中心'
  }

  if (pathname.startsWith('/purchases')) {
    return '购买记录'
  }

  if (pathname.startsWith('/customers')) {
    return '客户中心'
  }

  if (pathname.startsWith('/tasks')) {
    return '任务中心'
  }

  if (pathname.startsWith('/production-follow-up')) {
    return '生产跟进'
  }

  if (pathname.startsWith('/production-plan')) {
    return '生产计划'
  }

  if (pathname.startsWith('/products')) {
    return '产品管理'
  }

  return '工作台'
}
