import * as React from 'react'

import { cn } from '@/lib'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse bg-black/15 rounded-md', 
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }