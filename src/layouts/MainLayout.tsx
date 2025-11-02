import React, { JSX, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'

import { PageTransition, LanguageDropdown, MainDropdown } from '@/components'
import { Skeleton } from '@/components/ui/skeleton'

// Responsive MainLayout
// - Desktop: 3-column header (logo / centered nav / actions)
// - Mobile: compact header with hamburger -> full-screen drawer menu
// - Accessible: escape to close, aria attributes, body scroll lock when drawer open

export default function MainLayout(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: authUser, logout, googleInfo, getUserInfo } = useAuthStore()

  const [language, setLanguage] = useState<string>('en')
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['currentUser', authUser?.id],
    queryFn: getUserInfo,
    enabled: !!authUser
  })

  const displayName = googleInfo?.name || userDetails?.username || authUser?.email || 'User'
  const email = googleInfo?.email || userDetails?.email || ''
  const avatar = googleInfo?.picture || userDetails?.avatar || null

  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Courses', path: '/courses' },
    { title: 'Contact', path: '/contact' },
    { title: 'Mind map Storage', path: '/mindmap-store' }
  ]

  const languageOptions = [
    { id: 'en', name: 'English', flag: 'english' },
    { id: 'vi', name: 'Tiếng Việt', flag: 'vietnam' }
  ]

  const userMenuOptions = [
    { label: 'Profile', value: 'profile', icon: 'lucide:user' },
    { label: 'Dashboard', value: 'dashboard', icon: 'lucide:layout-dashboard' },
    { label: 'Logout', value: 'logout', icon: 'lucide:log-out' }
  ]

  const handleUserMenuSelect = (value: string) => {
    switch (value) {
      case 'profile':
        window.location.href = '/profile'
        break
      case 'dashboard':
        window.location.href = '/dashboard'
        break
      case 'logout':
        logout()
        navigate('/', { replace: true })
        break
      default:
        break
    }
  }

  useEffect(() => {
    // lock body scroll when mobile menu open
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // helper to generate initials
  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const MainNav = (): JSX.Element => {
    return (
      <header className="w-full py-5 px-4 sm:px-24 border-b-[.2rem] border-border flex items-center relative z-[998] bg-white">
        {/* left: logo */}
        <div className="flex items-center gap-4 w-1/3 sm:w-1/3">
          <Link to="/" className="flex items-center gap-3">
            <h1 className="text-[1.8rem] sm:text-[3rem] font-bold">Learnify.</h1>
          </Link>
        </div>

        {/* center nav - hidden on small screens */}
        <div className="hidden sm:flex items-center justify-center w-1/3">
          <nav className="flex items-center gap-9">
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) => cn('relative group', isActive && 'text-primary')}
              >
                <span className="text-[1.1rem] sm:text-[1.5rem]">{item.title}</span>
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[.15rem] bg-primary group-hover:scale-x-100 transition-transform duration-250 origin-center ${location.pathname === item.path ? 'scale-x-100' : 'scale-x-0'}`}
                />
              </NavLink>
            ))}
          </nav>
        </div>

        {/* right: actions or hamburger on mobile */}
        <div className="flex items-center justify-end gap-2.5 w-2/3 sm:w-1/3">
          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <LanguageDropdown options={languageOptions} value={language} onChange={setLanguage} />

            <div className="flex items-center gap-9">
              {authUser ? (
                <div className="flex items-center">
                  {isLoading ? (
                    <div className="flex-shrink-0 relative cursor-pointer">
                      <Skeleton className="w-[3rem] h-[3rem] rounded-full shadow-md" />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <MainDropdown
                        value="profile"
                        options={userMenuOptions}
                        onChange={handleUserMenuSelect}
                        minWidth="180px"
                        className="ml-auto"
                        align="right"
                        showChecks={false}
                        userInfo={{ username: displayName, email: email }}
                      >
                        {() => (
                          <div className="relative cursor-pointer">
                            <div className="w-[3rem] h-[3rem] rounded-full bg-primary text-white flex items-center justify-center text-[1.2rem] font-medium shadow-md overflow-hidden">
                              {avatar ? (
                                <>
                                  {isLoading && <Skeleton className="absolute inset-0 rounded-full" />}
                                  <img src={avatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
                                </>
                              ) : (
                                <span>{getInitials(displayName)}</span>
                              )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          </div>
                        )}
                      </MainDropdown>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/auth/login" className="text-black text-[1.05rem] relative group">
                    <span>Log in</span>
                    <span className="absolute left-0 right-0 bottom-0 h-[.15rem] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-250 origin-center" />
                  </Link>
                  <Link to="/auth/signup" className="rounded-full bg-primary text-white px-6 py-2 text-[1.05rem] border border-primary font-medium">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="sm:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setMobileOpen(prev => !prev)}
          >
            {/* simple hamburger icon */}
            <div className="w-[22px] h-[18px] relative">
              <span
                className={cn(
                  'block absolute left-0 right-0 h-[2px] transition-transform duration-200 bg-black',
                  mobileOpen ? 'top-1/2 rotate-45' : 'top-0'
                )}
              />
              <span
                className={cn(
                  'block absolute left-0 right-0 h-[2px] transition-opacity duration-200 bg-black',
                  mobileOpen ? 'opacity-0' : 'top-1/2'
                )}
              />
              <span
                className={cn(
                  'block absolute left-0 right-0 h-[2px] transition-transform duration-200 bg-black',
                  mobileOpen ? 'bottom-1/2 -rotate-45' : 'bottom-0'
                )}
              />
            </div>
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[999] flex"
            onClick={() => setMobileOpen(false)}
          >
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* panel */}
            <aside
              className="relative z-50 w-11/12 max-w-xs bg-white h-full shadow-xl p-6 overflow-auto transform transition-transform duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <Link to="/" onClick={() => setMobileOpen(false)}>
                  <h2 className="text-[1.5rem] font-bold">Learnify.</h2>
                </Link>
                <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-2">
                  ✕
                </button>
              </div>

              <nav className="flex flex-col gap-4">
                {navItems.map((item, idx) => (
                  <NavLink
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => cn('py-3 text-[1.15rem] rounded-md', isActive ? 'text-primary font-semibold' : 'text-black')}
                  >
                    {item.title}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-6 border-t pt-4">
                <LanguageDropdown options={languageOptions} value={language} onChange={setLanguage} />

                <div className="mt-4">
                  {authUser ? (
                    <div className="flex items-center gap-3">
                      <div className="w-[3rem] h-[3rem] rounded-full bg-primary text-white flex items-center justify-center overflow-hidden">
                        {avatar ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" /> : <span>{getInitials(displayName)}</span>}
                      </div>
                      <div>
                        <div className="font-medium">{displayName}</div>
                        <div className="text-sm text-muted-foreground">{email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="py-2 px-3 rounded-md">Log in</Link>
                      <Link to="/auth/signup" onClick={() => setMobileOpen(false)} className="py-2 px-3 rounded-md bg-primary text-white">Sign Up</Link>
                    </div>
                  )}
                </div>

                {/* user menu options (mobile) */}
                {authUser && (
                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => { handleUserMenuSelect('profile'); setMobileOpen(false) }} className="text-left py-2">Profile</button>
                    <button onClick={() => { handleUserMenuSelect('dashboard'); setMobileOpen(false) }} className="text-left py-2">Dashboard</button>
                    <button onClick={() => { handleUserMenuSelect('logout'); setMobileOpen(false) }} className="text-left py-2 text-red-600">Logout</button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </header>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <MainNav />
      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}
