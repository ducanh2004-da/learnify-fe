import { ReactNode, useRef, RefObject } from 'react'
import { useHover } from 'usehooks-ts'
import { cn, gsap, useGSAP } from '@/lib'

interface TooltipProps {
  children?: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  contentClassName?: string
}

export const Tooltip = ({
  children,
  content,
  position = 'top',
  className,
  contentClassName
}: TooltipProps) => {
  const targetRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const isHovered = useHover(targetRef as RefObject<HTMLElement>)
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3'
  }
  
  useGSAP(() => {
    if (!tooltipRef.current) return

    if (tl.current) {
      tl.current.kill()
    }
    
    tl.current = gsap.timeline()
    
    if (!isHovered) {
      if (tooltipRef.current.style.display === 'block') {
        tl.current
          .to(tooltipRef.current, {
            opacity: 0,
            scale: 0.95,
            duration: 0.2,
            ease: 'back.in(1.5)',
            onComplete: () => {
              gsap.set(tooltipRef.current, { display: 'none' })
            }
          })
      } else {
        gsap.set(tooltipRef.current, {
          display: 'none',
          opacity: 0,
          scale: 0.95
        })
      }
      return
    }
    
    gsap.set(tooltipRef.current, {
      display: 'block',
      opacity: 0,
      scale: 0.95,
      transformOrigin: position === 'top' || position === 'bottom' ? 'center bottom' : 'left center'
    })
    
    tl.current.to(tooltipRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: 'back.out(1.5)'
    })
    
  }, { dependencies: [isHovered, position] })

  return (
    <div 
      ref={targetRef}
      className={cn('size-full relative', className)}
    >
      {children}
      
      <div 
        ref={tooltipRef}
        className={cn(
          'hidden absolute z-50 whitespace-nowrap rounded-md bg-white/20 backdrop-blur-[16px] border border-white/20 px-3 py-1.5',
          'text-white font-medium text-sm min-w-max drop-shadow-lg',
          positionClasses[position],
          contentClassName
        )}
      >
        {content}
      </div>
    </div>
  )
}