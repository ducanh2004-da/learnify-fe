import { lazy, Suspense } from 'react';
import { createBrowserRouter, redirect, Navigate } from 'react-router-dom';

import { AuthLayout, MainLayout, ClassRoomLayout, DashboardLayout, InstructorLayout } from '@/layouts';
import { ErrorBoundary } from '@/components';
// import { getCookie, isTokenValid, deleteCookie } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { InstructorRoute } from './RoleGuard';


const Pages = {
  Main: {
    Home: lazy(() => import('@/pages/public/Home')),
    About: lazy(() => import('@/pages/public/About')),
    Courses: lazy(() => import('@/pages/public/Courses')),
    CourseDetails: lazy(() => import('@/pages/public/CourseDetails')),
    Contact: lazy(() => import('@/pages/public/Contact')),
    User: lazy(() => import('@/pages/public/Chat'))
  },
  Auth: {
    Login: lazy(() => import('@/pages/public/auth/Login')),
    Register: lazy(() => import('@/pages/public/auth/Register'))
  },
  Dashboard: {
    ClassRoom: lazy(() => import('@/pages/dashboard/ClassRoom'))
  },
  Instructor: {
    Home: lazy(() => import('@/pages/public/instructor/Home')),
    CreateCourse: lazy(() => import('@/pages/public/instructor/CreateCourse')),
    CourseManagement: lazy(() => import('@/pages/public/instructor/CourseManagement')),
  },
  Profile: {
    ProfilePage: lazy(() => import('@/pages/public/profile/Profile'))
  }
};

// Protected Route Component
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isLoading = useAuthStore(state => state.isLoading)

  // show nothing while auth state initializing (so initAuth can check cookie)
  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

//Hiển thị loading UI trong lúc tải component
const withSuspense = (Element: any) => (
  <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>{Element}</Suspense>
)

// Auth Route Component (redirect nếu đã đăng nhập)
export const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isLoading = useAuthStore(state => state.isLoading)

  if (isLoading) return null

  if (isAuthenticated) {
    // redirect by role if you want more precise routing:
    const role = useAuthStore.getState().userDetails?.role?.toString().toUpperCase()
    if (role === 'INSTRUCTOR') return <Navigate to="/instructor" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(<Pages.Main.Home />) },
      { path: 'about', element: withSuspense(<Pages.Main.About />) },
      { path: 'courses', element: withSuspense(<Pages.Main.Courses />) },
      { path: 'courses/:courseId', element: withSuspense(<Pages.Main.CourseDetails />) },
      { path: 'contact', element: withSuspense(<Pages.Main.Contact />) },
      { path: 'user', element: withSuspense(<Pages.Main.User />) },
    ],
    errorElement: <ErrorBoundary />
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: withSuspense(<AuthRoute><Pages.Auth.Login /></AuthRoute>) },
      { path: 'signup', element: withSuspense(<AuthRoute><Pages.Auth.Register /></AuthRoute>) }
    ],
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/classroom',
    element: <ProtectedRoute><ClassRoomLayout /></ProtectedRoute>,
    children: [
      { index: true, element: withSuspense(<Pages.Dashboard.ClassRoom />) },
      { path: ':courseId/lessons/:lessonId', element: withSuspense(<Pages.Dashboard.ClassRoom />) }
    ]
  },
  {
    path: '/instructor',
    // <-- dùng InstructorRoute để kiểm tra cả auth + role INSTRUCTOR -->
    element: <InstructorRoute><InstructorLayout /></InstructorRoute>,
    children: [
      { index: true, element: withSuspense(<Pages.Instructor.Home />) },
      { path: 'create-course', element: withSuspense(<Pages.Instructor.CreateCourse />) },
      { path: 'courses', element: withSuspense(<Pages.Instructor.CourseManagement />) },
    ],
    errorElement: <ErrorBoundary />
  },
  {
    path: '/profile',
    element: withSuspense(<Pages.Profile.ProfilePage />),
    errorElement: <ErrorBoundary />
  }
]);