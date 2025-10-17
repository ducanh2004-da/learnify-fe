import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid Email.' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  phoneNumber: z.string().min(10, { message: 'Phone Number must be at least 10 characters.' }),
  password: z.string().min(3, { message: 'Password must be at least 3 characters.' }),
  confirmPassword: z.string().min(3, { message: 'Confirm Password must be at least 3 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid Email.' }),
  password: z.string().min(3, { message: 'Password must be at least 3 characters.' }),
})