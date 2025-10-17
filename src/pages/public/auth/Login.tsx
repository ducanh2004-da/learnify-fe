import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores'
import { loginSchema, cn } from '@/lib'
import { apiConfig } from '@/configs'
import { LoginFormData, GoogleUserInfo } from '@/types'
import { Icon } from '@iconify/react'
import { useGoogleLogin } from '@react-oauth/google'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AuthContainer } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const { login, loginWithGoogle, setGoogleInfo, clearGoogleInfo } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => login(data.email, data.password),
    onSuccess: (data) => {
      if (data.token) {
          localStorage.setItem('token', data.token);
      }
      try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          const role = payload.role;
          if (role === 'INSTRUCTOR') navigate('/instructor', { replace: true });
          else navigate('/', { replace: true });
        }
      catch (error) {
        console.log(error);
      }
    },
    onError: (error: Error) => {
      console.log(error.message)
      toast.error(error?.message || 'Invalid email or password')
    }
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  const googleLoginMutation = useMutation({
    mutationFn: async (googleUserInfo: {
      sub: string,
      email: string,
      googleInfo: GoogleUserInfo
    }) => {
      return loginWithGoogle(
        googleUserInfo.sub,
        googleUserInfo.email,
        googleUserInfo.googleInfo
      )
    },
    onSuccess: () => {
      setIsGoogleLoading(false)
      navigate('/', { replace: true })
    },
    onError: (error) => {
      setIsGoogleLoading(false)
      console.error('Google login failed:', error)
      toast.error('Google login failed')
    }
  })

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsGoogleLoading(true)

        const userInfoResponse = await apiConfig.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        })

        const userInfo = userInfoResponse.data
        // console.log('Google User Info:', userInfo)

        clearGoogleInfo()

        const googleUserInfo = {
          name: userInfo.name,
          given_name: userInfo.given_name,
          email: userInfo.email,
          picture: userInfo.picture,
          sub: userInfo.sub
        }

        setGoogleInfo(googleUserInfo)

        googleLoginMutation.mutate({
          sub: userInfo.sub,
          email: userInfo.email,
          googleInfo: googleUserInfo
        })
      } catch (error) {
        setIsGoogleLoading(false)
        console.error('Google login failed:', error)
        toast.error('Google login failed')
      }
    },
    onError: () => {
      setIsGoogleLoading(false)
      toast.error('Google login failed')
    },
    onNonOAuthError: () => {
      setIsGoogleLoading(false)
      toast.error('Google login failed due to non-OAuth error')
    }
  })

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    try {
      googleLogin()
    } catch (error: any) {
      setIsGoogleLoading(false)
      toast.error(error?.message || 'Failed to open Google login popup')
    }
  }

  const isLoading = isGoogleLoading || googleLoginMutation.isPending

  return (
    <AuthContainer
      title="Learnify."
      subtitle="Log in with your email."
      description="Access thousands of courses and start learning today."
      hasExtendedFooter
      footer={
        <>
          <div className="flex justify-center items-center gap-2">
            <p className="text-[1.4rem] text-gray-600">
              Don't have an account?
            </p>
            <Link
              to="/auth/signup"
              className="font-medium text-[1.4rem] underline"
            >
              Sign up
            </Link>
          </div>
          <Link to="/" className="flex items-center gap-2.5">
            <Icon
              icon="lsicon:arrow-left-filled"
              className="text-[2rem]"
            />
            <span className="text-[1.4rem] underline">Back to home</span>
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <div className="space-y-5">
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
          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="font-medium text-[1.35rem] underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
        <Button
          type="submit"
          className={cn(
            'w-full h-[4rem] text-[1.35rem]',
            errors.email || (errors.password && 'bg-red-500 pointer-events-none'),
            loginMutation.isPending && 'flex items-center justify-center gap-3 pointer-events-none'
          )}
        // disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <svg viewBox="25 25 50 50" className="!size-[1.5rem] loading__svg">
                <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-[.15rem] flex-1 bg-gray-200"></div>
          <span className="text-gray-500 text-[1.35rem]">OR</span>
          <div className="h-[.15rem] flex-1 bg-gray-200"></div>
        </div>

        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full h-[4rem] flex items-center justify-center gap-2 text-[1.35rem] border-[1px]',
            (isLoading || loginMutation.isPending) && 'pointer-events-none'
          )}
          disabled={isLoading}
          onClick={handleGoogleLogin}
        >
          {isLoading ? (
            <>
              <svg viewBox="25 25 50 50" className="!size-[1.75rem] loading__svg">
                <circle r="20" cy="50" cx="50" className="loading__circle !stroke-black" />
              </svg>
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <Icon icon="flat-color-icons:google" className="size-[1.95rem]" />
              <span>Continue with Google</span>
            </>
          )}
        </Button>
      </form>
    </AuthContainer>
  )
}