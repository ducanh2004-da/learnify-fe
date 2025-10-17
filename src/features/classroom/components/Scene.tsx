import { lazy, useState, useEffect, useRef } from 'react'
import { Gltf, Environment, Float, Html } from '@react-three/drei'
import { degToRad } from 'three/src/math/MathUtils.js'
import { Leva } from 'leva'
import { Icon } from '@iconify/react'
import { useParams } from 'react-router-dom'
import { gsap, useGSAP } from '@/lib'
import { useMutation, useQuery } from '@tanstack/react-query'
import { youtubeLink } from '@/mocks/youtubeLink'

import CameraManager from './CameraManager'
import { Button } from '@/components/ui/button'
import { useClassroomStore } from '../stores'
import { useAuthStore } from '@/stores'
import { lessonService } from '../../courses/services'

import { MdOutlineZoomOutMap } from "react-icons/md";

const Teacher = lazy(() => import('./Teacher'))

const Scene = () => {
  const { courseId, lessonId } = useParams()
  const { user: authUser } = useAuthStore()
  const [zoomlesson, setZoomless] = useState(false);

  const initialLoad = useClassroomStore((state) => state.initialLoad)
  const isExplanationVisible = useClassroomStore((state) => state.isExplanationVisible)
  const setIsLessonStarted = useClassroomStore((state) => state.setIsLessonStarted)
  const setIsExplanationVisible = useClassroomStore((state) => state.setIsExplanationVisible)

  const [envPreset, setEnvPreset] = useState<'warehouse' | 'sunset'>('warehouse')
  const [lessonExplanation, setLessonExplanation] = useState<string>('')
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'loading' | 'explanation'>('welcome')

  const explanationContentRef = useRef<HTMLDivElement>(null)
  const welcomeContentRef = useRef<HTMLDivElement>(null)
  const loadingContentRef = useRef<HTMLDivElement>(null)
  const lessonContentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (welcomeContentRef.current) {
      welcomeContentRef.current.style.display = currentScreen === 'welcome' ? 'flex' : 'none'
      welcomeContentRef.current.style.opacity = currentScreen === 'welcome' ? '1' : '0'
    }

    if (loadingContentRef.current) {
      loadingContentRef.current.style.display = currentScreen === 'loading' ? 'flex' : 'none'
      loadingContentRef.current.style.opacity = currentScreen === 'loading' ? '1' : '0'
    }

    if (explanationContentRef.current) {
      explanationContentRef.current.style.display = currentScreen === 'explanation' ? 'flex' : 'none'
      explanationContentRef.current.style.opacity = currentScreen === 'explanation' ? '1' : '0'
    }

    const currentElement =
      currentScreen === 'welcome' ? welcomeContentRef.current :
        currentScreen === 'loading' ? loadingContentRef.current :
          explanationContentRef.current

    if (currentElement) {
      gsap.fromTo(
        currentElement,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.inOut' }
      )
    }
  }, { scope: containerRef, dependencies: [currentScreen] })

  const formatLessonContent = (content: string) => {
    if (!content) return ''

    const safeContent = content
      .replace(/\\/g, '___ESCAPE_BACKSLASH___')
      .replace(/\$/g, '___ESCAPE_DOLLAR___')
      .replace(/\*/g, '___ESCAPE_ASTERISK___')
      .replace(/\[/g, '___ESCAPE_BRACKET_OPEN___')
      .replace(/\]/g, '___ESCAPE_BRACKET_CLOSE___')
      .replace(/\(/g, '___ESCAPE_PAREN_OPEN___')
      .replace(/\)/g, '___ESCAPE_PAREN_CLOSE___')
      .replace(/`/g, '___ESCAPE_BACKTICK___')

    let formattedContent = safeContent
      .replace(/CHƯƠNG \d+: (.*?)(?=\n)/g, '<h1 class="text-[5rem] font-bold text-center text-white mb-[2rem] mt-[1rem] tracking-tight">$&</h1>')
      .replace(/Phần \d+: (.*?)(?=\n)/g, '<h2 class="text-[4.5rem] font-semibold text-white mb-[1.5rem] mt-[2.5rem] tracking-tight">$&</h2>')

    formattedContent = formattedContent
      .replace(/___ESCAPE_BACKTICK___/g, '`')
      .replace(/___ESCAPE_PAREN_CLOSE___/g, ')')
      .replace(/___ESCAPE_PAREN_OPEN___/g, '(')
      .replace(/___ESCAPE_BRACKET_CLOSE___/g, ']')
      .replace(/___ESCAPE_BRACKET_OPEN___/g, '[')
      .replace(/___ESCAPE_ASTERISK___/g, '*')
      .replace(/___ESCAPE_DOLLAR___/g, '$')
      .replace(/___ESCAPE_BACKSLASH___/g, '\\')

    formattedContent = formattedContent.replace(
      /^(#{1,6})\s+([^#\s].*?)$/gm,
      (_, hashes, content) => {
        const level = Math.min(hashes.length, 6) as 1 | 2 | 3 | 4 | 5 | 6

        const sizes: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
          1: '4.5rem',
          2: '4rem',
          3: '3.5rem',
          4: '3rem',
          5: '2.7rem',
          6: '2.5rem'
        }

        const margins: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
          1: 'mt-[3rem] mb-[1.5rem]',
          2: 'mt-[2.5rem] mb-[1.2rem]',
          3: 'mt-[2rem] mb-[1rem]',
          4: 'mt-[1.8rem] mb-[.8rem]',
          5: 'mt-[1.5rem] mb-[.7rem]',
          6: 'mt-[1.2rem] mb-[.6rem]'
        }

        const weight = level <= 2 ? 'font-bold' : 'font-semibold'
        return `<h${level} class="text-[${sizes[level]}] ${weight} text-white/95 ${margins[level]}">${content}</h${level}>`
      }
    )

    formattedContent = formattedContent.replace(
      /```(\w+)?\n([\s\S]*?)```/gm,
      (_, language, code) => {
        const langClass = language ? ` language-${language}` : ''
        const cleanedCode = code.trim()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
        return `<pre class="bg-black/40 p-[1.5rem] rounded-[0.8rem] mb-[1.5rem] overflow-x-auto"><code class="text-[2.2rem] text-blue-300 font-mono${langClass}">${cleanedCode}</code></pre>`
      }
    )

    formattedContent = formattedContent.replace(
      /`([^`]+)`/g,
      (_, code) => {
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
        return `<code class="bg-black/30 px-[0.8rem] py-[0.3rem] rounded-[0.4rem] text-[2.2rem] text-blue-300 font-mono">${escapedCode}</code>`
      }
    )

    formattedContent = formattedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-white/90">$1</em>')

    formattedContent = formattedContent.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-blue-300 underline hover:text-blue-400 transition-colors" target="_blank">$1</a>'
    )

    formattedContent = formattedContent
      .replace(/^\s*\*\s+(.*?)$/gm, '<li class="mb-[0.7rem] ml-[2rem]">$1</li>')
      .replace(/^\s*-\s+(.*?)$/gm, '<li class="mb-[0.7rem] ml-[2rem]">$1</li>')

    formattedContent = formattedContent.replace(
      /(<li class="mb-\[0.7rem\] ml-\[2rem\]">.*?<\/li>(\n|$))+/g,
      (match) => `<ul class="list-disc mb-[1.2rem] mt-[0.8rem]">${match}</ul>`
    )

    formattedContent = formattedContent.replace(
      /^(?!<h|<pre|<code|<ul|<li|<div|<a|<strong|<em)(.+)$/gm,
      '<p class="mb-[1rem]">$1</p>'
    )

    formattedContent = formattedContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n\n/g, '<div class="h-[1rem]"></div>')
      .replace(/\n/g, '')

    return formattedContent
  }

  const {
    isLoading: isExplanationLoading,
    isError: isExplanationError,
    error: explanationError,
    refetch: refetchExplanation
  } = useQuery({
    queryKey: ['lessonExplanation', lessonId, authUser?.id],
    queryFn: () => {
      if (!lessonId || !authUser?.id) return null
      return lessonService.getLessonExplanationByLessonAndUser(lessonId, authUser.id)
    },
    enabled: !!lessonId && !!authUser?.id,
    staleTime: Infinity
  })

  const lessonExplanationMutation = useMutation({
    mutationFn: ({ emotion, lessonId, userId, courseId }: {
      emotion: string,
      lessonId: string,
      userId: string,
      courseId: string
    }) => lessonService.createLessonExplanation(emotion, lessonId, userId, courseId),
    onSuccess: (data) => {
      setLoadingMessage('')
      setLessonExplanation(data.content || 'No explanation available')
      setIsExplanationVisible(true)
      setCurrentScreen('explanation')
    },
    onError: (error: any) => {
      console.error('Error creating lesson explanation:', error)
      setLoadingMessage('Error creating lesson. Please try again later.')
      setCurrentScreen('welcome')

      setTimeout(() => {
        setLoadingMessage('')
      }, 3000)
    }
  })

  const displayExplanation = (content: string) => {
    setLessonExplanation(content || 'No explanation available')
    setIsExplanationVisible(true)
    setLoadingMessage('')
    setCurrentScreen('explanation')
  }

  function checkTimeForEnvironment() {
    const currentHour: number = new Date().getHours()

    if (currentHour >= 15 && currentHour < 19) {
      setEnvPreset('sunset')
    } else {
      setEnvPreset('warehouse')
    }
  }

  useEffect(() => {
    checkTimeForEnvironment()

    const hourlyInterval = setInterval(checkTimeForEnvironment, 60 * 60 * 1000)

    return () => clearInterval(hourlyInterval)
  }, [])

  const handleGetLessonExplanation = async () => {
    if (!courseId || !lessonId || !authUser?.id) return

    setIsLessonStarted(true)
    setLoadingMessage('Loading your lesson...')
    setCurrentScreen('loading')

    try {
      const { data: latestExplanation } = await refetchExplanation()

      if (latestExplanation) {
        setLoadingMessage('Found your lesson!')
        await new Promise(resolve => setTimeout(resolve, 1000))
        displayExplanation(latestExplanation.content)
        return
      }

      setLoadingMessage('Creating new lesson...')

      const emotion = 'vui ve'

      lessonExplanationMutation.mutate({
        emotion,
        lessonId,
        userId: authUser.id,
        courseId
      })
    } catch (error: any) {
      console.error('Error checking lesson explanation:', error)
      setLoadingMessage('Error checking lesson. Please try again later.')
      setCurrentScreen('welcome')

      setTimeout(() => {
        setLoadingMessage('')
      }, 3000)
    }
  }
  function handleZoomLesson() {
    setZoomless(prev => !prev);
  }

  const lightColor = envPreset === 'sunset' ? 'orange' : 'pink'
  const lightIntensity = envPreset === 'sunset' ? 0.8 : 1

  return (
    <Float speed={0.5} floatIntensity={0.2} rotationIntensity={0.1}>
      <ambientLight intensity={0.8} color={lightColor} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={lightIntensity}
      />
      <Environment preset={envPreset} />
      <Leva hidden />
      <CameraManager />
      <Teacher
        position={[-0.05, -1.75, -2.0]}
        scale={1.5}
        rotation-y={degToRad(188)}
      />
      <Html
        transform
        position={[.45, .34, -6]}
        distanceFactor={1}
      >
        <div className="flex ml-130 gap-10 items-start w-full">
          {/* Board/lesson content */}
          <div
            className="transition-all duration-1000 ease-in-out relative"
            style={{
              opacity: initialLoad ? 1 : 0,
              transform: `scale(${initialLoad ? 1 : .95})`,
              transitionDelay: '.5s'
            }}
          >
            {/* Zoom out icon in top left of board */}
            <div className="absolute top-6 left-6 z-20 cursor-pointer bg-white/80 hover:bg-white/100 rounded-full p-3 shadow-lg transition-all">
              <MdOutlineZoomOutMap onClick={handleZoomLesson} size={38} className="text-zinc-700" />
            </div>
            <div
              ref={containerRef}
              className={`content__container
              ${zoomlesson
                  ? "w-[250.5rem] h-[80.5rem] bg-white/70 dark:bg-zinc-900/80 text-black dark:text-white border-4 border-primary/20 shadow-2xl rounded-3xl backdrop-blur-xl"
                  : "w-[129.5rem] h-[65.5rem] dark:bg-zinc-900/70 text-black dark:text-white border-2 border-primary/10 shadow-xl rounded-2xl backdrop-blur-lg"
                }
              overflow-y-auto p-[3.25rem] flex flex-col items-center justify-center transition-all duration-500 ease-in-out`}
            >
              {/* ...existing code... */}
              
              <div ref={welcomeContentRef} className="animate-bounce animate-duration-1000 opacity-80 mt-[1rem]">
                  <Icon
                    icon="bitcoin-icons:arrow-down-filled"
                    className="!size-[4rem] text-white drop-shadow-md"
                  />
                </div>
              {/* ...existing code... */}
              <div
                ref={loadingContentRef}
                className="text-center max-w-[100rem] flex-col items-center justify-center mt-[2.5rem]"
                style={{ display: 'none', opacity: 0 }}
              >
                <h1 className="text-white text-[5.65rem] font-semibold mb-[5rem] tracking-tight drop-shadow-lg">
                  {loadingMessage}
                </h1>

                <div className="flex flex-col items-center justify-center">
                  <div className="size-full flex items-center justify-center relative">
                    <svg viewBox="25 25 50 50" className="!size-[12rem] loading__svg drop-shadow-lg">
                      <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" strokeWidth="4" fill="none" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* ...existing code... */}
              <div
                ref={explanationContentRef}
                className="size-full flex flex-col items-center"
                style={{ display: 'none', opacity: 0 }}
              >
                <div
                  ref={lessonContentRef}
                  className={`
                  ${zoomlesson ? "text-black" : "text-white/95"}
                  text-[2.85rem] leading-relaxed font-normal whitespace-pre-line
                  `}
                  dangerouslySetInnerHTML={{ __html: formatLessonContent(lessonExplanation) }}
                />
              </div>
            </div>
            {/* ...existing code... */}
            <div
              className="absolute -bottom-[13.55rem] left-1/2 transform -translate-x-1/2"
            >
              <Button
                className={`
                rounded-full bg-white size-[6.25rem] !p-0 hover:bg-white/80 transition-transform hover:scale-105 shadow-lg
                ${lessonExplanationMutation.isPending || isExplanationLoading || isExplanationVisible ? 'pointer-events-none' : ''}
              `}
                onClick={handleGetLessonExplanation}
              >
                {lessonExplanationMutation.isPending || isExplanationLoading ? (
                  <svg viewBox="25 25 50 50" className="!size-[2.75rem] loading__svg drop-shadow-lg">
                    <circle r="20" cy="50" cx="50" className="loading__circle !stroke-black" strokeWidth="4" fill="none" />
                  </svg>
                ) : (
                  <Icon icon="gravity-ui:play-fill" className="!size-[2.75rem] text-black" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Html>
      <Gltf
        src="/models/classroom_default.glb"
        position={[.2, -1.75, -2]} // Seat: 5, row 2, column 2, student 5
      />
      {isExplanationError && (
        <div className="fixed top-5 right-5 bg-red-500/80 text-white p-4 rounded-lg backdrop-blur-md z-50">
          <h3 className="text-lg font-bold mb-2">Error loading lesson</h3>
          <p>{explanationError instanceof Error ? explanationError.message : 'Cannot load lesson'}</p>
        </div>
      )}
    </Float>
  )
}

export default Scene