import { Outlet } from 'react-router-dom'

export default function DashboardLayout() {
  return (
    <main className="w-full h-screen relative overflow-hidden">
      <Outlet />
    </main>
  )
}
