import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: import.meta.env.PROD || process.env.NODE_ENV === 'production',
      refetchOnMount: false,
      refetchOnReconnect: true,
      retry: 3,
      staleTime: 5 * 60 * 1000
    },
    mutations: {
      retry: 2,
      networkMode: 'always'
    }
  }
})