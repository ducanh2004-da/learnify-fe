import { lazy } from 'react';
import { createBrowserRouter, redirect } from 'react-router-dom';

import { AuthLayout, MainLayout, ClassRoomLayout, DashboardLayout, InstructorLayout } from '@/layouts';
import { ErrorBoundary } from '@/components';
import { getCookie, isTokenValid, deleteCookie } from '@/stores';

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

// helper lấy token: ưu tiên cookie, fallback localStorage
const getToken = (): string | null => {
  const cookieToken = getCookie('token');
  if (cookieToken) return cookieToken;
  const localToken = localStorage.getItem('token');
  return localToken ?? null;
};

// parse token safe — có thể truyền token làm argument
const parseToken = (token?: string) => {
  const t = token ?? getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload; // { sub, email, role }
  } catch (err) {
    console.error('parseToken error', err);
    return null;
  }
};

const authGuard = () => {
  const token = getToken();

  if (!token || !isTokenValid(token)) {
    // nếu có token không hợp lệ thì xoá cả cookie + localStorage
    if (token) {
      try { deleteCookie('token'); } catch {}
      try { localStorage.removeItem('token'); } catch {}
    }
    return redirect('/auth/login');
  }
  // trả null để route tiếp tục (không redirect)
  return null;
};

const redirectIfAuthenticated = () => {
  const token = getToken();
  if (token && isTokenValid(token)) {
    const payload = parseToken(token);
    if (payload?.role === 'INSTRUCTOR' || payload?.role === 'instructor') {
      return redirect('/instructor');
    } else {
      return redirect('/');
    }
  }
  return null;
};

const instructorGuard = () => {
  const token = getToken();
  if (!token || !isTokenValid(token)) {
    // không hợp lệ -> xóa token nếu có và yêu cầu login
    try { deleteCookie('token'); } catch {}
    try { localStorage.removeItem('token'); } catch {}
    return redirect('/auth/login');
  }

  const payload = parseToken(token);
  // Nếu payload thiếu hoặc role không phải instructor -> redirect to login hoặc unauthorized
  if (!payload || !(payload.role === 'INSTRUCTOR' || payload.role === 'instructor')) {
    return redirect('/auth/login');
  }

  // thành công -> KHÔNG redirect, trả null để cho phép vào route
  return null;
};

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
    // loader: redirectIfAuthenticated (redirect if already authed)
    loader: redirectIfAuthenticated,
    children: [
      { path: 'login', element: <Pages.Auth.Login /> },
      { path: 'signup', element: <Pages.Auth.Register /> }
    ],
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    loader: authGuard,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/dashboard/classroom',
    element: <ClassRoomLayout />,
    loader: authGuard,
    children: [
      { index: true, element: <Pages.Dashboard.ClassRoom /> },
      { path: ':courseId/lessons/:lessonId', element: <Pages.Dashboard.ClassRoom /> }
    ]
  },
  {
    path: '/instructor',
    element: <InstructorLayout />,
    loader: instructorGuard,
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
