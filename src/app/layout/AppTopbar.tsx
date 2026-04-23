import { useLocation } from 'react-router-dom'
import { useAppData } from '@/hooks/useAppData'
import { getModuleLabel } from '@/app/router/routeConfig'
import { getTaskAssigneeRoleLabel } from '@/services/workflow/workflowMeta'
import type { TaskAssigneeRole } from '@/types/task'

const roleOptions: TaskAssigneeRole[] = ['customer_service', 'designer', 'operations', 'factory', 'management']

export const AppTopbar = () => {
  const location = useLocation()
  const moduleLabel = getModuleLabel(location.pathname)
  const appData = useAppData()

  return (
    <header className="app-topbar">
      <div className="topbar-module">{moduleLabel}</div>
      <div className="topbar-actions">
        <label className="topbar-role-switcher">
          <span className="topbar-role-switcher-label">角色模式</span>
          <select
            className="topbar-select"
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
        <span className="topbar-pill">通知占位</span>
        <span className="topbar-pill">用户区占位</span>
      </div>
    </header>
  )
}
