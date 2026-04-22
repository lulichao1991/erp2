import { NavLink } from 'react-router-dom'
import { sidebarItems } from '@/app/router/routeConfig'

export const AppSidebar = () => (
  <aside className="app-sidebar">
    <div className="sidebar-brand">
      <h1 className="sidebar-brand-title">定制电商协同 ERP</h1>
      <p className="sidebar-brand-caption">订单中心与产品管理首轮演示版</p>
    </div>
    <nav className="sidebar-nav">
      {sidebarItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
)
