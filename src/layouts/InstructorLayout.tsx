import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { JSX, useState } from 'react'
import { cn } from '@/lib'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'

import { PageTransition, LanguageDropdown, MainDropdown } from '@/components'
import { Skeleton } from '@/components/ui/skeleton'

export default function InstructorLayout(): JSX.Element{
    const location = useLocation()
  const navigate = useNavigate()
  const { user: authUser, logout, googleInfo, getUserInfo } = useAuthStore()
  
  const [language, setLanguage] = useState<string>('en')

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['currentUser', authUser?.id],
    queryFn: getUserInfo,
    enabled: !!authUser
  })

  const displayName = googleInfo?.name || userDetails?.username || authUser?.email || 'User'
  const email = googleInfo?.email || userDetails?.email || ''
  const avatar = googleInfo?.picture || userDetails?.avatar || null

  const navItems = [
    {
      title: 'Home',
      path: '/instructor'
    },
    {
      title: 'Create Course',
      path: '/instructor/create-course'
    }, 
    {
      title: 'Manage Course',
      path: '/instructor/courses'
    }
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

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const MainNav = (): JSX.Element => {
    return (
      <header className="w-full py-5 px-24 border-b-[.2rem] border-border flex items-center relative z-[998]">
        <div className="w-1/3">
          <Link to="/">
            <h1 className="text-[3rem] font-bold">Learnify.</h1>
          </Link>
        </div>
        <div className="w-1/3">
          <nav className="flex items-center justify-center gap-9">
            {navItems.map((item, index) => {
              return (
                <NavLink 
                  key={index} 
                  to={item.path} 
                  className={({ isActive }) => cn(
                    'relative group',
                    isActive && 'text-primary'
                  )}
                >
                  <span className="text-[1.5rem]">{item.title}</span>
                  <span 
                    className={`
                      absolute left-0 right-0 bottom-0 h-[.15rem] bg-primary group-hover:scale-x-100 transition-transform duration-250 origin-center
                      ${location.pathname === item.path ? 'scale-x-100' : 'scale-x-0'}
                    `} 
                  />
                </NavLink>
              )
            })}
          </nav>
        </div>
        <div className="w-1/3 flex items-center justify-end gap-2.5">
          <LanguageDropdown 
            options={languageOptions}
            value={language}
            onChange={setLanguage}
          />
          <div className="flex items-center gap-9">
            {authUser ? (
              <div className="flex items-center">
                {isLoading ? (
                  <div className="flex-shrink-0 relative cursor-pointer">
                    <Skeleton className="size-[3rem] rounded-full shadow-md" />
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
                      userInfo={{
                        username: displayName,
                        email: email
                      }}
                    >
                      {() => (
                        <div className="flex-shrink-0 relative cursor-pointer">
                          <div className="size-[3rem] rounded-full bg-primary text-white flex items-center justify-center text-[1.2rem] font-medium shadow-md overflow-hidden">
                            {avatar ? (
                              <>
                                {isLoading && (
                                  <Skeleton className="absolute inset-0 rounded-full" />
                                )}
                                <img 
                                  src={avatar} 
                                  alt={displayName} 
                                  className="size-full rounded-full object-cover"
                                />
                              </>
                            ) : (
                              <span>
                                {getInitials(displayName)}
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                      )}
                    </MainDropdown>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="text-black text-[1.45rem] relative group">
                  <span>Log in</span>
                  <span className="absolute left-0 right-0 bottom-0 h-[.15rem] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-250 origin-center" />
                </Link>
                <Link to="/auth/signup" className="rounded-full bg-primary text-white px-8.5 py-3.5 text-[1.45rem] border border-primary font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <MainNav />
      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}