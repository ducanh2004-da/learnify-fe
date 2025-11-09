import { lazy } from 'react';
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
    Contact: lazy(() => import('@/pages/public/Contact'))
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
      { index: true, element: <Pages.Main.Home /> },
      { path: 'about', element: <Pages.Main.About /> },
      { path: 'courses', element: <Pages.Main.Courses /> },
      { path: 'courses/:courseId', element: <Pages.Main.CourseDetails /> },
      { path: 'contact', element: <Pages.Main.Contact /> },
    ],
    errorElement: <ErrorBoundary />
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <AuthRoute><Pages.Auth.Login /></AuthRoute> },
      { path: 'signup', element: <AuthRoute><Pages.Auth.Register /></AuthRoute> }
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
      { index: true, element: <Pages.Dashboard.ClassRoom /> },
      { path: ':courseId/lessons/:lessonId', element: <Pages.Dashboard.ClassRoom /> }
    ]
  },
  {
    path: '/instructor',
    // <-- dùng InstructorRoute để kiểm tra cả auth + role INSTRUCTOR -->
    element: <InstructorRoute><InstructorLayout /></InstructorRoute>,
    children: [
      { index: true, element: <Pages.Instructor.Home /> },
      { path: 'create-course', element: <Pages.Instructor.CreateCourse /> },
      { path: 'courses', element: <Pages.Instructor.CourseManagement /> },
    ],
    errorElement: <ErrorBoundary />
  },
  {
    path: '/profile',
    element: <Pages.Profile.ProfilePage />,
    errorElement: <ErrorBoundary />
  }
]);