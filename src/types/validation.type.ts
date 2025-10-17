import { z } from 'zod'
import { loginSchema, registerSchema } from '@/lib'

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
