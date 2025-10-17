import { RouterProvider } from 'react-router-dom'
import { router } from './router'

import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <RouterProvider router={router} />
    </>
  )
}