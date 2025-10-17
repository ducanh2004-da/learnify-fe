import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <section className="w-full min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/35 via-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-200/35 via-transparent to-transparent" />
        <Outlet />
      </section>
    </div>
  )
}