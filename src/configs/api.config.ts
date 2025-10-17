import axios from 'axios'
import { getCookie, useAuthStore } from '@/stores'

const apiConfig = axios.create({
  baseURL: import.meta.env.VITE_API_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

apiConfig.interceptors.request.use(
  (config) => {
    const token = getCookie('token')
    
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiConfig.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      
      if (status === 401) {
        try {
          if (useAuthStore) {
            const { logout } = useAuthStore.getState()
            if (typeof logout === 'function') {
              logout()
            }
          }
        } catch (e) {
          console.error('Không thể đăng xuất tự động:', e)
        }
        
        window.location.href = '/auth/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiConfig