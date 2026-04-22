import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/app/layout/AppSidebar'
import { AppTopbar } from '@/app/layout/AppTopbar'

export const AppLayout = () => (
  <div className="app-shell">
    <AppSidebar />
    <main className="app-main">
      <AppTopbar />
      <Outlet />
    </main>
  </div>
)
