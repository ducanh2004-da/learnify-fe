import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores'
import { registerSchema, cn } from '@/lib'
import { RegisterFormData } from '@/types'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AuthContainer } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@iconify/react'

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState<boolean>(false)


  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => registerUser(data.email, data.username, data.phoneNumber, data.password),
    onSuccess: () => {
      navigate('/auth/login')
    },
    onError: (error: Error) => {
      console.error('SignUp failed', error)
      toast.error(error?.message || 'Registration failed. Please try again.')
    }
  })

  const onSubmit = async (data: RegisterFormData) => {
    registerMutation.mutate(data)
  }

  return (
    <AuthContainer
      title="Learnify."
      subtitle="Create your account."
      description="Join our community and start learning today."
      footer={
        <>
          <p className="text-[1.4rem] text-gray-600">
            Already have an account?
          </p>
          <Link to="/auth/login" className="font-medium text-[1.4rem] underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <div className="space-y-5">
          {/* Email */}
          <div className="space-y-1">
            <div className="relative">
              <Icon 
                icon="mdi:email" 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-[1.6rem]" 
              />
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="Email"
                className={cn(
                  'h-14 pl-[3.15rem] pr-6 !text-[1.35rem] !rounded-[.65rem]',
                  errors.email && 'border-red-500'
                )}
              />
            </div>
            {errors.email && (
              <p className="text-[1.15rem] text-red-500 mt-2">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* User Name */}
          <div className="space-y-1">
            <div className="relative">
              <Icon 
                icon="mdi:user" 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-[1.6rem]" 
              />
              <Input
                {...register('username')}
                id="username"
                type="text"
                placeholder="username"
                className={cn(
                  'h-14 pl-[3.15rem] pr-6 !text-[1.35rem] !rounded-[.65rem]',
                  errors.username && 'border-red-500'
                )}
              />
            </div>
            {errors.username && (
              <p className="text-[1.15rem] text-red-500 mt-2">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* phoneNumber */}
          <div className="space-y-1">
            <div className="relative">
              <Icon 
                icon="mdi:email" 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-[1.6rem]" 
              />
              <Input
                {...register('phoneNumber')}
                id="phoneNumber"
                type="text"
                placeholder="phone number"
                className={cn(
                  'h-14 pl-[3.15rem] pr-6 !text-[1.35rem] !rounded-[.65rem]',
                  errors.phoneNumber && 'border-red-500'
                )}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-[1.15rem] text-red-500 mt-2">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="relative">
              <Icon 
                icon="mdi:password" 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-[1.6rem]" 
              />
              <Input
                {...register('password')}
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="Password"
                className={cn(
                  'h-14 pl-[3.15rem] pr-14 !text-[1.35rem] !rounded-[.65rem]',
                  errors.password && 'border-red-500'
                )}
              />
              <Icon 
                icon={isPasswordVisible ? 'mdi:eye-off' : 'mdi:eye'}
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-600 text-[1.6rem] cursor-pointer"
              />
            </div>
            {errors.password && (
              <p className="text-[1.15rem] text-red-500 mt-2">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <div className="relative">
              <Icon 
                icon="mdi:password" 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-[1.6rem]" 
              />
              <Input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={isConfirmPasswordVisible ? 'text' : 'password'}
                placeholder="Confirm password"
                className={cn(
                  'h-14 pl-[3.15rem] pr-14 !text-[1.35rem] !rounded-[.65rem]',
                  errors.confirmPassword && 'border-red-500'
                )}
              />
              <Icon 
                icon={isConfirmPasswordVisible ? 'mdi:eye-off' : 'mdi:eye'}
                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-600 text-[1.6rem] cursor-pointer"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[1.15rem] text-red-500 mt-2">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className={cn(
            'w-full h-[4rem] text-[1.35rem]',
            (errors.email || errors.password || errors.confirmPassword) && 'bg-red-500',
            registerMutation.isPending && 'flex items-center justify-center gap-3 pointer-events-none'
          )}
          // disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <svg viewBox="25 25 50 50" className="!size-[1.75rem] loading__svg">
                <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
              </svg>
              <span>Signing up...</span>
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>
    </AuthContainer>
  )
}
