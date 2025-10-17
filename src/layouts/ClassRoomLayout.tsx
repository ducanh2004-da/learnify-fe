import { Outlet } from 'react-router-dom'
import { useState } from 'react';

export default function ClassRoomLayout() {
  const [showLeft, setShowLeft] = useState<boolean>(true); // toggle left panel on mobile
  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-5 py-1">
      {/* Header */}
      <header className="w-full border-b bg-white/60 backdrop-blur-sm">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              aria-label="toggle-courses"
              onClick={() => setShowLeft(v => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {/* hamburger */}
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-slate-700">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white flex items-center justify-center font-bold shadow">
                AI
              </div>
              <div>
                <div className="text-2xl font-semibold">ReactJS Course</div>
                <div className="text-sm text-slate-500">Learning and Interacting with A.I Tutor</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl text-slate-600 hidden sm:block">Hello, Learner</div>
            <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center text-sm shadow">GV</div>
          </div>
        </div>
      </header>
      <section className="col-span-12 md:col-span-6 lg:col-span-7">
        <Outlet />
      </section>
    </main>
  )
}
