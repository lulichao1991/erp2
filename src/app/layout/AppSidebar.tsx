import { NavLink } from 'react-router-dom'
import { sidebarItems } from '@/app/router/routeConfig'
import { useAppData } from '@/hooks/useAppData'
import { canViewRoute, roleOptions } from '@/services/access/roleCapabilities'
import { getTaskAssigneeRoleLabel } from '@/services/workflow/workflowMeta'
import type { TaskAssigneeRole } from '@/types/task'

const getSidebarShortLabel = (label: string) => {
  if (label === '商品行中心') {
    return '商品行'
  }

  if (label === '任务中心') {
    return '任务'
  }

  if (label === '客户中心') {
    return '客户'
  }

  if (label === '生产计划') {
    return '生产'
  }

  if (label === '生产跟进') {
    return '跟进'
  }

  if (label === '设计建模') {
    return '设计'
  }

  if (label === '工厂协同') {
    return '工厂'
  }

  if (label === '财务中心') {
    return '财务'
  }

  if (label === '仓库商品') {
    return '仓库'
  }

  if (label === '管理看板') {
    return '管理'
  }

  if (label === '产品管理') {
    return '产品'
  }

  if (label === '工作台') {
    return '工作'
  }

  return label
}

export const AppSidebar = () => {
  const appData = useAppData()
  const visibleSidebarItems = sidebarItems.filter((item) => canViewRoute(appData.currentUserRole, item.path))

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark" aria-hidden="true">
          ◈
        </div>
      </div>
      <nav className="sidebar-nav">
        {visibleSidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-nav-icon" aria-hidden="true" />
            <span>{getSidebarShortLabel(item.label)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <label className="sidebar-role-switcher">
          <span className="sidebar-role-switcher-label">角色</span>
          <select
            className="sidebar-role-select"
            aria-label="角色模式"
            value={appData.currentUserRole}
            onChange={(event) => appData.setCurrentUserRole(event.target.value as TaskAssigneeRole)}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {getTaskAssigneeRoleLabel(role)}
              </option>
            ))}
          </select>
        </label>
        <div className="sidebar-footer-actions">
          <button type="button" className="sidebar-icon-button" aria-label="通知占位" title="通知占位">
            ◔
          </button>
          <button type="button" className="sidebar-icon-button" aria-label="用户区占位" title="用户区占位">
            ◎
          </button>
        </div>
      </div>
    </aside>
  )
}
