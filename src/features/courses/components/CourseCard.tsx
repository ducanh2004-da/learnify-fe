import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { cn } from '@/lib'
import { Course } from '@/features/courses'

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter,
  // CardAction 
} from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'

import CourseImage from './CourseImage'

interface CourseCardProps {
  course: Course
  className?: string
}

const CourseCard = ({ course, className }: CourseCardProps) => {
  const {
    id,
    courseName,
    abstract,
    // createdAt,
    // updatedAt,
    // instructor,
    // level,
    // duration,
    // rating,
    // students,
    // price,
    // category,
    image,
  } = course

  // const formattedRating = rating?.toFixed(1)
  
  return (
    <Card className={cn(
      'overflow-hidden rounded-xl border border-slate-200 hover:border-primary transition-all duration-(--duration-main) py-0 hover:shadow-xl bg-white relative group h-full',
      className
    )}>
      {/* <CardAction className="absolute top-4 right-4 z-10">
        <Badge variant="default" className="bg-black text-white px-[.75rem] py-[.35rem] pt-[.5rem] text-[1.2rem] rounded-full font-semibold shadow-xl">
          ${price?.toFixed(2)}
        </Badge>
      </CardAction> */}
      
      <CourseImage
        courseId={id}
        src={image?.name}
        alt={courseName} 
        folder={image?.folder}
        className="h-[14.35rem] flex-shrink-0 -mb-[.5vh]"
      />
      
      <CardContent className="px-5 pb-[1.75rem] flex flex-col flex-grow">
        {/* <div className="flex justify-between items-center mb-4.5">
          <Badge variant="default" className="text-[1rem] rounded-full bg-primary/10 font-semibold text-primary px-3 py-1">
            {category}
          </Badge>
          <span className="text-[1rem] font-medium text-slate-600">
            {level}
          </span>
        </div> */}
        
        <CardHeader className="p-0 mb-3.5">
          <CardTitle className="text-[1.4rem] font-bold text-slate-800 line-clamp-2 leading-tight">
            {courseName}
          </CardTitle>
          <CardDescription className="text-[1rem] text-slate-600 line-clamp-2 mt-2">
            {abstract}
          </CardDescription>
        </CardHeader>
        
        {/* <div className="flex items-center gap-2 mb-3.5">
          <Icon icon="ph:user-circle-fill" className="text-[1.75rem] text-slate-500" />
          <span className="text-[1rem] font-medium text-slate-700">{instructor}</span>
        </div> */}

        {/* <div className="flex items-center justify-between gap-1.5 mb-5">
          <div className="flex items-center gap-[.35rem]">
            <div className="flex items-center gap-[.25rem] text-amber-500">
              <Icon icon="solar:star-bold" className="text-xl mb-[.1rem]" />
              <span className="text-[1rem] font-bold">{formattedRating}</span>
            </div>
            <span className="text-[1rem] text-slate-500">({students?.toLocaleString()} students)</span>
          </div>
          <div className="flex items-center gap-[.35rem] text-slate-600">
            <Icon icon="tdesign:time" className="text-xl" />
            <span className="text-[1rem]">{duration}</span>
          </div>
        </div> */}
        
        <CardFooter className="p-0 mt-auto">
          <Link 
            to={`/courses/${id}`} 
            className="w-full py-3.5 rounded-full text-[1.2rem] font-semibold text-center transition-all
              border-2 border-black text-black
              flex items-center justify-center gap-3
              hover:bg-black hover:text-white"
          >
            View Course
            <Icon icon="carbon:view-filled" className="text-[1.5rem]" />
          </Link>
        </CardFooter>
      </CardContent>
    </Card>
  )
} 

export default CourseCard