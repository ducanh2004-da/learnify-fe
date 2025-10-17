import { OptimizeImage } from '@/components'
import { mockCourseImage } from '@/mocks'
import { cn } from '@/lib'

interface CourseImageProps {
  courseId?: string
  src?: string
  alt: string
  folder?: string
  className?: string
}

const CourseImage = ({ 
  courseId = '',
  src = '', 
  alt,
  folder = 'courses',
  className
}: CourseImageProps) => {
  const mappedImage = courseId ? mockCourseImage[courseId] : null
  const imageSrc = mappedImage || src
  
  return (
    <div className={cn('w-full', className)}>
      <OptimizeImage
        src={imageSrc}
        alt={alt}
        folder={folder}
        className="size-full"
      />
    </div>
  )
}

export default CourseImage