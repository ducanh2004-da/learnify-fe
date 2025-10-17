import { cn } from '@/lib'
import { lazy } from 'react'

const TeamImage = lazy(() => import('@/components/TeamImage'))

export default function AboutPage() {
  return (
    <section className="w-full h-[67.5rem] flex flex-col items-center pt-[4rem] relative">
      <div
          id="home-pattern"
          className={cn(
            'absolute inset-0',
            '[background-size:40px_40px]',
            '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
            'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
            'pointer-events-none'
          )}
        />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />

      <div className="w-full h-auto flex flex-col items-center text-center gap-4.5 mb-[1.5vh] relative z-10">
        <h1 className="text-[5rem] font-bold leading-[6.75rem]">Meet our team</h1>
        <p className="w-[33%] text-[1.75rem] font-normal mb-7">
          Discover our mission and values that drive our commitment to delivering innovative learning experiences.
        </p>
        <div className="w-[70%] text-center gap-6 mb-10 relative z-10 m-auto flex justify-center mr-13 mt-5">
          <TeamImage />
        </div>
      </div>
    </section>
  )
}