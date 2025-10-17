import { useParams, useNavigate, Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib'
import { toast } from 'sonner'

import { courseService, lessonService, CourseImage } from '@/features/courses'
import { useAuthStore } from '@/stores'

import { Button } from '@/components/ui/button'
import { Loading } from '@/components'
import * as React from 'react';

import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MindmapBox from '@/features/classroom/components/MindmapBox'
// import { Badge } from '@/components/ui/badge'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));


export default function CourseDetailsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { userDetails, user } = useAuthStore()
  const queryClient = useQueryClient()

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

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
          if (!userDetails?.id) return []
          return courseService.getUserEnrollments(userDetails.id)
        },
        enabled: !!userDetails?.id
      }
    ],
    combine: (results) => {
      const [courseResult, lessonsResult, enrollmentsResult] = results

      return {
        course: courseResult.data,
        lessons: lessonsResult.data || [],
        enrollments: enrollmentsResult.data || [],
        isLoading: courseResult.isLoading || lessonsResult.isLoading || enrollmentsResult.isLoading,
        courseError: courseResult.error
      }
    }
  })

  const { course, lessons, enrollments, isLoading, courseError } = queryResults
  const isEnrolled = enrollments?.some(enrollment => enrollment.courseId === courseId)

  const enrollMutation = useMutation({
    mutationFn: () => {
      if (!userDetails?.id || !courseId) {
        throw new Error('Missing user or course information')
      }

      if (!courseService || typeof courseService.enrollCourse !== 'function') {
        throw new Error('Course service not available')
      }

      const totalLessons = parseFloat(lessons.length.toFixed(1))

      return courseService.enrollCourse(
        userDetails.id,
        courseId,
        totalLessons
      )
    },
    onSuccess: () => {
      toast.success('Enrollment successful!')
      queryClient.invalidateQueries({ queryKey: ['enrollments', userDetails?.id] })
    },
    onError: (error: Error) => {
      console.error('Enrollment failed:', error)
      toast.error(error.message || 'Enrollment failed. Please try again later.')
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
    if (lessons.length > 0) {
      navigate(`/dashboard/classroom/${courseId}/lessons/${lessons[0].id}`)
    } else {
      toast.info('This course does not have any lessons yet.')
    }
  }

  const renderEnrollmentAction = () => {
    return (
      <Button
        className={cn(
          'w-full rounded-full py-4 text-[1.35rem] font-medium h-auto shadow-sm bg-black hover:bg-zinc-800',
          enrollMutation.isPending && !isEnrolled && 'pointer-events-none'
        )}
        onClick={isEnrolled ? goToFirstLesson : handleEnroll}
      >
        {enrollMutation.isPending ? (
          <>
            <svg viewBox="25 25 50 50" className="loading__svg !w-[1.75rem] mr-2">
              <circle r="20" cy="50" cx="50" className="loading__circle !stroke-white" />
            </svg>
            Enrolling...
          </>
        ) : isEnrolled ? (
          <>
            Go To Course
          </>
        ) : (
          <>
            Enroll Now
            <Icon icon="ph:arrow-right" className="text-[1.5rem] ml-2" />
          </>
        )}
      </Button>
    )
  }

  if (isLoading) return <Loading content="Loading course details..." />

  if (courseError || !course) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={cn(
            'absolute inset-0',
            '[background-size:40px_40px]',
            '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
            'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
            'pointer-events-none'
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-[14rem] font-bold text-primary -mb-[3.5rem]">
            404
          </div>
          <h1 className="text-[3.5rem] font-bold capitalize text-slate-900 mb-[.75rem]">
            Course Not Found
          </h1>
          <p className="text-[1.35rem] text-slate-600 max-w-[35rem] mb-[1.5rem]">
            {courseError instanceof Error ? courseError.message : 'The course you are looking for might have been removed, renamed, or is temporarily unavailable.'}
          </p>
          <div className="flex items-center gap-10 mt-4">
            <Link
              to="/courses"
              className="rounded-full bg-primary text-white px-7 py-3.5 border border-primary font-medium flex items-center gap-5"
            >
              <Icon icon="ri:arrow-left-long-line" className="text-[1.75rem]" />
              <span className="text-[1.35rem]">Back to Courses</span>
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
      </div>
    )
  }

  const {
    id,
    courseName,
    abstract,
    keyLearnings,
    // instructor, 
    // level, 
    // duration, 
    // rating, 
    // students, 
    // price, 
    // category,
    image
  } = course

  const renderLessonButton = (lessonId: string) => {
    if (isEnrolled) {
      return (
        <Button
          onClick={() => navigate(`/dashboard/classroom/${courseId}/lessons/${lessonId}`)}
          variant="default"
          className="rounded-full !px-5 py-3 text-[1.15rem] bg-black hover:bg-zinc-800 h-auto"
        >
          Start Lesson
          <Icon icon="ph:arrow-right" className="text-[1.2rem] ml-1" />
        </Button>
      )
    }

    return (
      <Button
        onClick={handleEnroll}
        variant="outline"
        className="rounded-full !px-5 py-3 text-[1.15rem] bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 h-auto"
      >
        <Icon icon="ph:lock-simple" className="text-[1.2rem] mr-1" />
        Enroll to Unlock
      </Button>
    )
  }

  return (
    <div className="w-full bg-white text-zinc-900">
      <div className="bg-[#1d1d1d] py-16 relative">
        <div className="w-full flex flex-col md:flex-row items-center px-6 sm:px-12 md:px-24">
          <div className="w-full md:w-[55%] mb-10 md:mb-0">
            <h1 className="text-[3rem] md:text-[4rem] font-bold text-white mb-8 leading-tight">
              {courseName}
            </h1>

            <p className="text-[1.6rem] text-zinc-300 mb-10 leading-relaxed max-w-3xl">
              {abstract}
            </p>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                <Icon icon="ph:user-circle-fill" className="text-[3.5rem] text-zinc-400" />
              </div>
              <div>
                <h3 className="text-[1.5rem] font-semibold text-white">AI Teacher</h3>
                <p className="text-[1.2rem] text-zinc-400">Course Instructor</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[45%]">
            <div className="aspect-video rounded-lg overflow-hidden shadow-xl relative">
              <CourseImage
                courseId={id}
                src={image?.name}
                alt={courseName}
                folder={image?.folder}
                className="h-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-xl hover:bg-zinc-100 transition-colors duration-300">
                  <Icon icon="ph:play-fill" className="text-black text-[1.8rem] ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-24 py-14">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="w-full lg:w-8/12">
            <div className="bg-white rounded-lg border border-zinc-200 shadow-md hover:shadow-lg transition-shadow p-10 mb-12">
              <h2 className="text-[2.5rem] font-bold text-zinc-900 mb-8 flex items-center gap-4">
                <Icon icon="ph:graduation-cap-fill" className="text-zinc-800 text-[2.5rem]" />
                What You'll Learn
              </h2>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {keyLearnings && keyLearnings.length > 0 ? (
                  keyLearnings.map((item, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <Icon icon="ph:check-circle-fill" className="text-[1.6rem] text-zinc-800 mt-0.5 flex-shrink-0" />
                      <span className="text-[1.35rem] text-zinc-700">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="col-span-2 text-center py-4">
                    <p className="text-[1.35rem] text-zinc-500">No learning points available for this course yet.</p>
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-lg border border-zinc-200 shadow-md hover:shadow-lg transition-shadow p-10 mb-12">
              <h2 className="text-[2.5rem] font-bold text-zinc-900 mb-8 flex items-center gap-4">
                <Icon icon="ph:path-fill" className="text-zinc-800 text-[2.5rem]" />
                Course Curriculum
              </h2>

              <div className="relative">
                <div className="absolute left-[27px] top-0 bottom-0 w-1 bg-zinc-200"></div>

                <div className="space-y-8">
                  {lessons && lessons.length > 0 ? (
                    lessons.map((lesson, index) => (
                      <div key={lesson.id} className="relative flex items-start gap-6">
                        <div className="z-10 flex-shrink-0 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-[1.4rem] font-bold border-4 border-white shadow-md">
                          {index + 1}
                        </div>
                        <div className="bg-gradient-to-r from-zinc-50 to-white border border-zinc-200 rounded-lg p-6 w-full shadow-sm">
                          <h3 className="text-[1.6rem] font-semibold text-zinc-800 mb-3">{lesson.lessonName}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-zinc-500">
                              <Icon icon="ph:clock-fill" className="text-[1.4rem]" />
                              <span className="text-[1.2rem]">
                                Updated: {new Date(lesson.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {renderLessonButton(lesson.id)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Icon icon="ph:book-open" className="text-[4rem] text-zinc-400 mx-auto mb-4" />
                      <p className="text-[1.4rem] text-zinc-600">No lessons available for this course yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-4/12">
            <div className="sticky top-6">
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="p-8 border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[2rem] font-bold text-zinc-900">Free</h3>
                    <div className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-[1.1rem] font-medium">
                      Open Access
                    </div>
                  </div>

                  {renderEnrollmentAction()}

                  <p className="text-center text-zinc-500 text-[1.25rem] mt-3.5">
                    {isEnrolled
                      ? 'Continue your learning journey'
                      : 'Access the course content immediately'}
                  </p>
                </div>

                <div className="p-8">
                  <h3 className="text-[1.8rem] font-bold text-zinc-900 mb-5">This Course Includes</h3>
                  <ul className="space-y-5">
                    <li className="flex items-center gap-4">
                      <Icon icon="ph:video-fill" className="text-[1.4rem] text-zinc-700" />
                      <span className="text-[1.35rem] text-zinc-700">Video lectures</span>
                    </li>
                    <li className="flex items-center gap-4">
                      <Icon icon="ph:file-text-fill" className="text-[1.4rem] text-zinc-700" />
                      <span className="text-[1.35rem] text-zinc-700">Practice materials</span>
                    </li>
                    <li className="flex items-center gap-4">
                      <Icon icon="ph:chat-circle-text-fill" className="text-[1.4rem] text-zinc-700" />
                      <span className="text-[1.35rem] text-zinc-700">AI Teacher interaction</span>
                    </li>
                    <li className="flex items-center gap-4">
                      <Icon icon="ph:certificate-fill" className="text-[1.4rem] text-zinc-700" />
                      <span className="text-[1.35rem] text-zinc-700">Completion certificate</span>
                    </li>
                    <li className="flex items-center gap-4">
                      <Icon icon="ph:infinity-fill" className="text-[1.4rem] text-zinc-700" />
                      <span className="text-[1.35rem] text-zinc-700">Lifetime access</span>
                    </li>
                  </ul>
                </div>

                <div className="p-8 bg-zinc-50 border-t border-zinc-200">
                  <div className="flex items-start gap-4 mb-5">
                    <Icon icon="ph:users-three-fill" className="text-[1.8rem] text-zinc-800" />
                    <div>
                      <p className="text-[1.4rem] font-semibold text-zinc-800">Join 2000+ students</p>
                      <p className="text-[1.2rem] text-zinc-600">Learning with AI Teacher</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Icon icon="ph:clock-countdown-fill" className="text-[1.8rem] text-zinc-800" />
                    <div>
                      <p className="text-[1.4rem] font-semibold text-zinc-800">Start learning today</p>
                      <p className="text-[1.2rem] text-zinc-600">At your own pace</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 mt-8">
                    <Button className="w-[100%] h-[30px] full-rounded text-xl" onClick={handleClickOpen}>Mind map of the course</Button>
                  </div>

                  <BootstrapDialog
                    onClose={handleClose}
                    aria-labelledby="customized-dialog-title"
                    open={open}
                  >
                    <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                      Course Summary
                    </DialogTitle>
                    <IconButton
                      aria-label="close"
                      onClick={handleClose}
                      sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                      })}
                    >
                      Close
                    </IconButton>
                    <DialogContent dividers>
                      <Typography component="div" gutterBottom>Mind map
                        <MindmapBox courseId={courseId} graphqlEndpoint="http://localhost:10000/graphql" />
                      </Typography>
                    </DialogContent>
                    <DialogActions>
                      <Button autoFocus onClick={handleClose}>
                        Save to gallery
                      </Button>
                    </DialogActions>
                  </BootstrapDialog>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}