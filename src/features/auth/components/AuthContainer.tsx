import { cn } from '@/lib'

import {
  Card, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import { BorderTrail } from '@/components/ui/border-trail'

type AuthContainerProps = {
  title: string
  subtitle: string
  description: string
  children: React.ReactNode
  footer: React.ReactNode
  hasExtendedFooter?: boolean
}

export default function AuthContainer({ 
  title,
  subtitle,
  description, 
  children,
  footer,
  hasExtendedFooter = false
}: AuthContainerProps) {
  return (
    <Card className="w-[40rem] shadow-lg relative z-[999] bg-white backdrop-blur-lg">
      <BorderTrail
        style={{
          boxShadow:
            '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 80%), 0 0 140px 90px rgb(0 0 0 / 80%)',
        }}
        size={80}
      />
      <CardHeader className="text-center mb-[.65rem]">
        <CardTitle className="flex flex-col items-center gap-4 mb-[.8rem]">
          <span className="text-[3.5rem] font-bold">{title}</span>
          <span className="text-[1.5rem] font-semibold text-gray-600">
            {subtitle}
          </span>
        </CardTitle>
        <CardDescription className="text-[1.25rem] text-gray-600 mt-4">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn('mb-[.5rem]')}>
        {children}
      </CardContent>
      <CardFooter
        className={`
          flex items-center
          ${hasExtendedFooter ? 'flex-col gap-8' : 'justify-center gap-2'}
        `}
      >
        {footer}
      </CardFooter>
    </Card>
  )
}