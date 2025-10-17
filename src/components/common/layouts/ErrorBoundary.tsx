import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { cn } from '@/lib'

const ErrorBoundary = () => {
  const error = useRouteError()
  
  return (
    <section className="w-full h-screen flex flex-col items-center justify-center relative">
      <div
        className={cn(
          'absolute inset-0',
          '[background-size:40px_40px]',
          '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
          'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="text-[14rem] font-bold text-primary -mb-[3.5rem]">
          {isRouteErrorResponse(error) ? error.status : '500'}
        </div>
        <h1 className="text-[3.5rem] font-bold capitalize text-slate-900 mb-[.75rem]">
          {isRouteErrorResponse(error) 
            ? error.statusText 
            : 'An unexpected error occurred'}
        </h1>
        <p className="text-[1.35rem] text-slate-600 max-w-[35rem] mb-[1.5rem]">
          {isRouteErrorResponse(error) 
            ? 'The page you are looking for might have been removed, renamed, or is temporarily unavailable.'
            : 'We have noted this error and will fix it as soon as possible.'}
        </p>
        <div className="flex items-center gap-10 mt-4">
          <Link to="/" className="rounded-full bg-primary text-white px-7 py-3.5 border border-primary font-medium flex items-center gap-5">
            <Icon icon="ri:arrow-left-long-line" className="text-[1.75rem]" />
            <span className="text-[1.35rem]">Back to Home</span>
          </Link>
          <div 
            onClick={() => window.location.reload()}
            className="relative group cursor-pointer"
          > 
            <span className="text-primary text-[1.35rem] font-medium">Reload Page</span>
            <span className="absolute opacity-0 left-0 right-0 bottom-0 h-[.15rem] bg-primary group-hover:opacity-100 transition-all duration-(--duration-main)" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ErrorBoundary