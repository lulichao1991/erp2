import type { NavItem } from '@/types/common'

export const sidebarItems: NavItem[] = [
  { label: '工作台', path: '/', icon: '◌' },
  { label: '订单中心', path: '/orders', icon: '▣' },
  { label: '产品管理', path: '/products', icon: '◇' }
]

export const getModuleLabel = (pathname: string) => {
  if (pathname.startsWith('/orders')) {
    return '订单中心'
  }

  if (pathname.startsWith('/products')) {
    return '产品管理'
  }

  return '工作台'
}
