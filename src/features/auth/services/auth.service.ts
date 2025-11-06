import { apiConfig } from '@/configs'
import { jwtDecode } from 'jwt-decode'
// import { getCookie } from '@/stores'
import { log } from 'console'

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiConfig.post('', {
      query: `
        mutation Mutation($data: LoginInput!) {
  login(data: $data) {
    accessToken
    message
    refreshToken
    success
  }
}
      `,
      variables: { 
        data: { 
          email,
          password 
        } 
      }
    })
    return response.data.data.login
  },
  
  register: async (email: string, username: string, phoneNumber: string, password: string) => {
    const response = await apiConfig.post('', {
      query: `
        mutation Register($data: RegisterInput!) {
  register(data: $data) {
    message
    success
  }
}
      `,
      variables: { 
        data: { 
          email, 
          username,
          phoneNumber, 
          password 
        } 
      }
    })
    return response.data.data.register
  },
  
  loginWithGoogle: async (googleId: string, email: string) => {
    const response = await apiConfig.post('', {
      query: `
        mutation GoogleLogin($data: GoogleLoginInput!) {
          googleLogin(data: $data) {
            success
            message
            token
          }
        }
      `,
      variables: {   
        data: { 
          googleId, 
          email
        } 
      }
    })
    return response.data.data.googleLogin
  },
  
  getCurrentUser: async () => {
    // const token = getCookie('token')
    // if (!token) throw new Error('No token found')
    // const decoded: any = jwtDecode(token)
    // const userId = decoded.id || decoded.userId || decoded.sub
    // if (!userId) throw new Error('No user id in token')
    const response = await apiConfig.post('', {
      query: `
        query User {
          user {
            id
            username
            email
            phoneNumber
            role
            createdAt
            updatedAt
          }
        }
      `,
    })
    return response.data.data.user
  },

  refreshTokens: async () => {
    const response = await apiConfig.post('', {
      query: `
        mutation Refresh {
  refresh {
    message
    success
  }
}
      `
    });
    return response.data.data.refresh;
  },

  logout: async () => {
    const response = await apiConfig.post('', {
      query: `
        mutation Logout {
          logout {
            message
            success
          }
        }
      `
    });
    return response.data.data.logout;
  }

}