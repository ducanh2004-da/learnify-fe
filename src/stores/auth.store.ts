import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import { authService } from '@/features/auth'
import { toast } from 'sonner'
import { AuthStore, DecodedToken, GoogleUserInfo } from '@/types'
import { queryClient } from '@/configs'

const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Strict; Secure`
}

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Strict; Secure`
}

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
      login: async (email: string, password: string) => {
        const loginResult = await authService.login(email, password)
        // console.log(loginResult)
        if (loginResult.success && loginResult.token) {
          const decoded: DecodedToken = jwtDecode(loginResult.token)
          set({ user: { ...decoded, token: loginResult.token } })
          setCookie('token', loginResult.token, 7)
          toast.success(loginResult.message || 'Login successfully')
          return loginResult
        }
        throw new Error(loginResult.message || 'Login failed')
      },
      register: async (email: string, username: string, phoneNumber: string, password: string) => {
        const registerResult = await authService.register(email, username, phoneNumber, password)
        if (registerResult.success) {
          toast.success(registerResult.message || 'Register successfully. Please login.')
          return registerResult
        }
        throw new Error(registerResult.message || 'Registration failed')
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
            
            setCookie('token', loginResult.token, 7)
            toast.success(loginResult.message || 'Google login successfully')
            return loginResult
          }
          throw new Error(loginResult.message || 'Google login failed')
        } catch (error) {
          console.error('Google login failed:', error)
          throw error
        }
      },
      logout: () => {
        set({ 
          user: null,
          googleInfo: null,
          userDetails: null
        })
        deleteCookie('token')

        if (queryClient) {
          queryClient.clear();
          localStorage.removeItem('token');
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
        const token = getCookie('token')
        if (token) {
          try {
            const decoded: DecodedToken = jwtDecode(token)
            
            const currentTime = Date.now() / 1000
            if (decoded.exp && decoded.exp > currentTime) {
              set({ user: { ...decoded, token } })
              
              try {
                const userInfo = await authService.getCurrentUser()
                set({ userDetails: userInfo })
              } catch (error) {
                console.error('Error getting user info during init:', error)
              }
            } else {
              deleteCookie('token')
            }
          } catch (error) {
            console.error('Error decoding token:', error)
            deleteCookie('token')
          }
        }
        return Promise.resolve()
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
  getCookie,
  deleteCookie,
  isTokenValid
}