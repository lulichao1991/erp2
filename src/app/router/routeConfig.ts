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
  { label: '款式管理', path: '/products', icon: '◇' },
  { label: '生产计划', path: '/production-plan', icon: '◍' }
]
