// src/configs/api.config.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth.store'

const apiConfig = axios.create({
  baseURL: import.meta.env.VITE_API_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
})

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

apiConfig.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // no token header because using httpOnly cookie
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiConfig.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) return Promise.reject(error);
    const { status } = error.response;

    // Determine request body string safely
    const requestBody = originalRequest?.data
      ? (typeof originalRequest.data === 'string' ? originalRequest.data : JSON.stringify(originalRequest.data))
      : '';

    // If 401 and not retried yet -> try refresh
    if (status === 401 && !originalRequest._retry) {
      // If this request is the refresh mutation itself -> logout
      if (requestBody.includes('mutation Refresh')) {
        const { logout } = useAuthStore.getState();
        await logout();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(() => apiConfig(originalRequest))
        .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          import.meta.env.VITE_API_BACKEND_URL,
          {
            query: `
              mutation Refresh {
                refresh {
                  success
                  message
                }
              }
            `
          },
          { withCredentials: true }
        );

        if (refreshResponse.data?.data?.refresh?.success) {
          isRefreshing = false;
          processQueue(null);
          return apiConfig(originalRequest);
        } else {
          throw new Error('Refresh token failed');
        }
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError as Error);
        const { logout } = useAuthStore.getState();
        await logout();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // GraphQL errors handling
    if (error.response?.data) {
      const graphqlErrors = (error.response.data as any)?.errors;
      if (graphqlErrors && graphqlErrors.length > 0) {
        const errorMessage = graphqlErrors[0].message;
        return Promise.reject(new Error(errorMessage));
      }
    }

    return Promise.reject(error);
  }
);

export default apiConfig;
