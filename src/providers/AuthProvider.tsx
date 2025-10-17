import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores'
import { Loading } from '@/components'
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const initAuth = useAuthStore(state => state.initAuth)

  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  useEffect(() => {
    initAuth().then(() => {
      setIsInitialized(true)
    })
  }, [initAuth])

  if (!isInitialized) {
    return <Loading />
  }

  return <>{children}</>
}