import { JwtPayload } from 'jwt-decode'
import { User } from './user.type'

interface DecodedToken extends JwtPayload {
  email?: string
  username?: string
  [key: string]: any
}

interface GoogleUserInfo {
  name?: string
  given_name?: string
  email?: string
  picture?: string
  sub?: string
}

interface AuthUser {
  id?: string,
  email?: string
  username?: string
  role?: string
  [key: string]: any
}

interface AuthStore {
  user: AuthUser | null
  googleInfo: GoogleUserInfo | null
  userDetails: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<any>
  register: (email: string, username: string, phoneNumber: string, password: string) => Promise<any>
  loginWithGoogle: (googleId: string, email: string, googleInfo?: GoogleUserInfo) => Promise<any>
  logout: () => void
  getUserInfo: () => Promise<User>
  initAuth: () => Promise<void>
  setGoogleInfo: (info: GoogleUserInfo) => void
  clearGoogleInfo: () => void
}

export type { DecodedToken, GoogleUserInfo, AuthUser, AuthStore }