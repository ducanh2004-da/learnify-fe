import { useState, useMemo, ChangeEvent } from 'react'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { useDebounceValue } from 'usehooks-ts'

import { CourseCard, courseService } from '@/features/courses'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { MainDropdown } from '@/components'
// categories, levels, sortOptions
import { sortOptions } from '@/mocks'

export default function CoursesPage() {
  const [searchInputValue, setSearchInputValue] = useState<string>('')
  const [debouncedSearchTerm] = useDebounceValue(searchInputValue, 500)
  
  // const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')
  // const [selectedLevel, setSelectedLevel] = useState<string>('All Levels')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAllCourses()
  })

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value)
  }

  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        const matchesSearch = 
          course.courseName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          course.abstract.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          // || course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())

        // const matchesCategory = 
        //   selectedCategory === 'All Categories' 
        //   // || course.category === selectedCategory

        // const matchesLevel = 
        //   selectedLevel === 'All Levels'
        //   // || course.level === selectedLevel

        // return matchesSearch && matchesCategory && matchesLevel
        
        return matchesSearch
      })
      .sort((a, b) => {
        switch (sortBy) {
          // case 'popular':
          //   return (b.students || 0) - (a.students || 0)
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          // case 'price-asc':
          //   return (a.price || 0) - (b.price || 0)
          // case 'price-desc':
          //   return (b.price || 0) - (a.price || 0)
          // case 'rating':
          //   return (b.rating || 0) - (a.rating || 0)
          default:
            return 0
        }
      })
  }, [debouncedSearchTerm, sortBy, courses])

  const handleClearFilters = () => {
    setSearchInputValue('')
    // setSelectedCategory('All Categories')
    // setSelectedLevel('All Levels')
  }

  const showNoResults = !isLoading && filteredCourses.length === 0

  return (
    <div className="w-full px-24 py-10">
      <h1 className="element-animation text-[2.5rem] font-bold mb-3.5">Explore Our Courses</h1>
      
      <section className="w-full mb-8">
        <div className="flex flex-col space-y-6 mb-8 border-b-[.125rem] border-gray-300 pb-9">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="element-animation relative w-[26.5rem]">
                <Input
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  placeholder="Search courses..."
                  className="w-full h-[3.785rem] pl-12 pr-10 text-[1.25rem] border border-slate-200 rounded-full focus:outline-none focus:border-primary/50 transition-colors"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                  <Icon icon="ph:magnifying-glass" className="text-2xl" />
                </div>
                {searchInputValue !== debouncedSearchTerm && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Icon icon="ph:clock-light" className="text-xl" />
                  </div>
                )}
              </div>
              
              {/* <MainDropdown
                value={selectedCategory}
                options={categories}
                onChange={setSelectedCategory}
                placeholder="All Categories"
                minWidth="200px"
              />
              
              <MainDropdown
                value={selectedLevel}
                options={levels}
                onChange={setSelectedLevel}
                placeholder="All Levels"
                minWidth="160px"
              /> */}
                            
              <MainDropdown
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
                placeholder="Sort by"
                minWidth="140px"
              /> 
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="element-animation">
            <h2 className="text-[1.8rem] font-bold text-slate-800">All Courses ({filteredCourses.length})</h2>
            <div className="mt-1">
              {/* selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || */}
              {debouncedSearchTerm ? (
                <p className="text-[1.25rem] text-slate-600">Showing filtered results</p>
              ) : (
                <p className="text-[1.25rem] text-slate-600">Browse our collection of high-quality courses</p>
              )}
            </div>
          </div>
          
          <MainDropdown
            value={itemsPerPage}
            options={[10, 20, 50, 100]}
            onChange={setItemsPerPage}
            placeholder="Show items"
            minWidth="140px"
          />
        </div>
        
        {isLoading ? (
          <div className="element-animation grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
            {[...Array(10)].map((_, index) => (
              <Card key={index} className="overflow-hidden rounded-xl border border-slate-200 py-0 bg-white relative h-full">
                <Skeleton className="w-full h-[14.35rem] rounded-t-xl" />
                
                <CardContent className="px-5 pb-[1.75rem] flex flex-col flex-grow">
                  <CardHeader className="p-0 mb-3.5">
                    <Skeleton className="h-7 w-full mb-2" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-5/6 mt-1.5" />
                  </CardHeader>
                  
                  <div className="flex-grow" />
                  
                  <CardFooter className="p-0 mt-auto">
                    <Skeleton className="h-12 w-full rounded-full" />
                  </CardFooter>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : showNoResults ? (
          <div className="flex flex-col items-center justify-center text-center py-[10rem]">
            <Icon icon="ph:magnifying-glass-light" className="text-[5.5rem] text-[#2b2b2b] mb-6" />
            <h3 className="text-3xl font-bold text-slate-700 mb-3">No courses found...</h3>
            <p className="text-[1.25rem] text-slate-500 max-w-xl">
              We couldn't find any courses matching your current filters. Try changing your search terms or filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-6 rounded-full bg-primary text-white px-8.5 py-3.5 text-[1.45rem] border border-primary font-medium cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="element-animation grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
            {filteredCourses.slice(0, itemsPerPage).map((course) => (
              <CourseCard 
                key={course.id}
                course={course}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}