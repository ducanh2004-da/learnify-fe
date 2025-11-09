import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  /** where to send unauthenticated users (default: /auth/login) */
  redirectToLogin?: string
  /** where to send authenticated-but-unauthorized users (default: /) */
  redirectOnForbidden?: string
}

/**
 * RoleGuard for apps where JWT is stored in HttpOnly cookie and client cannot read it.
 * - Relies on the auth store (initAuth / userDetails / isLoading / isAuthenticated)
 * - If store hasn't initialized, it will call initAuth() once and show nothing while loading.
 * - Unauthenticated -> redirectToLogin (default /auth/login)
 * - Authenticated but role mismatch -> redirectOnForbidden (default /)
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  redirectToLogin = '/auth/login',
  redirectOnForbidden = '/'
}) => {
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userDetails = useAuthStore((s) => s.userDetails)
  const initAuth = useAuthStore.getState().initAuth

  // Ensure auth store attempts to initialize if it wasn't initialized yet.
  useEffect(() => {
    // If no userDetails and not currently loading, try initAuth once.
    if (!isLoading && !isAuthenticated && !userDetails) {
      // call initAuth from the store (it sets isLoading internally)
      void initAuth()
    }
    // We intentionally don't include initAuth in deps (stable getter) to avoid re-calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // While the store is initializing, show nothing (so page doesn't flash and initAuth can check cookie)
  if (isLoading) return null

  // If not authenticated -> send to login
  if (!isAuthenticated) {
    return <Navigate to={redirectToLogin} replace />
  }

  // Determine role from userDetails which the store populates from authService.getCurrentUser()
  const role = userDetails?.role?.toString()?.toUpperCase()

  // If role is missing or not allowed -> redirect to forbidden location (could be home or 403 page)
  const allowed = allowedRoles.map((r) => r.toUpperCase())
  if (!role || !allowed.includes(role)) {
    return <Navigate to={redirectOnForbidden} replace />
  }

  return <>{children}</>
}

export const InstructorRoute: React.FC<{ children: React.ReactNode; redirectToLogin?: string; redirectOnForbidden?: string }> = ({ children, redirectToLogin, redirectOnForbidden }) => (
  <RoleGuard
    allowedRoles={["INSTRUCTOR"]}
    redirectToLogin={redirectToLogin}
    redirectOnForbidden={redirectOnForbidden}
  >
    {children}
  </RoleGuard>
)

export default RoleGuard
