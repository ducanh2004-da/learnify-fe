import { lazy } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { globeConfig } from '@/configs'
import { cn } from '@/lib'

const Globe = lazy(() => import('@/features/home/components/Globe').then(module => ({ default: module.default })))

export default function HomePage() {
  return (
    <section className="w-full min-h-[67.5rem] flex flex-col items-center pt-[4rem] relative bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 transition-colors duration-700">
      <div
        id="home-pattern"
        className={cn(
          'element-animation',
          'absolute inset-0',
          '[background-size:40px_40px]',
          '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
          'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
          'pointer-events-none'
        )}
      />
      <div className="element-animation pointer-events-none absolute inset-0 flex items-center justify-center bg-white/80 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black/80" />
      <div className="w-full h-auto flex flex-col items-center text-center gap-6 mb-[1.5vh] relative z-10">
        <p className="element-animation w-full max-w-5xl text-[4.5rem] md:text-[5rem] font-extrabold leading-[5.5rem] md:leading-[6.75rem] text-zinc-900 dark:text-white drop-shadow-lg transition-all duration-500">
          Unlock Potential with <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">3D AI Immersive Learning</span>
        </p>
        <p className="element-animation w-full max-w-2xl text-[1.5rem] md:text-[1.75rem] font-normal mb-7 text-zinc-700 dark:text-zinc-300 transition-all duration-500">
          Discover expert-led courses with personalized guidance from our interactive 3D AI Teacher.
        </p>
        <div className="element-animation flex flex-col md:flex-row items-center gap-6 md:gap-10 mt-2">
          <Link
            to="/courses"
            className="rounded-full bg-primary text-white px-9 py-5 border border-primary font-semibold flex items-center gap-5 shadow-lg hover:scale-105 hover:bg-primary/90 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            <span className="text-[1.5rem]">Explore Courses</span>
            <Icon icon="ri:arrow-right-long-line" className="text-[2rem]" />
          </Link>
          <Link
            to="/about"
            className="bg-white dark:bg-zinc-900 relative group rounded-full px-8 py-4 border border-zinc-200 dark:border-zinc-700 shadow-md hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <span className="text-primary text-[1.5rem] font-semibold group-hover:underline transition-all duration-200">Learn More</span>
          </Link>
        </div>
      </div>
      <div className="w-full flex justify-center mt-10 z-0">
        <div className="rounded-3xl shadow-2xl overflow-hidden border-4 border-primary/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl transition-all duration-500">
          <Globe globeConfig={globeConfig.main} data={globeConfig.sampleArcs} />
        </div>
      </div>
    </section>
  )
}
