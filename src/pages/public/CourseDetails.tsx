import React, { JSX, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib'
import { toast } from 'sonner'

import { courseService, lessonService, CourseImage } from '@/features/courses'
import { useAuthStore } from '@/stores'

import { Button } from '@/components/ui/button'
import { Loading } from '@/components'
import MindmapBox from '@/features/classroom/components/MindmapBox'

import * as ReactDOM from 'react-dom'
import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
    width: '100%',
    maxWidth: 900
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

// Lightweight interfaces so TS is helpful. Replace with your real types if available.
interface Course {
  id: string
  courseName: string
  abstract?: string
  keyLearnings?: string[]
  image?: { name?: string; folder?: string }
}

interface Lesson {
  id: string
  lessonName: string
  updatedAt: string
}

export default function CourseDetailsPage(): JSX.Element {
  const { courseId } = useParams<{ courseId?: string }>()
  const navigate = useNavigate()
  const { userDetails, user } = useAuthStore()
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const handleClickOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const queryResults = useQueries({
    queries: [
      {
        queryKey: ['course', courseId],
        queryFn: () => courseService.getCourseById(courseId as string),
        enabled: !!courseId
      },
      {
        queryKey: ['lessons', courseId],
        queryFn: () => lessonService.getLessonsByCourseId(courseId as string),
        enabled: !!courseId
      },
      {
        queryKey: ['enrollments', userDetails?.id],
        queryFn: () => {
          if (!userDetails?.id) return [] as any
          return courseService.getUserEnrollments(userDetails.id)
        },
        enabled: !!userDetails?.id
      }
    ],
    combine: (results) => {
      const [courseResult, lessonsResult, enrollmentsResult] = results
      return {
        course: courseResult.data as Course,
        lessons: (lessonsResult.data || []) as Lesson[],
        enrollments: (enrollmentsResult.data || []) as any[],
        isLoading: courseResult.isLoading || lessonsResult.isLoading || enrollmentsResult.isLoading,
        courseError: courseResult.error
      }
    }
  }) as any

  const { course, lessons = [], enrollments = [], isLoading, courseError } = queryResults

  const isEnrolled = useMemo(() => (
    Array.isArray(enrollments) && enrollments.some((en: any) => en.courseId === courseId)
  ), [enrollments, courseId])

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!userDetails?.id || !courseId) throw new Error('Missing user or course information')
      const totalLessons = Number((lessons.length || 0).toFixed(1))
      return courseService.enrollCourse(userDetails.id, courseId, totalLessons)
    },
    onSuccess: () => {
      toast.success('Enrollment successful!')
      queryClient.invalidateQueries({ queryKey: ['enrollments', userDetails?.id] })
    },
    onError: (error: any) => {
      console.error('Enrollment failed:', error)
      toast.error(error?.message || 'Enrollment failed. Please try again later.')
    }
  })

  const handleEnroll = () => {
    if (!user) {
      toast.info('Please login to enroll in the course.')
      navigate('/auth/login')
      return
    }
    enrollMutation.mutate()
  }

  const goToFirstLesson = () => {
    if (lessons.length > 0) navigate(`/dashboard/classroom/${courseId}/lessons/${lessons[0].id}`)
    else toast.info('This course does not have any lessons yet.')
  }

  const renderEnrollmentAction = () => (
    <Button
      className={cn(
        'w-full rounded-full py-4 text-[1rem] sm:text-[1.35rem] font-medium h-auto shadow-sm',
        enrollMutation.isPending && !isEnrolled ? 'pointer-events-none opacity-80' : 'bg-black hover:bg-zinc-800 text-white'
      )}
      onClick={isEnrolled ? goToFirstLesson : handleEnroll}
    >
      {enrollMutation.isPending ? (
        <>
          <svg viewBox="25 25 50 50" className="loading__svg !w-[1.25rem] mr-2 inline-block align-middle">
            <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
          </svg>
          Enrolling...
        </>
      ) : isEnrolled ? (
        'Go To Course'
      ) : (
        <>
          Enroll Now
          <Icon icon="ph:arrow-right" className="text-[1.2rem] ml-2" />
        </>
      )}
    </Button>
  )

  useEffect(() => {
    // ensure top scroll when course changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [courseId])

  if (isLoading) return <Loading content="Loading course details..." />

  if (courseError || !course) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <div className="text-[6rem] sm:text-[14rem] font-bold text-primary -mb-8">404</div>
        <h1 className="text-[1.5rem] sm:text-[3.5rem] font-bold mb-2">Course Not Found</h1>
        <p className="text-[1rem] sm:text-[1.25rem] max-w-xl text-center text-zinc-600 mb-6">{courseError?.message || 'The course you are looking for might have been removed or is temporarily unavailable.'}</p>
        <div className="flex gap-4">
          <Link to="/courses" className="rounded-full bg-primary text-white px-6 py-2">Back to Courses</Link>
          <button onClick={() => window.location.reload()} className="text-primary">Reload Page</button>
        </div>
      </div>
    )
  }

  const { id, courseName, abstract, keyLearnings, image } = course

  return (
    <div className="w-full bg-white text-zinc-900">
      {/* HERO */}
      <section className="bg-[#1d1d1d] text-white py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 lg:pr-8">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{courseName}</h1>
            <p className="text-sm sm:text-lg md:text-[1.25rem] text-zinc-300 mb-6 max-w-3xl">{abstract}</p>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                <Icon icon="ph:user-circle-fill" className="text-[1.6rem] text-zinc-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">AI Teacher</h3>
                <p className="text-sm text-zinc-400">Course Instructor</p>
              </div>
            </div>

            {/* on small screens show CTA below text; on large, CTA is in sidebar */}
            <div className="block lg:hidden mb-6">
              {renderEnrollmentAction()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(keyLearnings || []).slice(0, 4).map((k: any, i: any) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon icon="ph:check-circle-fill" className="text-[1.1rem] mt-1 text-zinc-300" />
                  <span className="text-sm sm:text-base text-zinc-200">{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-[570px] lg:w-[480px]">
            <div className="relative rounded-lg overflow-hidden shadow-xl aspect-video">
              <CourseImage courseId={id} src={image?.name} alt={courseName} folder={image?.folder} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-zinc-100 transition-colors duration-200 pointer-events-auto">
                  <Icon icon="ph:play-fill" className="text-black text-[1.25rem]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN -> responsive two-column */}
      <section className="container mx-auto px-4 sm:px-6 md:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* content */}
          <main className="flex-1 lg:pr-6">
            <article className="bg-white rounded-lg border border-zinc-200 shadow-md p-6 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon icon="ph:graduation-cap-fill" className="text-[1.6rem] text-zinc-800" />
                What You'll Learn
              </h2>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(keyLearnings && keyLearnings.length > 0) ? (
                  keyLearnings.map((item: any, idx: any) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Icon icon="ph:check-circle-fill" className="text-[1.1rem] text-zinc-700 mt-1" />
                      <span className="text-sm sm:text-base text-zinc-700">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="col-span-2 text-center py-4 text-zinc-500">No learning points available for this course yet.</li>
                )}
              </ul>
            </article>

            <article className="bg-white rounded-lg border border-zinc-200 shadow-md p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                <Icon icon="ph:path-fill" className="text-[1.6rem] text-zinc-800" />
                Course Curriculum
              </h2>

              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-1 bg-zinc-200 hidden md:block" />
                <div className="space-y-6">
                  {lessons.length > 0 ? lessons.map((lesson: any, index: any) => (
                    <div key={lesson.id} className="relative flex flex-col md:flex-row items-start gap-4 md:gap-6">
                      <div className="z-10 flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-black text-white flex items-center justify-center text-[0.95rem] md:text-[1.1rem] font-bold border-4 border-white shadow-md">
                        {index + 1}
                      </div>

                      <div className="bg-gradient-to-r from-zinc-50 to-white border border-zinc-200 rounded-lg p-4 flex-1 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold text-zinc-800 mb-2">{lesson.lessonName}</h3>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-zinc-500 text-sm">
                            <Icon icon="ph:clock-fill" />
                            <span>Updated: {new Date(lesson.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2 md:mt-0">
                            {isEnrolled ? (
                              <Button onClick={() => navigate(`/dashboard/classroom/${courseId}/lessons/${lesson.id}`)} variant="default" className="rounded-full px-4 py-2 text-sm bg-black text-white">Start Lesson <Icon icon="ph:arrow-right" /></Button>
                            ) : (
                              <Button onClick={handleEnroll} variant="outline" className="rounded-full px-4 py-2 text-sm">Enroll to Unlock</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Icon icon="ph:book-open" className="text-[3rem] text-zinc-400 mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-zinc-600">No lessons available for this course yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </main>

          {/* sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Free</h3>
                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">Open Access</div>
                </div>

                <div className="mb-4">{renderEnrollmentAction()}</div>
                <p className="text-center text-zinc-500 text-sm">{isEnrolled ? 'Continue your learning journey' : 'Access the course content immediately'}</p>

                <hr className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3"><Icon icon="ph:video-fill" /> <span className="text-sm">Video lectures</span></div>
                  <div className="flex items-center gap-3"><Icon icon="ph:file-text-fill" /> <span className="text-sm">Practice materials</span></div>
                  <div className="flex items-center gap-3"><Icon icon="ph:chat-circle-text-fill" /> <span className="text-sm">AI Teacher interaction</span></div>
                  <div className="flex items-center gap-3"><Icon icon="ph:certificate-fill" /> <span className="text-sm">Completion certificate</span></div>
                  <div className="flex items-center gap-3"><Icon icon="ph:infinity-fill" /> <span className="text-sm">Lifetime access</span></div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <Icon icon="ph:users-three-fill" className="text-[1.25rem]" />
                    <div>
                      <p className="text-sm font-semibold">Join 2000+ students</p>
                      <p className="text-xs text-zinc-500">Learning with AI Teacher</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <Icon icon="ph:clock-countdown-fill" className="text-[1.25rem]" />
                    <div>
                      <p className="text-sm font-semibold">Start learning today</p>
                      <p className="text-xs text-zinc-500">At your own pace</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button className="w-full text-sm" onClick={handleClickOpen}>Mind map of the course</Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Mindmap Dialog (MUI) */}
      <BootstrapDialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open} fullWidth maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">Course Summary</DialogTitle>
        <IconButton aria-label="close" onClick={handleClose} sx={(theme) => ({ position: 'absolute', right: 8, top: 8, color: theme.palette.grey[500] })}>
          ✕
        </IconButton>
        <DialogContent dividers>
          <Typography component="div" gutterBottom>
            <MindmapBox courseId={courseId} graphqlEndpoint={import.meta.env.VITE_API_BACKEND_URL || 'https://learnify-be.onrender.com/graphql'} />
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>Save to gallery</Button>
        </DialogActions>
      </BootstrapDialog>

      {/* Mobile fixed CTA when not visible on screen */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="max-w-3xl mx-auto">
          {renderEnrollmentAction()}
        </div>
      </div>
    </div>
  )
}
