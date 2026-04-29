import type { NavItem } from '@/types/common'

export const sidebarItems: NavItem[] = [
  { label: '工作台', path: '/', icon: '◌' },
  { label: '销售中心', path: '/order-lines', icon: '▤' },
  { label: '客户中心', path: '/customers', icon: '◉' },
  { label: '任务中心', path: '/tasks', icon: '◎' },
  { label: '生产跟进', path: '/production-follow-up', icon: '◒' },
  { label: '设计建模', path: '/design-modeling', icon: '◐' },
  { label: '工厂协同', path: '/factory', icon: '◑' },
  { label: '财务中心', path: '/finance', icon: '◓' },
  { label: '仓库商品', path: '/inventory', icon: '▦' },
  { label: '管理看板', path: '/management', icon: '◔' },
  { label: '产品管理', path: '/products', icon: '◇' },
  { label: '生产计划', path: '/production-plan', icon: '◍' }
]

export const getModuleLabel = (pathname: string) => {
  if (pathname.startsWith('/order-lines')) {
    return '销售中心'
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

  if (pathname.startsWith('/design-modeling')) {
    return '设计建模'
  }

  if (pathname.startsWith('/factory')) {
    return '工厂协同'
  }

  if (pathname.startsWith('/finance')) {
    return '财务中心'
  }

  if (pathname.startsWith('/inventory')) {
    return '仓库商品'
  }

  if (pathname.startsWith('/management')) {
    return '管理看板'
  }

  if (pathname.startsWith('/production-plan')) {
    return '生产计划'
  }

  if (pathname.startsWith('/products')) {
    return '产品管理'
  }

  return '工作台'
}
