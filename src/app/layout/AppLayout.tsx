import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/app/layout/AppSidebar'

export const AppLayout = () => (
  <div className="app-shell">
    <AppSidebar />
    <main className="app-main">
      <Outlet />
    </main>
  </div>
)
