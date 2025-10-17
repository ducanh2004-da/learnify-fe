import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib'

type ClassroomLoadingProps = {
  progress: number
  sdkError: string | null
  sdkLoading: boolean
  isLoaded: boolean
  onFadeComplete?: () => void
}

export default function ClassroomLoading({ 
  progress, 
  sdkError, 
  sdkLoading,
  isLoaded,
  onFadeComplete
}: ClassroomLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spinnerRef = useRef<HTMLDivElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (isLoaded && containerRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          if (onFadeComplete) onFadeComplete()
        }
      })
      
      tl.to(spinnerRef.current, {
        scale: 1.2,
        opacity: 0,
        duration: 0.5,
        ease: 'back.in(1.7)'
      })
      
      .to(textContainerRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in'
      }, '-=0.3')
      
      .to(containerRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          if (containerRef.current) {
            containerRef.current.style.visibility = 'hidden'
          }
        }
      }, '-=0.2')
    }
  }, [isLoaded, onFadeComplete])

  useGSAP(() => {
    if (containerRef.current) {
      gsap.set([containerRef.current, spinnerRef.current, textContainerRef.current], { 
        opacity: 0 
      })
      
      const tl = gsap.timeline()
      
      tl.to(containerRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      })
      
      .fromTo(spinnerRef.current, 
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' }
      )
      
      .fromTo(textContainerRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50"
    >
      <div className="relative flex flex-col items-center">
        <div ref={spinnerRef} className="relative mb-6">
          <svg className="size-[9rem]" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="40" fill="none" stroke="#333" strokeWidth="2" />
            <circle 
              cx="45" 
              cy="45" 
              r="40" 
              fill="none" 
              stroke="white" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeDasharray="251" 
              strokeDashoffset={251 - (251 * progress) / 100}
              transform="rotate(-90, 45, 45)" 
              style={{ transition: 'stroke-dashoffset .5s ease' }} 
            />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-medium text-[1.65rem]">{Math.round(progress)}%</span>
          </div>
        </div>
        
        <div ref={textContainerRef}>
          <h2 className="text-white text-[1.5rem] font-bold mb-1.5">Loading 3D Environment</h2>
          
          <div className="text-neutral-300 text-[1.2rem] mb-1.5 text-center">
            {progress < 30 && 'Initializing assets...'}
            {progress >= 30 && progress < 60 && 'Loading 3D models...'}
            {progress >= 60 && progress < 80 && 'Preparing classroom...'}
            {progress >= 80 && progress < 100 && 'Setting up teacher...'}
            {progress === 100 && 'Environment ready!'}
          </div>
        </div>
      </div>
      
      {sdkError && !sdkLoading && (
        <div className="bg-red-900/40 text-red-200 text-xs p-3 rounded-lg mt-6 max-w-md text-center border border-red-700">
          <strong className="block mb-1">Azure SDK Erorr:</strong> {sdkError}
        </div>
      )}
      
      {/* {sdkLoading && (
        <div className="bg-blue-900/40 text-blue-200 text-xs p-3 rounded-lg mt-6 max-w-md flex items-center">
          <svg className="animate-spin mr-2 h-4 w-4 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang khởi tạo Azure Speech SDK...
        </div>
      )} */}
    </div>
  )
}