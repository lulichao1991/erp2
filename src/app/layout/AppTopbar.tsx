import { useLocation } from 'react-router-dom'
import { getModuleLabel } from '@/app/router/routeConfig'

export const AppTopbar = () => {
  const location = useLocation()
  const moduleLabel = getModuleLabel(location.pathname)

  return (
    <header className="app-topbar">
      <div className="topbar-module">{moduleLabel}</div>
      <div className="topbar-actions">
        <span className="topbar-pill">通知占位</span>
        <span className="topbar-pill">用户区占位</span>
      </div>
    </header>
  )
}
