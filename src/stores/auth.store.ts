import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import { authService } from '@/features/auth'
import { toast } from 'sonner'
import { AuthStore, DecodedToken, GoogleUserInfo } from '@/types'
import { queryClient } from '@/configs'

// const setCookie = (name: string, value: string, days: number = 7) => {
//   const date = new Date()
//   date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
//   document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Strict; Secure`
// }

// const getCookie = (name: string): string | null => {
//   const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
//   return match ? match[2] : null
// }

// const deleteCookie = (name: string) => {
//   document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Strict; Secure`
// }

const isTokenValid = (token: string): boolean => {
  try {
    const decoded: DecodedToken = jwtDecode(token)
    const currentTime = Date.now() / 1000
    return decoded.exp ? decoded.exp > currentTime : false
  } catch (error) {
    console.error('Error decoding token:', error)
    return false
  }
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set): AuthStore => ({
      user: null,
      userDetails: null,
      googleInfo: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email: string, password: string) => {
        const loginResult = await authService.login(email, password)
        // console.log(loginResult)
        if (loginResult?.success) {
          try {
            // const decoded: DecodedToken = jwtDecode(loginResult.token)
            const userDetails = await authService.getCurrentUser()
            // const decoded: DecodedToken = jwtDecode(loginResult.token)

            if (userDetails) {
              set({
                userDetails,
                user: {
                  id: userDetails.id,
                  email: userDetails.email,
                  username: userDetails.username,
                  role: userDetails.role
                } as DecodedToken,
                isAuthenticated: true,
                isLoading: false
              });
              // setCookie('token', loginResult.token, 7)
              toast.success(loginResult.message || 'Login successfully')

              // Redirect by role
              const role = (userDetails.role || '').toString().toUpperCase()
              if (role === 'INSTRUCTOR') {
                window.location.href = '/instructor'
              } else {
                window.location.href = '/'
              }

              return loginResult
            }
            else {
              // fallback: if server returned accessToken in body (not recommended with httpOnly cookie)
              if (loginResult.accessToken) {
                try {
                  // @ts-ignore
                  const decoded: any = jwtDecode(loginResult.accessToken)
                  set({
                    user: decoded,
                    isAuthenticated: true,
                    isLoading: false
                  })
                  toast.success(loginResult.message || 'Login successful (fallback)')
                  // redirect using decoded.role if exists
                  const role = (decoded.role || '').toString().toUpperCase()
                  if (role === 'INSTRUCTOR') window.location.href = '/instructor'
                  else window.location.href = '/'
                  return loginResult
                } catch (e) {
                  // ignore
                }
              }
            }
            console.log("end");
          } catch (err) {
            console.error('Error during post-login user fetch:', err)
          }
        }
        set({ isLoading: false })
        // return/loginResult even if failed so component can handle
        return loginResult
      },

      register: async (email: string, username: string, phoneNumber: string, password: string) => {
        set({ isLoading: true })
        const registerResult = await authService.register(email, username, phoneNumber, password)
        if (registerResult?.success) {
          toast.success(registerResult.message || 'Register successfully.')
          // If backend sets cookies at register, call getCurrentUser to pick up user state
          try {
            const userDetails = await authService.getCurrentUser()
            if (userDetails) {
              set({
                userDetails,
                user: {
                  id: userDetails.id,
                  email: userDetails.email,
                  username: userDetails.username,
                  role: userDetails.role
                } as DecodedToken,
                isAuthenticated: true,
                isLoading: false
              })
              // redirect by role
              const role = (userDetails.role || '').toString().toUpperCase()
              if (role === 'INSTRUCTOR') window.location.href = '/instructor'
              else window.location.href = '/'
              return registerResult
            }
          } catch (err) {
            // ignore and let user navigate to login page
          }
          // Default: go to login page
          set({ isLoading: false })
          window.location.href = '/auth/login'
          return registerResult
        }
        set({ isLoading: false })
        throw new Error(registerResult?.message || 'Registration failed')
      },

      loginWithGoogle: async (googleId: string, email: string, googleInfo?: GoogleUserInfo) => {
        try {
          const loginResult = await authService.loginWithGoogle(googleId, email)

          if (loginResult.success && loginResult.token) {
            const decoded = jwtDecode(loginResult.token)

            if (googleInfo) {
              set({
                user: { ...decoded, token: loginResult.token },
                googleInfo: googleInfo
              })
            } else {
              set({ user: { ...decoded, token: loginResult.token } })
            }

            // setCookie('token', loginResult.token, 7)
            toast.success(loginResult.message || 'Google login successfully')
            return loginResult
          }
          throw new Error(loginResult.message || 'Google login failed')
        } catch (error) {
          console.error('Google login failed:', error)
          throw error
        }
      },

      logout: async () => {
        try {
          await authService.logout();
          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            googleInfo: null,
            userDetails: null,
            isAuthenticated: false
          });
          if (queryClient) queryClient.clear();
          // ensure server cleared cookies; redirect to login
          window.location.href = '/auth/login';
        }
      },

      getUserInfo: async () => {
        try {
          const userInfo = await authService.getCurrentUser()
          set({ userDetails: userInfo })
          return userInfo
        } catch (error) {
          console.error('Error getting user info:', error)
          throw error
        }
      },
      initAuth: async () => {
        try {
          set({ isLoading: true });
          const userInfo = await authService.getCurrentUser();
          if (userInfo) {
            set({
              userDetails: userInfo,
              isAuthenticated: true,
              user: {
                id: userInfo.id,
                email: userInfo.email,
                role: userInfo.role,
                username: userInfo.username
              } as DecodedToken,
              isLoading: false
            });
          } else {
            set({ user: null, userDetails: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          set({ user: null, userDetails: null, isAuthenticated: false, isLoading: false });
        }
      },
      setGoogleInfo: (info: GoogleUserInfo) => {
        set({
          googleInfo: {
            name: info.name,
            email: info.email,
            picture: info.picture
          }
        })
      },
      clearGoogleInfo: () => {
        set({ googleInfo: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        googleInfo: state.googleInfo
      }),
      storage: createJSONStorage(() => localStorage)
    }
  )
)

export {
  useAuthStore,
  isTokenValid
}